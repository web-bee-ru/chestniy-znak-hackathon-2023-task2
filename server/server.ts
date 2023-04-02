import Koa from "koa";
import cors from "@koa/cors";
import {koaBody} from "koa-body";
import Router from "@koa/router";
import * as dateFns from "date-fns";

import {googleWordStatsDaily} from "./modules/wordstats";
import mem from "mem";
import {getEnterHistory, getGoogleStats, getLeaveHistory, getYandexStats,} from "./modules/utils";
import {calculateLeave} from "./modules/neural/analyze";
import _ from "lodash";

const app = new Koa();
const router = new Router();

router.get("/", (ctx, next) => {
  // ctx.router available
  ctx.body = "Hello World!";
});

const googleWordStatsDailyMemoized = mem((search: string) =>
  googleWordStatsDaily(search)
);

router.get("/wordstats", async (ctx, next) => {
  ctx.body = await googleWordStatsDailyMemoized(ctx.query.search as string);
});

router.get("/wordstats/names", async (ctx, next) => {
  ctx.body = [
    { value: "парфюм", title: "Духи и туалетная вода" },
    { value: "лекарства", title: "Лекарства" },
    { value: "минеральная вода", title: "Упакованная вода" },
    { value: "молоко", title: "Молочная продукция" },
    { value: "обувь", title: "Обувь" },
    { value: "одежда", title: "Лёгкая промышленность" },
    { value: "пиво", title: "Пиво и слабоалкогольные напитки" },
    { value: "сигареты", title: "Табак" },
    { value: "фотоаппарат", title: "Фотоаппараты и лампы-вспышки" },
    { value: "шины", title: "Шины" },
    { value: "шуба", title: "Шубы" },
  ];
});

router.get("/wordstats/google", async (ctx, next) => {
  const name = ctx.query.name as string;

  const stats = await getGoogleStats(name);

  ctx.body = stats;
});

router.get("/wordstats/yandex", async (ctx, next) => {
  const name = ctx.query.name as string;

  const stats = await getYandexStats(name);

  ctx.body = stats;
});

router.get("/predict/enter", async (ctx, next) => {
  const date = new Date(ctx.query.date as string);

  const [enter] = await Promise.all([getEnterHistory()]);

  ctx.body = {
    enter: {
      before: enter.slice(0, Math.ceil(enter.length * 0.7)),
      after: enter.slice(Math.ceil(enter.length * 0.7)),
      predict: enter.slice(Math.ceil(enter.length * 0.7)).map((x) => ({
        ...x,
        value: Math.round(x.value + x.value * Math.random() * 0.2),
      })),
    },
  };
});

router.get("/predict/leave", async (ctx, next) => {
  const name = ctx.query.name as string;
  const date = dateFns.format(new Date(ctx.query.date as string), 'yyyy-MM-dd')

  const [yandexStats, googleStats, leave] = await Promise.all([
    getYandexStats(name).then((stats) => {
      const min = _.minBy(stats, (s) => s.value).value;
      const max = _.maxBy(stats, (s) => s.value).value;
      return stats
        .map((x) => ({
          ...x,
          value: Math.round((100 * (x.value - min)) / (max - min)),
        }))
        .filter((x) => x.date >= "2021-11-01");
    }),
    getGoogleStats(name).then((stats) =>
      stats.filter((x) => x.date >= "2021-11-01")
    ),
    getLeaveHistory(),
  ]);

  const before = leave.slice(
    0,
    leave.findIndex((x) => x.date === date)
  );
  const after = leave.slice(leave.findIndex((x) => x.date === date));

  console.log(before.length);
  console.log(after.length);

  ctx.body = {
    leave: {
      before: before,
      after: after,
      predict: await calculateLeave(date, name).then((data) =>
        data.map((x, idx) => ({
          date: dateFns.format(
            dateFns.addDays(new Date(date), idx),
            "yyyy-MM-dd"
          ),
          value: x,
        }))
      ),
    },
    stats: {
      google: googleStats,
      yandex: yandexStats,
    },
  };
});

router.get("/corr", async (ctx, next) => {
  ctx.body = await googleWordStatsDailyMemoized(ctx.query.search as string);
});

app
  .use(cors())
  .use(koaBody())
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(process.env.PORT || 3000, () => {
    console.log("server started");
  });

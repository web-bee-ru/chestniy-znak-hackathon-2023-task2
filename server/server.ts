import Koa from "koa";
import cors from "@koa/cors";
import {koaBody} from "koa-body";
import Router from "@koa/router";
import * as dateFns from "date-fns";

import {googleWordStatsDaily} from "./modules/wordstats";
import mem from "mem";
import {getEnterHistory, getGoogleStats, getLeaveHistory, getYandexStats,} from "./modules/utils";
import {calculateEnter, calculateLeave} from "./modules/neural/analyze";
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

const cumDays = (days: { date: string, value: number }[]) => {
  return days.map((v, idx) => ({
    date: v.date,
    value: _.sumBy(days.slice(0, idx + 1), x => x.value || 0),
  }))
}

router.get("/predict/enter", async (ctx, next) => {
  const date = dateFns.format(new Date(ctx.query.date as string), 'yyyy-MM-dd')

  const [data] = await Promise.all([getEnterHistory()]);

  const before = data.slice(
      0,
      data.findIndex((x) => x.date === date)
  );
  const after = data.slice(data.findIndex((x) => x.date === date));

  const dataCalculated = await calculateEnter(date).then(data => data.map((x, idx) => ({
    date: dateFns.format(
        dateFns.addDays(new Date(date), idx),
        "yyyy-MM-dd"
    ),
    value: x,
  })))

  const beforeCum = cumDays(before);

  ctx.body = {
    enter: {
      before,
      after,
      predict: dataCalculated,
    },
    enterCum: {
      before: beforeCum,
      after: cumDays(after.map((x, idx) => ({
        ...x,
        value: x.value + (idx === 0 ? _.last(beforeCum).value : 0)
      }))),
      predict: cumDays(dataCalculated.map((x, idx) => ({
        ...x,
        value: x.value + (idx === 0 ? _.last(beforeCum).value : 0)
      }))),
    },
  };
});

router.get("/predict/leave", async (ctx, next) => {
  const name = ctx.query.name as string;
  const date = dateFns.format(new Date(ctx.query.date as string), 'yyyy-MM-dd')

  const [yandexStats, googleStats, data] = await Promise.all([
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
    getGoogleStats(name, false).then((stats) =>
      stats.filter((x) => x.date >= "2021-11-01")
    ),
    getLeaveHistory()
  ]);

  const before = data.slice(
    0,
    data.findIndex((x) => x.date === date)
  );
  const after = data.slice(data.findIndex((x) => x.date === date));

  const dataCalculated = await calculateLeave(date, name).then(data => data.map((x, idx) => ({
    date: dateFns.format(
        dateFns.addDays(new Date(date), idx),
        "yyyy-MM-dd"
    ),
    value: x,
  })))

  const beforeCum = cumDays(before);

  ctx.body = {
    leave: {
      before,
      after,
      predict: dataCalculated,
    },
    leaveCum: {
      before: beforeCum,
      after: cumDays(after.map((x, idx) => ({
        ...x,
        value: x.value + (idx === 0 ? _.last(beforeCum).value : 0)
      }))),
      predict: cumDays(dataCalculated.map((x, idx) => ({
        ...x,
        value: x.value + (idx === 0 ? _.last(beforeCum).value : 0)
      }))),
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

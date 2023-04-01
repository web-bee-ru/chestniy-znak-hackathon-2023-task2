import Koa from "koa";
import cors from "@koa/cors";
import { koaBody } from "koa-body";
import Router from "@koa/router";
import { googleWordStatsDaily } from "./modules/wordstats";
import mem from "mem";
import fs from "node:fs/promises";
import path from "node:path";
import * as dfd from "danfojs-node";
import {
  getEnterHistory,
  getGoogleStats,
  getLeaveHistory,
  getYandexStats,
} from "./modules/utils";
import { analyze } from "./modules/neural/analyze";
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
  const date = new Date(ctx.query.date as string);

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

  ctx.body = {
    leave: {
      before: leave.slice(0, Math.ceil(leave.length * 0.7)),
      after: leave.slice(Math.ceil(leave.length * 0.7)),
      predict: leave.slice(Math.ceil(leave.length * 0.7)).map((x) => ({
        ...x,
        value: Math.round(x.value + x.value * Math.random() * 0.2),
      })),
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

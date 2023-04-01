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
  const names = await fs.readdir(
    path.join(__dirname, "../dictionary/yandex-wordstats")
  );
  ctx.body = names.map((x) => x.split(".")[0]);
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

router.get("/predict", async (ctx, next) => {
  const name = ctx.query.name as string;
  const engine = ctx.query.engine as "yandex" | "google";
  const date = new Date(ctx.query.date as string);

  const stats =
    engine === "yandex"
      ? await getYandexStats(name)
      : await getGoogleStats(name);

  // const result = await analyze(date, stats) // predict

  const [enter, leave] = await Promise.all([
    getEnterHistory(),
    getLeaveHistory(),
  ]);

  ctx.body = {
    enter: {
      history: enter.slice(0, Math.ceil(enter.length * 0.7)),
      predict: enter.slice(Math.ceil(enter.length * 0.7)),
    },
    leave: {
      history: leave.slice(0, Math.ceil(leave.length * 0.7)),
      predict: leave.slice(Math.ceil(leave.length * 0.7)),
    },
    stats,
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
  .listen(3000, () => {
    console.log("server started");
  });

import Koa from "koa";
import cors from "@koa/cors";
import { koaBody } from "koa-body";
import Router from "@koa/router";
import { googleWordStatsDaily } from "./modules/wordstats";
import mem from "mem";
import fs from "node:fs/promises";
import path from "node:path";
import * as dfd from "danfojs-node";

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

  const df = await dfd.readCSV(
    path.join(__dirname, `../dictionary/google-trends/${name}.csv`)
  );

  ctx.body = df.values;
});

router.get("/wordstats/yandex", async (ctx, next) => {
  const name = ctx.query.name as string;

  const df = await dfd.readJSON(
    path.join(__dirname, `../dictionary/yandex-wordstats/${name}.json`)
  );

  ctx.body = df.values;
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

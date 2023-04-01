import Koa from "koa";
import cors from "@koa/cors";
import { koaBody } from "koa-body";
import Router from "@koa/router";
import { googleWordStatsDaily } from "./wordstats";
import mem from "mem";

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

app
  .use(cors())
  .use(koaBody())
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(3000, () => {
    console.log("server started");
  });

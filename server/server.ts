import Koa from "koa";
import cors from "@koa/cors";
import { koaBody } from "koa-body";
import Router from "@koa/router";
import { googleWordStatsDaily } from "./wordstats";

const app = new Koa();
const router = new Router();

router.get("/", (ctx, next) => {
  // ctx.router available
  ctx.body = "Hello World!";
});

router.get("/wordstats", async (ctx, next) => {
  ctx.body = await googleWordStatsDaily(ctx.query.search as string);
});

app
  .use(cors())
  .use(koaBody())
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(3000, () => {
    console.log("server started");
  });

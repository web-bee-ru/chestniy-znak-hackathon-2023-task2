import * as dfd from "danfojs-node";
import path from "node:path";
import _ from "lodash";
import * as dateFns from "date-fns";

import { linearInterpolation } from "simple-linear-interpolation";

export const getYandexStats = async (
  name: string
): Promise<{ date: string; value: number }[]> => {
  const df = (await dfd.readJSON(
    path.join(__dirname, `../../dictionary/yandex-wordstats/${name}.json`)
  )) as dfd.DataFrame;

  const all = dfd
    .toJSON(df)
    .map((x) => ({
      date: x.date,
      value: x.totalCount,
    }))
    .filter((x) => x.value > 0);

  const result = _.map(
    _.groupBy(all, (x) => x.date),
    (x, date) => ({
      date,
      value: _.maxBy(x, (y) => y.value).value,
    })
  );

  return result;
};

export const getGoogleStats = async (
  name: string,
  interpolate = true
): Promise<{ date: string; value: number }[]> => {
  const df = await dfd.readCSV(
    path.join(__dirname, `../../dictionary/google-trends/${name}.csv`)
  );

  const all = dfd.toJSON(df).map((x) => ({
    date: x.date,
    value: x.value,
  }));

  const result = _.map(
    _.groupBy(all, (x) => x.date),
    (x, date) => ({
      date,
      value: _.maxBy(x, (y) => y.value).value,
    })
  );

  if (interpolate) {
    const start = _.minBy(result, (x) => x.date).date;
    const end = _.maxBy(result, (x) => x.date).date;

    const points = result.map((x) => ({ x: +new Date(x.date), y: x.value }));
    const calculate = linearInterpolation(points);

    const days = dateFns.eachDayOfInterval({
      start: new Date(start),
      end: new Date(end),
    });

    return days.map((day) => {
      const value = calculate({ x: +day });
      return { date: dateFns.format(day, "yyyy-MM-dd"), value };
    });
  }

  return result;
};

export const getEnterHistory = async (): Promise<
  { date: string; value: number }[]
> => {
  const df = await dfd.readCSV(
    path.join(__dirname, `../../data/marking/enter-aggregate.csv`)
  );

  return dfd.toJSON(df).map((x) => ({
    date: x.dt,
    value: x.enter_cnt,
  }));
};

export const getLeaveHistory = async (): Promise<
  { date: string; value: number }[]
> => {
  const df = await dfd.readCSV(
    path.join(__dirname, `../../data/marking/leave-aggregate.csv`)
  );

  return dfd.toJSON(df).map((x) => ({
    date: x.dt,
    value: x.leave_cnt,
  }));
};

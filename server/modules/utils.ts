import * as dfd from "danfojs-node";
import path from "node:path";
import _ from "lodash";

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
  name: string
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

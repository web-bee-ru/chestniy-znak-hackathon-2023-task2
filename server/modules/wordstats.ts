import googleTrends, { InterestOverTimeResult } from "google-trends-api";
import * as dateFns from "date-fns";
import _ from "lodash";

function parseGoogleResults(rawResults: string) {
  const results = JSON.parse(rawResults) as InterestOverTimeResult;
  return results.default.timelineData.map((x) => ({
    date: dateFns.format(new Date(Number(x.time) * 1000), "yyyy-MM-dd"),
    value: x.value[0],
  }));
}

export function googleWordStats(search: string) {
  return googleTrends
    .interestOverTime({
      keyword: search,
      startTime: new Date("2021-04-01"),
      endTime: new Date(),
      geo: "RU",
      timezone: -180,
    })
    .then(parseGoogleResults);
}

export type Row = { date: string; value: number };

export async function googleWordStatsDaily(search: string): Promise<Row[]> {
  const dates = dateFns.eachDayOfInterval({
    start: new Date("2021-04-01"),
    end: new Date("2021-05-01"),
  });

  const total: Row[][] = [];

  for (const date of dates) {
    const data = await googleTrends
      .interestOverTime({
        keyword: search,
        startTime: dateFns.startOfDay(date),
        endTime: dateFns.endOfDay(date),
        geo: "RU",
        timezone: -180,
      })
      .then(parseGoogleResults);

    total.push(data);
  }

  const all: Row[] = total.flat();

  const result = _.map(
    _.groupBy(all, (x) => x.date),
    (x, date) => ({
      date,
      value: _.maxBy(x, (y) => y.value).value,
    })
  );

  return result;
}

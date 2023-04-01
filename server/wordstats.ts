import googleTrends from "google-trends-api";
import * as dateFns from "date-fns";

function parseGoogleResults(rawResults: string) {
  const results = JSON.parse(rawResults);
  return results.default.timelineData.map((x) => ({
    date: dateFns.format(new Date(Number(x.time) * 1000), "yyyy-MM-dd"),
    value: x.value[0],
  }));
}

export function googleWordStats(search: string) {
  return googleTrends
    .interestOverTime({
      keyword: search,
      startTime: new Date("2021-10-01"),
      endTime: new Date(),
      geo: "RU",
      timezone: -180,
    })
    .then(parseGoogleResults);
}

export async function googleWordStatsDaily(search: string) {
  const dates = dateFns.eachMonthOfInterval({
    start: new Date("2021-10-01"),
    end: new Date(),
  });

  const total = [];

  for (const date of dates) {
    const data = await googleTrends
      .interestOverTime({
        keyword: search,
        startTime: dateFns.startOfMonth(date),
        endTime: dateFns.endOfMonth(date),
        geo: "RU",
        timezone: -180,
      })
      .then(parseGoogleResults);

    total.push(data);
  }

  return total.flat();
}

import googleTrends from "google-trends-api";
import * as dateFns from "date-fns";

export function googleWordStats(search: string) {
  return googleTrends
    .interestOverTime({
      keyword: search,
      startTime: new Date("2020-04-01"),
      endTime: new Date(),
      geo: "RU",
      timezone: -180,
    })
    .then((rawResults) => {
      const results = JSON.parse(rawResults);
      return results.default.timelineData.map((x) => ({
        date: dateFns.format(new Date(Number(x.time) * 1000), "yyyy-MM-dd"),
        value: x.value[0],
      }));
    });
}

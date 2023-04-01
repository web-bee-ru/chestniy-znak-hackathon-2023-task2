import axios from "axios";
import googleTrends from "google-trends-api";
import * as dateFns from "date-fns";

const [_, __, ...searchArgs] = process.argv;

function googleWordStats(search: string) {
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
    })
    .then((data) => JSON.stringify(data));
}

const search = searchArgs.join(" ");

googleWordStats(search)
  .then((res) => console.log(res))
  .then(() => process.exit());

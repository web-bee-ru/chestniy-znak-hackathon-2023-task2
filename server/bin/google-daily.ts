import { googleWordStatsDaily } from "../modules/wordstats";

const [_, __, ...searchArgs] = process.argv;

const search = searchArgs.join(" ");

googleWordStatsDaily(search)
  .then((data) => console.log(JSON.stringify(data)))
  .then(() => process.exit());

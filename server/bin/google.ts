import { googleWordStats } from "../modules/wordstats";

const [_, __, ...searchArgs] = process.argv;

const search = searchArgs.join(" ");

googleWordStats(search)
  .then((data) => console.log(JSON.stringify(data)))
  .then(() => process.exit());

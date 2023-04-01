import * as dfd from "danfojs-node";
import path from "node:path";
import { Series, DataFrame } from "pandas-js";
import * as dateFns from "date-fns";

// const df = new DataFrame([
//   { x: 1, y: 2, z: 3 },
//   { x: 2, y: 1, z: 5 },
//   { x: 3, y: 0, z: 7 },
//   { x: 4, y: 1, z: 2 },
// ]);

// Returns DataFrame([{x: 1, y: -1, z: 1}, {x: -1, y: 1, z: -1}, {x: 1, y: -1, z: 1}])
// console.log(df.corr().toString());

// const ds = new Series([1, 2, 3, 4], {name: 'My test name', index: [2, 3, 4, 5]})

const ds1 = new Series([1, 2, 3, 4, 5]);
const ds2 = new Series([2, 4, 6, 8, 10]);

// console.log(ds1.corr(ds2));

// process.exit();

// import child_process from "node:child_process";

// child_process.exec("python");

import { googleWordStatsDaily } from "./wordstats";

// const enterPath = path.join(__dirname, "../../data/marking/enter.csv");
// const goodsPath = path.join(__dirname, "../../data/marking/goods.csv");
// const leavePath = path.join(__dirname, "../../data/marking/leave.csv");
// const marketsPath = path.join(__dirname, "../../data/marking/markets.csv");
// const movementsPath = path.join(__dirname, "../../data/marking/movements.csv");
// const retailsPath = path.join(__dirname, "../../data/marking/retails.csv");

const enterPath = path.join(
  __dirname,
  "../../data/marking/enter-aggregate.csv"
);
const leavePath = path.join(
  __dirname,
  "../../data/marking/leave-aggregate.csv"
);

const dfEnterPromise = dfd.readCSV(enterPath);
const dfLeavePromise = dfd.readCSV(leavePath);

export const checkCorr = async () => {
  const stats = await googleWordStatsDaily("парфюм");
  const dfEnter = await dfEnterPromise;
  const dfLeave = await dfLeavePromise;

  // console.log(dfEnter["enter_cnt"].values);
  // console.log(dfEnter["leave_cnt"].values);
  // dfLeave.count().print();

  // dfEnter["enter_cnt"];
  // dfLeave["leave_cnt"];

  const enterS = new Series(dfEnter["enter_cnt"].values);
  const leaveS = new Series(dfLeave["leave_cnt"].values);
  const statsS = new Series(
    stats
      .filter(
        (x) =>
          x.date >= dfEnter["dt"].values[0] &&
          x.date <= dfEnter["dt"].tail(1).values[0]
      )
      .map((x) => x.value)
  );

  // console.log(
  //   stats
  //     .filter(
  //       (x) =>
  //         x.date >= dfEnter["dt"].values[0] &&
  //         x.date <= dfEnter["dt"].tail(1).values[0]
  //     )
  //     .map((x) => `${x.date} ${x.value}`)
  //     .join("\n")
  // );

  // console.log(dfEnter["dt"].values[0]);
  // console.log(dfEnter["dt"].tail(1).values[0]);
  // console.log(enterS.values.size);
  // console.log(leaveS.values.size);
  // console.log(statsS.values.size);

  console.log(statsS.corr(enterS));
  console.log(statsS.corr(leaveS));
  console.log(enterS.corr(leaveS));

  // console.log(enterS.corr(leaveS))
  // console.log(enterS.corr(leaveS))

  // dfLeave.describe().print();

  // dfEnter.corr;
};

// dfd
//   .readCSV(enterPath, {
//     frameConfig: { config: { tableMaxRow: 1000 } },
//   })
//   .then((data) => {
//     data.describe().print();
//   });

checkCorr();

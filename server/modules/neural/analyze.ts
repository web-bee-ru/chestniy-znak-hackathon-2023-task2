import * as tf from "@tensorflow/tfjs-node";
import fs from "node:fs/promises";
import * as dfd from "danfojs-node";
import {getGoogleStats} from "../utils";
import path from "node:path";

interface Analyze {
  history_size: number;
  horizon_size: number;
  train_len: number;
  val_len: number;
  test_len: number;
  search_std: number;
  y_std: number;
  // historySize: number;
  // windowRadius: number;
  // windowSize: number;
  // trainLen: number;
  // valLen: number;
  // testLen: number;
  // xMean: number;
  // xStd: number;
  // yMean: number;
  // yStd: number;
}

type Predict = (params: Analyze, history: number[]) => Promise<number[]>;
async function load(basePath: string): Promise<Predict> {
  const model = await tf.loadLayersModel(
    `file://${basePath}/model-js/model.json`
  );

  async function predictWithModel(
    params: Analyze,
    shaped: number[]
  ): Promise<number[]> {
    return predict(model, params, shaped);
  }

  return predictWithModel;
}

async function predict(
  model: tf.LayersModel,
  params: Analyze,
  shaped: number[]
): Promise<number[]> {
  // let inputData = shaped.slice(-params.historySize);

  // if (inputData.length < params.historySize) {
  //   const pad = new Array(params.historySize - inputData.length);
  //   pad.fill(0);
  //   inputData = pad.concat(inputData);
  // }

  // console.log(shaped);

  const input = tf.tensor2d(shaped, [1, shaped.length], "float32");
  const output = model.predict(input) as tf.Tensor2D;

  const predicted = (await output.array())[0];
  return predicted;
}

// function makeKernel(size: number): number[] {
//   const sigma = size / 7;
//   let x = tf.range(Math.floor(-size / 2) + 1, Math.floor(size / 2) + 1);
//   x = tf.pow(x, 2);
//   x = tf.exp(x.div(-2.0 * (sigma * sigma))) as tf.Tensor1D;
//   x = x.div(tf.sum(x));
//   return x.arraySync();
// }

// interface Result {
//   v: number;
//   e7: number | null;
//   p7: number | null;
//   e21: number | null;
//   p21: number | null;
//   er: number | null;
//   pr: number | null;
// }

export async function analyze(
  date: string,
  stats: { date: string; value: number }[]
): Promise<number[]> {
  const leave = await load("../data/models/leave");

  const csv = (
    await fs.readFile("../data/models/leave" + "/params.csv", {
      encoding: "utf8",
    })
  ).replaceAll("\r", "");

  const [keys, values] = csv.split("\n").map((line) => line.split(","));
  const raw: Record<string, string> = {};
  for (let idx = 0; idx < keys.length; idx++) {
    raw[keys[idx]] = values[idx];
  }

  const params: Analyze = {
    history_size: Number(raw["history_size"]),
    horizon_size: Number(raw["horizon_size"]),
    train_len: Number(raw["train_len"]),
    val_len: Number(raw["val_len"]),
    test_len: Number(raw["test_len"]),
    search_std: Number(raw["search_std"]),
    y_std: Number(raw["y_std"]),
  };

  console.log(raw, params);

  const datasetPath = path.join(__dirname, '../../../data/models/leave/dataset.csv')
  let df = await dfd.readCSV(datasetPath);

  const index = df["dt"].values.indexOf(date);

  const indexStats = stats.findIndex((x) => x.date === date);

  const statsY = stats
    // .filter((x) => x.date <= date)
    .slice(indexStats - params.history_size, indexStats)
    .map((x) => x.value / params.search_std);

  df = df.drop({ columns: ["dt"] });
  // df = df.drop({ columns: ["search_cnt"] });

  df = df.iloc({ rows: [`${index - params.history_size}:${index}`] });

  df.print();

  // df.addColumn("search_cnt", statsY, { inplace: true, atIndex: 2 });

  df.print();

  let history = tf.tensor2d(
    // df.values.slice(index - params.history_size, index)
    df.values
  );
  // history.print();

  const shaped = history.reshape([df.values[0].length * params.history_size]);

  shaped.print();

  // const predicted7 = await enter(shaped);
  const predicted = await leave(params, (await shaped.array()) as number[]);

  // console.log(params.y_std, params.y_std, params.y_std, params.y_std);

  return predicted.map((x) => x * params.y_std);

  // return predicted.map((x) => x * params.y_std);
  // const length = data.length;
  // const results: Result[] = new Array(length);
  // for (let idx = 0; idx < length; idx++) {
  //   const offset = idx - length;
  //   const v = data[data.length + offset];
  //   const e7 = exact7[exact7.length + offset + predicted7.length] ?? null;
  //   const p7 = predicted7[predicted7.length + offset] ?? null;
  //   const e21 = exact21[exact21.length + offset + predicted.length] ?? null;
  //   const p21 = predicted[predicted.length + offset] ?? null;
  //   const a7 = e7 ?? p7;
  //   const a21 = e21 ?? p21;
  //   const er = e7 != null && e21 != null ? (e7 - e21) / (e7 + e21) : null;
  //   const pr =
  //     (e7 == null || e21 == null) && a7 != null && a21 != null
  //       ? (a7 - a21) / (a7 + a21)
  //       : null;
  //   results[idx] = { v, e7, p7, e21, p21, er, pr };
  // }
  // return results;
}

// async function main(): Promise<void> {
//   const data = [
//     1, 0, 0, 2, 0, 0, 2, 2, 8, 0, 0, 0, 3, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0,
//     2, 1, 3, 2, 8, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 1, 0, 0, 0, 8, 2, 2, 1, 6, 0,
//     0, 5, 0, 1, 1, 0, 4, 3, 1, 1, 0, 3,
//   ];
//   const result = await analyze(data);
//   console.table(result);
// }

export const calculateLeave = async (date: string, name: string) => {
  const stats = await getGoogleStats(name);

  return analyze(date, stats).then((data) => {
    console.log(data);
    return data;
  });
};

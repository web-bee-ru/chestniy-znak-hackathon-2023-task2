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

const getParams = async (target: 'leave' | 'enter') => {
  const csv = (
      await fs.readFile(`../data/models/${target}/params.csv`, {
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

  return params
}

export async function analyzeLeave(
  date: string,
  stats: { date: string; value: number }[]
): Promise<number[]> {
  const leave = await load("../data/models/leave");

  const datasetPath = path.join(__dirname, '../../../data/models/leave/dataset.csv')
  let df = await dfd.readCSV(datasetPath);

  const index = df["dt"].values.indexOf(date);

  const indexStats = stats.findIndex((x) => x.date === date);

  const params = await getParams('leave')

  const statsY = stats
    // .filter((x) => x.date <= date)
    .slice(indexStats - params.history_size, indexStats)
    .map((x) => x.value / params.search_std);

  df = df.drop({ columns: ["dt"] });

  df = df.iloc({ rows: [`${index - params.history_size}:${index}`] });

  df.print();

  df = df.drop({ columns: ["search_cnt"] });
  df.addColumn("search_cnt", statsY, { inplace: true, atIndex: 2 });

  df.print();

  let history = tf.tensor2d(
    df.values
  );

  const shaped = history.reshape([df.values[0].length * params.history_size]);

  shaped.print();

  const predicted = await leave(params, (await shaped.array()) as number[]);

  return predicted.map((x) => x * params.y_std);
}

export async function analyzeEnter(
    date: string,
): Promise<number[]> {
  const enter = await load("../data/models/enter");

  const datasetPath = path.join(__dirname, '../../../data/models/enter/dataset.csv')
  let df = await dfd.readCSV(datasetPath);

  const index = df["dt"].values.indexOf(date);

  const params = await getParams('enter')

  df = df.drop({ columns: ["dt"] });

  df = df.iloc({ rows: [`${index - params.history_size}:${index}`] });

  df.print();

  let history = tf.tensor2d(
      df.values
  );

  const shaped = history.reshape([df.values[0].length * params.history_size]);

  shaped.print();

  const predicted = await enter(params, (await shaped.array()) as number[]);

  return predicted.map((x) => x * params.y_std);
}

export const calculateLeave = async (date: string, name: string) => {
  const stats = await getGoogleStats(name);

  return analyzeLeave(date, stats).then((data) => {
    console.log(data);
    return data;
  });
};

export const calculateEnter = async (date: string) => {
  return analyzeEnter(date).then((data) => {
    console.log(data);
    return data;
  });
};

import * as tf from "@tensorflow/tfjs-node";
import fs from "node:fs/promises";

interface Analyze {
  historySize: number;
  windowRadius: number;
  windowSize: number;
  trainLen: number;
  valLen: number;
  testLen: number;
  xMean: number;
  xStd: number;
  yMean: number;
  yStd: number;
}

type Predict = (history: number[]) => Promise<[number[], number[]]>;
async function load(basePath: string): Promise<Predict> {
  const model = await tf.loadLayersModel(
    `file://${basePath}/model-js/model.json`
  );
  const csv = await fs.readFile(basePath + "/params.csv", { encoding: "utf8" });

  const [keys, values] = csv.split("\n").map((line) => line.split(","));
  const raw: Record<string, string> = {};
  for (let idx = 0; idx < keys.length; idx++) {
    raw[keys[idx]] = values[idx];
  }

  const params: Analyze = {
    historySize: Number(raw["history_size"]),
    testLen: Number(raw["test_len"]),
    trainLen: Number(raw["train_len"]),
    valLen: Number(raw["val_len"]),
    windowRadius: Number(raw["window_radius"]),
    windowSize: Number(raw["window_size"]),
    xMean: Number(raw["x_mean"]),
    xStd: Number(raw["x_std"]),
    yMean: Number(raw["y_mean"]),
    yStd: Number(raw["y_std"]),
  };

  async function predictWithModel(
    history: number[]
  ): Promise<[number[], number[]]> {
    return predict(model, params, history);
  }

  return predictWithModel;
}

async function predict(
  model: tf.LayersModel,
  params: Analyze,
  history: number[]
): Promise<[exact: number[], predicted: number[]]> {
  let inputData = history.slice(-params.historySize);
  if (inputData.length < params.historySize) {
    const pad = new Array(params.historySize - inputData.length);
    pad.fill(0);
    inputData = pad.concat(inputData);
  }

  const input = tf.tensor2d(inputData, [1, params.historySize], "float32");
  const output = model.predict(input) as tf.Tensor2D;

  const kernel = makeKernel(params.windowSize);
  const exactAverages = new Array(history.length - params.windowRadius * 2);
  for (let idx = 0; idx < exactAverages.length; idx++) {
    let sum = 0;
    for (let jdx = 0; jdx < kernel.length; jdx++) {
      sum += history[idx + jdx] * kernel[jdx];
    }
    exactAverages[idx] = sum;
  }

  const predictedAverages = (await output.array())[0];

  return [exactAverages, predictedAverages];
}

function makeKernel(size: number): number[] {
  const sigma = size / 7;
  let x = tf.range(Math.floor(-size / 2) + 1, Math.floor(size / 2) + 1);
  x = tf.pow(x, 2);
  x = tf.exp(x.div(-2.0 * (sigma * sigma))) as tf.Tensor1D;
  x = x.div(tf.sum(x));
  return x.arraySync();
}

const average7 = await load("../data/models/center_mean_7");
const average21 = await load("../data/models/center_mean_21");

interface Result {
  v: number;
  e7: number | null;
  p7: number | null;
  e21: number | null;
  p21: number | null;
  er: number | null;
  pr: number | null;
}

export async function analyze(data: number[]): Promise<Result[]> {
  const [exact7, predicted7] = await average7(data);
  const [exact21, predicted21] = await average21(data);

  const length = data.length;
  const results: Result[] = new Array(length);
  for (let idx = 0; idx < length; idx++) {
    const offset = idx - length;
    const v = data[data.length + offset];
    const e7 = exact7[exact7.length + offset + predicted7.length] ?? null;
    const p7 = predicted7[predicted7.length + offset] ?? null;
    const e21 = exact21[exact21.length + offset + predicted21.length] ?? null;
    const p21 = predicted21[predicted21.length + offset] ?? null;
    const a7 = e7 ?? p7;
    const a21 = e21 ?? p21;
    const er = e7 != null && e21 != null ? (e7 - e21) / (e7 + e21) : null;
    const pr =
      (e7 == null || e21 == null) && a7 != null && a21 != null
        ? (a7 - a21) / (a7 + a21)
        : null;
    results[idx] = { v, e7, p7, e21, p21, er, pr };
  }
  return results;
}

async function main(): Promise<void> {
  const data = [
    1, 0, 0, 2, 0, 0, 2, 2, 8, 0, 0, 0, 3, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0,
    2, 1, 3, 2, 8, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 1, 0, 0, 0, 8, 2, 2, 1, 6, 0,
    0, 5, 0, 1, 1, 0, 4, 3, 1, 1, 0, 3,
  ];
  const result = await analyze(data);
  console.table(result);
}

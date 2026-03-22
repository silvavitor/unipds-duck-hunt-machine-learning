// Web Worker global declarations
declare function importScripts(...urls: string[]): void;
import type * as tfTypes from "@tensorflow/tfjs";
declare const tf: typeof tfTypes;

const MODEL_PATH = `yolov5n_web_model/model.json`;
const LABELS_PATH = `yolov5n_web_model/labels.json`;
const INPUT_MODEL_DIMENTIONS = 640;

let _labels: string[] = [];
let _model: tfTypes.GraphModel | null = null;

async function loadModelAndLabels(): Promise<void> {
  await tf.ready();

  _labels = await (await fetch(LABELS_PATH)).json();
  _model = await tf.loadGraphModel(MODEL_PATH);

  // warmup the model with a dummy input
  const dummyInput = tf.ones(_model.inputs[0].shape);
  await _model.executeAsync(dummyInput);

  tf.dispose(dummyInput);

  postMessage({ type: "model-loaded" });
}

/**
 * Pré-processa a imagem para o formato aceito pelo YOLO:
 * - tf.browser.fromPixels(): converte ImageBitmap/ImageData para tensor [H, W, 3]
 * - tf.image.resizeBilinear(): redimensiona para [INPUT_DIM, INPUT_DIM]
 * - .div(255): normaliza os valores para [0, 1]
 * - .expandDims(0): adiciona dimensão batch [1, H, W, 3]
 *
 * Uso de tf.tidy():
 * - Garante que tensores temporários serão descartados automaticamente,
 *   evitando vazamento de memória.
 */
function preProcessImage(input: ImageBitmap): tfTypes.Tensor<tfTypes.Rank> {
  return tf.tidy(() => {
    const image = tf.browser.fromPixels(input);
    const resized = tf.image.resizeBilinear(image, [
      INPUT_MODEL_DIMENTIONS,
      INPUT_MODEL_DIMENTIONS,
    ]);
    const normalized = resized.div(255);
    const batched = normalized.expandDims(0);

    return batched;
  });
}

self.onmessage = async ({ data }: MessageEvent) => {
  if (data.type !== "predict") {
    return;
  }

  if (!_model) {
    return;
  }

  const input = preProcessImage(data.image);

  postMessage({
    type: "prediction",
    x: 400,
    y: 400,
    score: 0,
  });
};

importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest");
loadModelAndLabels();

console.log("🧠 YOLOv5n Web Worker initialized");

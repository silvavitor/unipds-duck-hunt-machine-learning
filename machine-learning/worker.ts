// Web Worker global declarations
declare function importScripts(...urls: string[]): void;
declare const tf: any;

const MODEL_PATH = `yolov5n_web_model/model.json`;
const LABELS_PATH = `yolov5n_web_model/labels.json`;

let _labels: string[] = [];
let _model: any = null;

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

function preProcessImage(imageData: ImageBitmap): any {
  // preprocessing logic placeholder
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

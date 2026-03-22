import Game from "../src/modules/Game";
import { buildLayout } from "./layout";
import { PredictMessage } from "./types";

export default async function main(game: Game) {
  const container = buildLayout(game.app);
  const worker = new Worker(new URL("./worker.ts", import.meta.url), {
    type: "module",
  });

  game.stage.aim.visible = false;

  worker.onmessage = ({ data }: MessageEvent) => {
    const { type, x, y } = data;

    if (type === "prediction") {
      console.log(`🎯 AI predicted at: (${x}, ${y})`);
      container.updateHUD(data);
      game.stage.aim.visible = true;

      game.stage.aim.setPosition(data.x, data.y);
      const position = game.stage.aim.getGlobalPosition();

      game.handleClick({
        global: position,
      });
    }
  };

  setInterval(async () => {
    const canvas = game.app.renderer.extract.canvas(
      game.stage,
    ) as HTMLCanvasElement;
    const bitmap = await createImageBitmap(canvas);

    const message: PredictMessage = {
      type: "predict",
      image: bitmap,
    };

    worker.postMessage(message, [bitmap]);
  }, 200);

  return container;
}

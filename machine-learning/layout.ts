import * as PIXI from "pixi.js";

interface HUDData {
  score: number;
  x: number;
  y: number;
}

interface HUDController {
  updateHUD: (data: HUDData) => void;
}

export function buildLayout(app: PIXI.Application): HUDController {
  // Container for HUD
  const hud = new PIXI.Container();
  hud.y = 50;
  hud.zIndex = 1000;

  // Score Text
  const scoreText = new PIXI.Text({
    text: "Score: 0",
    style: {
      fontFamily: "monospace",
      fontSize: 24,
      fill: 0xffffff,
      stroke: 0x000000,
    },
  });
  hud.addChild(scoreText);

  // Predictions Text
  const predictionsText = new PIXI.Text({
    text: "Predictions:",
    style: {
      fontFamily: "monospace",
      fontSize: 16,
      fill: 0xfff666,
      stroke: 0x333300,
      wordWrap: true,
      wordWrapWidth: 420,
    },
  });
  predictionsText.y = 36;
  hud.addChild(predictionsText);

  // Add HUD to stage, ensure it's always on top
  app.stage.sortableChildren = true;
  app.stage.addChild(hud);

  function positionHUD(): void {
    const margin = 16;
    const hudWidth = Math.max(scoreText.width, predictionsText.width);
    hud.x = app.renderer.width - hudWidth - margin;
  }

  function updateHUD(data: HUDData): void {
    scoreText.text = `Score: ${data.score}`;
    predictionsText.text = `Predictions: (${Math.round(data.x)}, ${Math.round(data.y)})`;
    positionHUD();
  }

  positionHUD();
  window.addEventListener("resize", () => {
    positionHUD();
  });

  return {
    updateHUD,
  };
}

import { Sprite, Texture } from "pixi.js";

const DEFAULT_SIZE = 40;
const DEFAULT_POSITION = 350;

interface AimOptions {
  maxX: number;
  maxY: number;
  textures: Record<string, Texture>;
}

class Aim extends Sprite {
  maxX: number;
  maxY: number;

  constructor({ maxX, maxY, textures }: AimOptions) {
    super(textures["aim/0.png"]);

    this.maxX = maxX;
    this.maxY = maxY;

    this.setSize(DEFAULT_SIZE, DEFAULT_SIZE);
    this.move(DEFAULT_POSITION, DEFAULT_POSITION);
    this.visible = true;
  }

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  setPosition(x: number, y: number): void {
    this.position.set(x, y);
  }

  normalizePosition(x: number, y: number): { x: number; y: number } {
    const newTargetX = this.position.x + x;
    const newTargetY = this.position.y + y;

    const moveToX = newTargetX > this.maxX ? this.position.x : newTargetX;
    const moveToY = newTargetY > this.maxY ? this.position.y : newTargetY;
    return {
      x: moveToX,
      y: moveToY,
    };
  }

  move(x: number, y: number): void {
    const data = this.normalizePosition(x, y);
    this.position.set(data.x, data.y);
  }

  reset(): void {
    this.setPosition(DEFAULT_POSITION, DEFAULT_POSITION);
    this.visible = false;
  }
}

export default Aim;

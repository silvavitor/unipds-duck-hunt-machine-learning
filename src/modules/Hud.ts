import { assign as _extend } from "lodash";
import { Container, Point, Sprite, Text, Texture } from "pixi.js";

interface TextBoxOptions {
  style?: {
    fontFamily?: string;
    fontSize?: string;
    align?: string;
    fill?: string;
  };
  location?: Point;
  anchor?: { x: number; y: number };
}

interface TextureCounterOptions {
  texture?: string;
  spritesheet?: string;
  location?: Point;
  rowMax?: number;
  max?: number;
}

class Hud extends Container {
  textures: Record<string, Texture>;
  [key: string]: any;

  constructor({ textures }: { textures: Record<string, Texture> }) {
    super();
    this.textures = textures;
  }

  createTextBox(name: string, opts?: TextBoxOptions): void {
    const options = _extend(
      {
        style: {
          fontFamily: "Arial",
          fontSize: "18px",
          align: "left" as any,
          fill: "white",
        },
        location: new Point(0, 0),
        anchor: {
          x: 0.5,
          y: 0.5,
        },
      },
      opts,
    );

    this[name + "TextBox"] = new Text({ text: "", style: options.style });
    const textBox = this[name + "TextBox"] as Text;
    textBox.position.set(options.location.x, options.location.y);
    textBox.anchor.set(options.anchor.x, options.anchor.y);
    this.addChild(textBox);

    Object.defineProperty(this, name, {
      set: (val) => {
        textBox.text = val;
      },
      get: () => {
        return textBox.text;
      },
      configurable: true,
    });
  }

  createTextureBasedCounter(name: string, opts?: TextureCounterOptions): void {
    const options = _extend(
      {
        texture: "",
        spritesheet: "",
        location: new Point(0, 0),
      },
      opts,
    );

    this[name + "Container"] = new Container();
    const container = this[name + "Container"] as Container;
    container.position.set(options.location.x, options.location.y);
    this.addChild(container);

    Object.defineProperty(this, name, {
      set: (val: number) => {
        const texture = this.textures[options.texture];
        const childCount = container.children.length;
        if (options.max && val > options.max) {
          val = options.max;
        }
        if (childCount < val) {
          for (let i = childCount; i < val; i++) {
            const item = new Sprite(texture);
            let yPos = 0;
            let xPosDelta = i;
            if (options.rowMax && options.rowMax < val) {
              yPos = item.height * Math.floor(i / options.rowMax);
              xPosDelta = i % options.rowMax;
            }
            item.position.set(item.width * xPosDelta, yPos);
            container.addChild(item);
          }
        } else if (val != childCount) {
          container.removeChildren(val, childCount);
        }
      },
      configurable: true,
    });
  }
}

export default Hud;

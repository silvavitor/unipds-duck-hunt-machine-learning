import { TimelineLite } from "gsap";
import { find as _find } from "lodash";
import { AnimatedSprite, Texture } from "pixi.js";

interface State {
  name: string;
  animationSpeed: number;
  textures?: Texture[];
  loop?: boolean;
}

interface CharacterOptions {
  spriteId: string;
  textures: Record<string, Texture>;
  states: State[];
}

class Character extends AnimatedSprite {
  states: State[];
  stateVal?: string;
  timeline: TimelineLite;

  constructor({ spriteId, textures, states }: CharacterOptions) {
    for (const textureKey of Object.keys(textures)) {
      if (!textureKey.includes(spriteId)) {
        continue;
      }
      const parts = textureKey.split("/");
      parts.length -= 1;
      const state = parts.join("/").replace(`${spriteId}/`, "");
      const stateObj = _find(states, { name: state });
      if (!stateObj) continue;

      if (Object.prototype.hasOwnProperty.call(stateObj, "textures")) {
        stateObj.textures!.push(textures[textureKey]);
      } else {
        Object.defineProperty(stateObj, "textures", {
          value: [textures[textureKey]],
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    }

    super(states[0].textures!);
    this.states = states;
    this.animationSpeed = this.states[0].animationSpeed;
    this.timeline = new TimelineLite({
      autoRemoveChildren: true,
    });
    return this;
  }

  stopAndClearTimeline(): this {
    this.timeline.pause();
    const timelineItem = this.timeline.getChildren();
    for (let i = 0; i < timelineItem.length; i++) {
      timelineItem[i].kill();
    }
    this.timeline.play();
    return this;
  }

  isActive(): boolean {
    return this.timeline.isActive();
  }

  addToTimeline(item: any): this {
    this.timeline.add(item);
    return this;
  }

  set state(value: string) {
    const stateObj = _find(this.states, { name: value });
    if (!stateObj) {
      throw new Error(
        "The requested state (" +
          value +
          ") is not availble for this Character.",
      );
    }
    this.stateVal = value;
    if (stateObj.textures!.length === 1) {
      stateObj.textures = stateObj.textures!.concat(stateObj.textures!);
    }
    this.textures = stateObj.textures!;
    this.animationSpeed = stateObj.animationSpeed;
    this.loop = Object.prototype.hasOwnProperty.call(stateObj, "loop")
      ? stateObj.loop!
      : true;
    this.play();
  }

  get state(): string {
    return this.stateVal ? this.stateVal : "";
  }
}

export default Character;

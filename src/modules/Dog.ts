import { TweenMax } from "gsap";
import { assign as _extend, noop as _noop } from "lodash";
import { Point, Texture } from "pixi.js";
import Character from "./Character";
import sound from "./Sound";

interface DogOptions {
  textures: Record<string, Texture>;
  downPoint: Point;
  upPoint: Point;
}

class Dog extends Character {
  toRetrieve: number;
  maxRetrieve: number;
  options: DogOptions;
  sniffSoundId: number | null;

  constructor(options: DogOptions) {
    const states = [
      { name: "double", animationSpeed: 0.1 },
      { name: "single", animationSpeed: 0.1 },
      { name: "find", animationSpeed: 0.1 },
      { name: "jump", animationSpeed: 0.1, loop: false },
      { name: "laugh", animationSpeed: 0.1 },
      { name: "sniff", animationSpeed: 0.1 },
    ];
    super({ spriteId: "dog", textures: options.textures, states });

    this.toRetrieve = 0;
    this.maxRetrieve = 3;
    this.anchor.set(0.5, 0);
    this.options = options;
    this.sniffSoundId = null;
  }

  sniff(
    opts?: Partial<{
      startPoint: Point;
      endPoint: Point;
      onStart: () => void;
      onComplete: () => void;
    }>,
  ): this {
    const options = _extend(
      {
        startPoint: this.position,
        endPoint: this.position,
        onStart: _noop,
        onComplete: _noop,
      },
      opts,
    );

    this.sit({
      point: options.startPoint,
      pre: () => {
        this.visible = false;
      },
    });

    this.timeline.to(this.position, 2, {
      x: options.endPoint.x,
      y: options.endPoint.y,
      ease: "Linear.easeNone",
      onStart: () => {
        this.visible = true;
        this.parent.setChildIndex(this, this.parent.children.length - 1);
        this.state = "sniff";
        this.sniffSoundId = sound.play("sniff") as number;
        options.onStart();
      },
      onComplete: () => {
        sound.stop(this.sniffSoundId as number);
        options.onComplete();
      },
    });

    return this;
  }

  upDownTween(
    opts?: Partial<{
      startPoint: Point;
      endPoint: Point;
      onStart: () => void;
      onComplete: () => void;
      state: string;
    }>,
  ): this {
    const options = _extend(
      {
        startPoint: this.options.downPoint || this.position,
        endPoint: this.options.upPoint || this.position,
        onStart: _noop,
        onComplete: _noop,
      },
      opts,
    );

    this.sit({
      point: options.startPoint,
    });

    this.timeline.add(
      TweenMax.to(this.position, 0.4, {
        y: options.endPoint.y,
        yoyo: true,
        repeat: 1,
        repeatDelay: 0.5,
        ease: "Linear.easeNone",
        onStart: () => {
          this.visible = true;
          options.onStart.call(this);
        },
        onComplete: options.onComplete,
      }),
    );
    return this;
  }

  find(opts?: Partial<{ onStart: () => void; onComplete: () => void }>): this {
    const options = _extend(
      {
        onStart: _noop,
        onComplete: _noop,
      },
      opts,
    );

    this.timeline.add(() => {
      sound.play("barkDucks");
      this.state = "find";
      options.onStart();
    });

    this.timeline.add(
      TweenMax.to(this.position, 0.2, {
        y: "-=100",
        ease: "Strong.easeOut",
        delay: 0.4,
        onStart: () => {
          this.state = "jump";
        },
        onComplete: () => {
          this.visible = false;
          options.onComplete();
        },
      }),
    );

    return this;
  }

  sit(
    opts?: Partial<{
      point: Point;
      pre: () => void;
      onStart: () => void;
      onComplete: () => void;
    }>,
  ): this {
    const options = _extend(
      {
        point: this.position,
        onStart: _noop,
        onComplete: _noop,
      },
      opts,
    );

    this.timeline.add(() => {
      if (options.pre) options.pre();
      options.onStart();
      this.position.set(options.point.x, options.point.y);
      options.onComplete();
    });
    return this;
  }

  retrieve(): this {
    if (this.toRetrieve + 1 >= this.maxRetrieve) {
      return this;
    }
    this.toRetrieve++;
    this.upDownTween({
      onStart: () => {
        if (this.toRetrieve >= 2) {
          this.state = "double";
          this.toRetrieve -= 2;
        } else if (this.toRetrieve === 1) {
          this.state = "single";
          this.toRetrieve -= 1;
        }
      },
    });
    return this;
  }

  laugh(): this {
    this.toRetrieve = 0;
    this.upDownTween({
      state: "laugh",
      onStart: () => {
        this.state = "laugh";
        sound.play("laugh");
      },
    });

    return this;
  }

  isActive(): boolean {
    return super.isActive() && this.toRetrieve > 0;
  }
}

export default Dog;

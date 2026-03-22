import { assign as _extend, noop as _noop, random as _random } from "lodash";
import { Texture } from "pixi.js";
import Utils from "../libs/utils";
import Character from "./Character";
import sound from "./Sound";

const DEATH_ANIMATION_SECONDS = 0.6;
const RANDOM_FLIGHT_DELTA = 300;

interface DuckOptions {
  colorProfile: string;
  textures: Record<string, Texture>;
  maxX?: number;
  maxY?: number;
  randomFlightDelta?: number;
}

interface FlightOptions {
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  randomFlightDelta?: number;
  speed?: number;
}

interface FlyToOptions {
  point?: { x: number; y: number };
  speed?: number;
  onStart?: () => void;
  onComplete?: () => void;
}

class Duck extends Character {
  alive: boolean;
  options: DuckOptions;
  speedVal?: number;
  flightAnimationMs?: number;

  constructor(options: DuckOptions) {
    const spriteId = "duck/" + options.colorProfile;
    const states = [
      { name: "left", animationSpeed: 0.18 },
      { name: "right", animationSpeed: 0.18 },
      { name: "top-left", animationSpeed: 0.18 },
      { name: "top-right", animationSpeed: 0.18 },
      { name: "dead", animationSpeed: 0.18 },
      { name: "shot", animationSpeed: 0.18 },
    ];
    super({ spriteId, textures: options.textures, states });

    this.alive = true;
    this.visible = true;
    this.options = options;
    this.anchor.set(0.5, 0.5);
  }

  randomFlight(opts?: FlightOptions): void {
    const options = _extend(
      {
        minX: 0,
        maxX: this.options.maxX || Infinity,
        minY: 0,
        maxY: this.options.maxY || Infinity,
        randomFlightDelta:
          this.options.randomFlightDelta || RANDOM_FLIGHT_DELTA,
        speed: 1,
      },
      opts,
    ) as Required<FlightOptions>;

    let distance: number;
    let destination: { x: number; y: number };
    do {
      destination = {
        x: _random(options.minX, options.maxX),
        y: _random(options.minY, options.maxY),
      };
      distance = Utils.pointDistance(this.position, destination);
    } while (distance < options.randomFlightDelta);

    this.flyTo({
      point: destination,
      speed: options.speed,
      onComplete: this.randomFlight.bind(this, options),
    });
  }

  flyTo(opts?: FlyToOptions): this {
    const options = _extend(
      {
        point: this.position,
        speed: this.speed,
        onStart: _noop,
        onComplete: _noop,
      },
      opts,
    ) as Required<FlyToOptions>;

    this.speed = options.speed;

    const direction = Utils.directionOfTravel(this.position, options.point);
    const tweenSeconds = (this.flightAnimationMs! + _random(0, 300)) / 1000;

    this.timeline.to(this.position, tweenSeconds, {
      x: options.point.x,
      y: options.point.y,
      ease: "Linear.easeNone",
      onStart: () => {
        if (!this.alive) {
          this.stopAndClearTimeline();
        }
        this.play();
        this.state = direction.replace("bottom", "top");
        options.onStart();
      },
      onComplete: options.onComplete,
    });

    return this;
  }

  shot(): void {
    if (!this.alive) {
      return;
    }
    this.alive = false;

    this.stopAndClearTimeline();
    this.timeline.add(() => {
      this.state = "shot";
      sound.play("quak");
    });

    this.timeline.to(this.position, DEATH_ANIMATION_SECONDS, {
      y: this.options.maxY,
      ease: "Linear.easeNone",
      delay: 0.3,
      onStart: () => {
        this.state = "dead";
      },
      onComplete: () => {
        sound.play("thud");
        this.visible = false;
      },
    });
  }

  isActive(): boolean {
    return this.visible || super.isActive();
  }

  get speed(): number {
    return this.speedVal!;
  }

  set speed(val: number) {
    let flightAnimationMs: number | undefined;
    switch (val) {
      case 0:
        flightAnimationMs = 3000;
        break;
      case 1:
        flightAnimationMs = 2800;
        break;
      case 2:
        flightAnimationMs = 2500;
        break;
      case 3:
        flightAnimationMs = 2000;
        break;
      case 4:
        flightAnimationMs = 1800;
        break;
      case 5:
        flightAnimationMs = 1500;
        break;
      case 6:
        flightAnimationMs = 1300;
        break;
      case 7:
        flightAnimationMs = 1200;
        break;
      case 8:
        flightAnimationMs = 800;
        break;
      case 9:
        flightAnimationMs = 600;
        break;
      case 10:
        flightAnimationMs = 500;
        break;
    }
    this.speedVal = val;
    this.flightAnimationMs = flightAnimationMs;
  }
}

export default Duck;

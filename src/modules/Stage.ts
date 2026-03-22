import BPromise from "bluebird";
import { delay as _delay, inRange as _inRange, some as _some } from "lodash";
import { Container, Graphics, Point, Sprite, Texture } from "pixi.js";
import Utils from "../libs/utils";
import Aim from "./Aim";
import Dog from "./Dog";
import Duck from "./Duck";
import Hud from "./Hud";

const MAX_X = 800;
const MAX_Y = 600;

const DUCK_POINTS = {
  ORIGIN: new Point(MAX_X / 2, MAX_Y),
};
const DOG_POINTS = {
  DOWN: new Point(MAX_X / 2, MAX_Y),
  UP: new Point(MAX_X / 2, MAX_Y - 230),
  SNIFF_START: new Point(0, MAX_Y - 130),
  SNIFF_END: new Point(MAX_X / 2, MAX_Y - 130),
};
const HUD_LOCATIONS = {
  SCORE: new Point(MAX_X - 10, 10),
  WAVE_STATUS: new Point(MAX_X - 11, MAX_Y - 30),
  LEVEL_CREATOR_LINK: new Point(MAX_X - 11, MAX_Y - 10),
  FULL_SCREEN_LINK: new Point(MAX_X - 130, MAX_Y - 10),
  PAUSE_LINK: new Point(MAX_X - 318, MAX_Y - 10),
  MUTE_LINK: new Point(MAX_X - 236, MAX_Y - 10),
  GAME_STATUS: new Point(MAX_X / 2, MAX_Y * 0.45),
  REPLAY_BUTTON: new Point(MAX_X / 2, MAX_Y * 0.56),
  BULLET_STATUS: new Point(10, 10),
  DEAD_DUCK_STATUS: new Point(10, MAX_Y * 0.91),
  MISSED_DUCK_STATUS: new Point(10, MAX_Y * 0.95),
};

const FLASH_MS = 60;
const FLASH_SCREEN = new Graphics();
FLASH_SCREEN.fill(0xffffff);
FLASH_SCREEN.rect(0, 0, MAX_X, MAX_Y);
FLASH_SCREEN.fill();
FLASH_SCREEN.position.x = 0;
FLASH_SCREEN.position.y = 0;

interface StageOptions {
  textures: Record<string, Texture>;
}

class Stage extends Container {
  textures: Record<string, Texture>;
  locked: boolean;
  ducks: Duck[];
  dog: Dog;
  flashScreen: Graphics;
  hud: Hud;
  aim: Aim;

  constructor({ textures }: StageOptions) {
    super();
    this.textures = textures;

    this.locked = false;
    this.interactive = true;
    this.ducks = [];
    this.dog = new Dog({
      textures: textures,
      downPoint: DOG_POINTS.DOWN,
      upPoint: DOG_POINTS.UP,
    });
    this.dog.visible = false;
    this.flashScreen = FLASH_SCREEN;
    this.flashScreen.visible = false;
    this.hud = new Hud({ textures: textures });
    this.aim = new Aim({
      textures: textures,
      maxX: MAX_X,
      maxY: MAX_Y,
    });
    this._setStage();
    this.scaleToWindow();
  }

  static scoreBoxLocation(): Point {
    return HUD_LOCATIONS.SCORE;
  }

  static waveStatusBoxLocation(): Point {
    return HUD_LOCATIONS.WAVE_STATUS;
  }

  static gameStatusBoxLocation(): Point {
    return HUD_LOCATIONS.GAME_STATUS;
  }

  static pauseLinkBoxLocation(): Point {
    return HUD_LOCATIONS.PAUSE_LINK;
  }

  static muteLinkBoxLocation(): Point {
    return HUD_LOCATIONS.MUTE_LINK;
  }

  static fullscreenLinkBoxLocation(): Point {
    return HUD_LOCATIONS.FULL_SCREEN_LINK;
  }

  static levelCreatorLinkBoxLocation(): Point {
    return HUD_LOCATIONS.LEVEL_CREATOR_LINK;
  }

  static replayButtonLocation(): Point {
    return HUD_LOCATIONS.REPLAY_BUTTON;
  }

  static bulletStatusBoxLocation(): Point {
    return HUD_LOCATIONS.BULLET_STATUS;
  }

  static deadDuckStatusBoxLocation(): Point {
    return HUD_LOCATIONS.DEAD_DUCK_STATUS;
  }

  static missedDuckStatusBoxLocation(): Point {
    return HUD_LOCATIONS.MISSED_DUCK_STATUS;
  }

  pause(): void {
    this.dog.timeline.pause();
    this.ducks.forEach((duck) => {
      duck.timeline.pause();
    });
  }

  resume(): void {
    this.dog.timeline.play();
    this.ducks.forEach((duck) => {
      duck.timeline.play();
    });
  }

  scaleToWindow(): void {
    this.scale.set(window.innerWidth / MAX_X, window.innerHeight / MAX_Y);
  }

  _setStage(): this {
    const background = new Sprite(this.textures["scene/back/0.png"]);
    background.position.set(0, 0);

    const tree = new Sprite(this.textures["scene/tree/0.png"]);
    tree.position.set(100, 237);

    this.addChild(tree);
    this.addChild(background);
    this.addChild(this.dog);
    this.addChild(this.flashScreen);
    this.addChild(this.hud);
    this.addChild(this.aim);

    return this;
  }

  preLevelAnimation(): Promise<void> {
    return new BPromise<void>((resolve) => {
      this.cleanUpDucks();
      this.dog
        .sniff({
          startPoint: DOG_POINTS.SNIFF_START,
          endPoint: DOG_POINTS.SNIFF_END,
        })
        .find({
          onComplete: () => {
            this.setChildIndex(this.dog, 0);
            resolve();
          },
        });
    });
  }

  addDucks(numDucks: number, speed: number): void {
    for (let i = 0; i < numDucks; i++) {
      const duckColor = i % 2 === 0 ? "red" : "black";

      const newDuck = new Duck({
        textures: this.textures,
        colorProfile: duckColor,
        maxX: MAX_X,
        maxY: MAX_Y,
      });
      newDuck.position.set(DUCK_POINTS.ORIGIN.x, DUCK_POINTS.ORIGIN.y);
      this.addChildAt(newDuck, 0);
      newDuck.randomFlight({ speed });

      this.ducks.push(newDuck);
    }
  }

  shotsFired(clickPoint: { x: number; y: number }, radius: number): number {
    this.flashScreen.visible = true;
    _delay(() => {
      this.flashScreen.visible = false;
    }, FLASH_MS);

    let ducksShot = 0;
    for (let i = 0; i < this.ducks.length; i++) {
      const duck = this.ducks[i];
      if (
        duck.alive &&
        Utils.pointDistance(
          duck.position,
          this.getScaledClickLocation(clickPoint),
        ) < radius
      ) {
        ducksShot++;
        duck.shot();
        duck.timeline.add(() => {
          if (!this.isLocked()) {
            this.dog.retrieve();
          }
        });
      }
    }
    return ducksShot;
  }

  clickedReplay(clickPoint: { x: number; y: number }): boolean {
    return (
      Utils.pointDistance(
        this.getScaledClickLocation(clickPoint),
        HUD_LOCATIONS.REPLAY_BUTTON,
      ) < 200
    );
  }

  clickedLevelCreatorLink(clickPoint: { x: number; y: number }): boolean {
    const scaledClickPoint = this.getScaledClickLocation(clickPoint);
    return (
      _inRange(
        scaledClickPoint.x,
        HUD_LOCATIONS.LEVEL_CREATOR_LINK.x - 110,
        HUD_LOCATIONS.LEVEL_CREATOR_LINK.x,
      ) &&
      _inRange(
        scaledClickPoint.y,
        HUD_LOCATIONS.LEVEL_CREATOR_LINK.y - 30,
        HUD_LOCATIONS.LEVEL_CREATOR_LINK.y + 10,
      )
    );
  }

  clickedPauseLink(clickPoint: { x: number; y: number }): boolean {
    const scaledClickPoint = this.getScaledClickLocation(clickPoint);
    return (
      _inRange(
        scaledClickPoint.x,
        HUD_LOCATIONS.PAUSE_LINK.x - 110,
        HUD_LOCATIONS.PAUSE_LINK.x,
      ) &&
      _inRange(
        scaledClickPoint.y,
        HUD_LOCATIONS.PAUSE_LINK.y - 30,
        HUD_LOCATIONS.PAUSE_LINK.y + 10,
      )
    );
  }

  clickedFullscreenLink(clickPoint: { x: number; y: number }): boolean {
    const scaledClickPoint = this.getScaledClickLocation(clickPoint);
    return (
      _inRange(
        scaledClickPoint.x,
        HUD_LOCATIONS.FULL_SCREEN_LINK.x - 110,
        HUD_LOCATIONS.FULL_SCREEN_LINK.x,
      ) &&
      _inRange(
        scaledClickPoint.y,
        HUD_LOCATIONS.FULL_SCREEN_LINK.y - 30,
        HUD_LOCATIONS.FULL_SCREEN_LINK.y + 10,
      )
    );
  }

  clickedMuteLink(clickPoint: { x: number; y: number }): boolean {
    const scaledClickPoint = this.getScaledClickLocation(clickPoint);
    return (
      _inRange(
        scaledClickPoint.x,
        HUD_LOCATIONS.MUTE_LINK.x - 110,
        HUD_LOCATIONS.MUTE_LINK.x,
      ) &&
      _inRange(
        scaledClickPoint.y,
        HUD_LOCATIONS.MUTE_LINK.y - 30,
        HUD_LOCATIONS.MUTE_LINK.y + 10,
      )
    );
  }

  getScaledClickLocation(clickPoint: { x: number; y: number }): {
    x: number;
    y: number;
  } {
    return {
      x: clickPoint.x / this.scale.x,
      y: clickPoint.y / this.scale.y,
    };
  }

  flyAway(): Promise<void> {
    this.dog.stopAndClearTimeline();
    this.dog.laugh();
    this.lock();

    const duckPromises = this.ducks
      .filter((d) => d.alive)
      .map(
        (duck) =>
          new BPromise<void>((resolve) => {
            duck.stopAndClearTimeline();
            duck.flyTo({
              point: new Point(MAX_X / 2, -500),
              onComplete: resolve,
            });
          }),
      );

    return BPromise.all(duckPromises)
      .then(this.cleanUpDucks.bind(this))
      .then(this.unlock.bind(this));
  }

  cleanUpDucks(): void {
    this.ducks.forEach((duck) => this.removeChild(duck));
    this.ducks = [];
  }

  ducksAlive(): boolean {
    return _some(this.ducks, (duck) => duck.alive);
  }

  ducksActive(): boolean {
    return _some(this.ducks, (duck) => duck.isActive());
  }

  dogActive(): boolean {
    return this.dog.isActive();
  }

  isActive(): boolean {
    return this.dogActive() || this.ducksAlive() || this.ducksActive();
  }

  lock(): void {
    this.locked = true;
  }

  unlock(): void {
    this.locked = false;
  }

  isLocked(): boolean {
    return this.locked;
  }
}

export default Stage;

import { remove as _remove } from "lodash";
import { Application, Assets, Texture } from "pixi.js";
import levels from "../data/levels.json";
import levelCreator from "../libs/levelCreator";
import utils from "../libs/utils";
import sound from "./Sound";
import Stage from "./Stage";

const BLUE_SKY_COLOR = 0x64b0ff;
const PINK_SKY_COLOR = 0xfbb4d4;
const SUCCESS_RATIO = 0.6;
const BOTTOM_LINK_STYLE = {
  fontFamily: "Arial",
  fontSize: "15px",
  align: "left",
  fill: "white",
};

interface GameOptions {
  spritesheet: string;
}

class Game {
  spritesheet: string;
  levelIndex: number;
  maxScore: number;
  timePaused: number;
  muted: boolean;
  paused: boolean;
  activeSounds: number[];
  waveEnding: boolean;
  quackingSoundId: number | null;
  levels: any[];
  app: Application;
  textures: Record<string, Texture>;
  stage: Stage;
  level: any;
  bulletVal?: number;
  scoreVal?: number;
  waveVal?: number;
  gameStatusVal?: string;
  ducksMissedVal?: number;
  ducksShotVal?: number;
  ducksShotThisWave?: number;
  waveStartTime?: number;
  pauseStartTime?: number;
  isFullscreen?: boolean;

  constructor(opts: GameOptions) {
    this.spritesheet = opts.spritesheet;
    this.levelIndex = 0;
    this.maxScore = 0;
    this.timePaused = 0;
    this.muted = false;
    this.paused = false;
    this.activeSounds = [];

    this.waveEnding = false;
    this.quackingSoundId = null;
    this.levels = (levels as any).normal;
    return this;
  }

  get ducksMissed(): number {
    return this.ducksMissedVal ? this.ducksMissedVal : 0;
  }

  set ducksMissed(val: number) {
    this.ducksMissedVal = val;

    if (this.stage && this.stage.hud) {
      if (
        !Object.prototype.hasOwnProperty.call(this.stage.hud, "ducksMissed")
      ) {
        this.stage.hud.createTextureBasedCounter("ducksMissed", {
          texture: "hud/score-live/0.png",
          spritesheet: this.spritesheet,
          location: Stage.missedDuckStatusBoxLocation(),
          rowMax: 20,
          max: 20,
        });
      }
      this.stage.hud.ducksMissed = val;
    }
  }

  get ducksShot(): number {
    return this.ducksShotVal ? this.ducksShotVal : 0;
  }

  set ducksShot(val: number) {
    this.ducksShotVal = val;

    if (this.stage && this.stage.hud) {
      if (!Object.prototype.hasOwnProperty.call(this.stage.hud, "ducksShot")) {
        this.stage.hud.createTextureBasedCounter("ducksShot", {
          texture: "hud/score-dead/0.png",
          spritesheet: this.spritesheet,
          location: Stage.deadDuckStatusBoxLocation(),
          rowMax: 20,
          max: 20,
        });
      }
      this.stage.hud.ducksShot = val;
    }
  }

  get bullets(): number {
    return this.bulletVal ? this.bulletVal : 0;
  }

  set bullets(val: number) {
    this.bulletVal = val;

    if (this.stage && this.stage.hud) {
      if (!Object.prototype.hasOwnProperty.call(this.stage.hud, "bullets")) {
        this.stage.hud.createTextureBasedCounter("bullets", {
          texture: "hud/bullet/0.png",
          spritesheet: this.spritesheet,
          location: Stage.bulletStatusBoxLocation(),
          max: 80,
          rowMax: 20,
        });
      }
      this.stage.hud.bullets = val;
    }
  }

  get score(): number {
    return this.scoreVal ? this.scoreVal : 0;
  }

  set score(val: number) {
    this.scoreVal = val;

    if (this.stage && this.stage.hud) {
      if (!Object.prototype.hasOwnProperty.call(this.stage.hud, "score")) {
        this.stage.hud.createTextBox("score", {
          style: {
            fontFamily: "Arial",
            fontSize: "18px",
            align: "left",
            fill: "white",
          },
          location: Stage.scoreBoxLocation(),
          anchor: { x: 1, y: 0 },
        });
      }
      this.stage.hud.score = val;
    }
  }

  get wave(): number {
    return this.waveVal ? this.waveVal : 0;
  }

  set wave(val: number) {
    this.waveVal = val;

    if (this.stage && this.stage.hud) {
      if (!Object.prototype.hasOwnProperty.call(this.stage.hud, "waveStatus")) {
        this.stage.hud.createTextBox("waveStatus", {
          style: {
            fontFamily: "Arial",
            fontSize: "14px",
            align: "center",
            fill: "white",
          },
          location: Stage.waveStatusBoxLocation(),
          anchor: { x: 1, y: 1 },
        });
      }

      if (!isNaN(val) && val > 0) {
        this.stage.hud.waveStatus = "wave " + val + " of " + this.level.waves;
      } else {
        this.stage.hud.waveStatus = "";
      }
    }
  }

  get gameStatus(): string {
    return this.gameStatusVal ? this.gameStatusVal : "";
  }

  set gameStatus(val: string) {
    this.gameStatusVal = val;

    if (this.stage && this.stage.hud) {
      if (!Object.prototype.hasOwnProperty.call(this.stage.hud, "gameStatus")) {
        this.stage.hud.createTextBox("gameStatus", {
          style: {
            fontFamily: "Arial",
            fontSize: "40px",
            align: "left",
            fill: "white",
          },
          location: Stage.gameStatusBoxLocation(),
        });
      }
      this.stage.hud.gameStatus = val;
    }
  }

  async load(): Promise<void> {
    this.app = new Application();
    await this.app.init({
      width: window.innerWidth,
      height: window.innerHeight,
      background: BLUE_SKY_COLOR,
    });
    document.body.appendChild(this.app.canvas);

    this.textures = (await Assets.load(this.spritesheet)).textures;
    return this.onLoad();
  }

  onLoad(): void {
    this.stage = new Stage({
      textures: this.textures,
    });
    this.app.stage.addChild(this.stage);

    this.scaleToWindow();
    this.addLinkToLevelCreator();
    this.addPauseLink();
    this.addMuteLink();
    this.addFullscreenLink();
    this.bindEvents();
    this.startLevel();
    this.animate();
  }

  addFullscreenLink(): void {
    this.stage.hud.createTextBox("fullscreenLink", {
      style: BOTTOM_LINK_STYLE,
      location: Stage.fullscreenLinkBoxLocation(),
      anchor: { x: 1, y: 1 },
    });
    this.stage.hud.fullscreenLink = "fullscreen (f)";
  }

  addMuteLink(): void {
    this.stage.hud.createTextBox("muteLink", {
      style: BOTTOM_LINK_STYLE,
      location: Stage.muteLinkBoxLocation(),
      anchor: { x: 1, y: 1 },
    });
    this.stage.hud.muteLink = "mute (m)";
  }

  addPauseLink(): void {
    this.stage.hud.createTextBox("pauseLink", {
      style: BOTTOM_LINK_STYLE,
      location: Stage.pauseLinkBoxLocation(),
      anchor: { x: 1, y: 1 },
    });
    this.stage.hud.pauseLink = "pause (p)";
  }

  addLinkToLevelCreator(): void {
    this.stage.hud.createTextBox("levelCreatorLink", {
      style: BOTTOM_LINK_STYLE,
      location: Stage.levelCreatorLinkBoxLocation(),
      anchor: { x: 1, y: 1 },
    });
    this.stage.hud.levelCreatorLink = "level creator (c)";
  }

  bindEvents(): void {
    window.addEventListener("resize", this.scaleToWindow.bind(this));
    this.stage.on("pointerdown", this.handleClick.bind(this));

    document.addEventListener("keypress", (event) => {
      event.stopImmediatePropagation();

      if (event.key === "p") {
        this.pause();
      }
      if (event.key === "m") {
        this.mute();
      }
      if (event.key === "c") {
        this.openLevelCreator();
      }
      if (event.key === "f") {
        this.fullscreen();
      }
    });

    document.addEventListener("fullscreenchange", () => {
      if (document.fullscreenElement) {
        this.stage.hud.fullscreenLink = "unfullscreen (f)";
      } else {
        this.stage.hud.fullscreenLink = "fullscreen (f)";
      }
    });

    sound.on("play", (soundId: number) => {
      if (this.activeSounds.indexOf(soundId) === -1) {
        this.activeSounds.push(soundId);
      }
    });
    sound.on("stop", this.removeActiveSound.bind(this));
    sound.on("end", this.removeActiveSound.bind(this));
  }

  fullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    utils.toggleFullscreen();
  }

  pause(): void {
    this.stage.hud.pauseLink = this.paused ? "pause (p)" : "unpause (p)";
    setTimeout(() => {
      this.paused = !this.paused;
      if (this.paused) {
        this.pauseStartTime = Date.now();
        this.stage.pause();
        this.activeSounds.forEach((soundId) => {
          sound.pause(soundId);
        });
      } else {
        this.timePaused += (Date.now() - this.pauseStartTime!) / 1000;
        this.stage.resume();
        this.activeSounds.forEach((soundId) => {
          sound.play(soundId);
        });
      }
    }, 40);
  }

  removeActiveSound(soundId: number): void {
    _remove(this.activeSounds, (item) => item === soundId);
  }

  mute(): void {
    this.stage.hud.muteLink = this.muted ? "mute (m)" : "unmute (m)";
    this.muted = !this.muted;
    sound.mute(this.muted);
  }

  scaleToWindow(): void {
    this.app.renderer.resize(window.innerWidth, window.innerHeight);
    this.stage.scaleToWindow();
  }

  async startLevel(): Promise<void> {
    if (levelCreator.urlContainsLevelData()) {
      this.level = levelCreator.parseLevelQueryString();
      this.levelIndex = this.levels.length - 1;
    } else {
      this.level = this.levels[this.levelIndex];
    }

    this.maxScore +=
      this.level.waves * this.level.ducks * this.level.pointsPerDuck;
    this.ducksShot = 0;
    this.ducksMissed = 0;
    this.wave = 0;

    this.gameStatus = this.level.title;
    await this.stage.preLevelAnimation();
    this.gameStatus = "";
    this.startWave();
  }

  startWave(): void {
    this.quackingSoundId = sound.play("quacking") as number;
    this.wave += 1;
    this.waveStartTime = Date.now();
    this.bullets = this.level.bullets;
    this.ducksShotThisWave = 0;
    this.waveEnding = false;

    this.stage.addDucks(this.level.ducks, this.level.speed);
  }

  endWave(): void {
    this.waveEnding = true;
    this.bullets = 0;
    sound.stop(this.quackingSoundId!);
    if (this.stage.ducksAlive()) {
      this.ducksMissed += this.level.ducks - this.ducksShotThisWave!;
      (this.app.renderer as any).backgroundColor = PINK_SKY_COLOR;
      this.stage.flyAway().then(this.goToNextWave.bind(this));
    } else {
      this.stage.cleanUpDucks();
      this.goToNextWave();
    }
  }

  goToNextWave(): void {
    (this.app.renderer as any).backgroundColor = BLUE_SKY_COLOR;
    if (this.level.waves === this.wave) {
      this.endLevel();
    } else {
      this.startWave();
    }
  }

  shouldWaveEnd(): boolean {
    if (this.wave === 0 || this.waveEnding || this.stage.dogActive()) {
      return false;
    }
    return (
      this.isWaveTimeUp() ||
      (this.outOfAmmo() && this.stage.ducksAlive()) ||
      !this.stage.ducksActive()
    );
  }

  isWaveTimeUp(): boolean {
    return this.level ? this.waveElapsedTime() >= this.level.time : false;
  }

  waveElapsedTime(): number {
    return (Date.now() - this.waveStartTime!) / 1000 - this.timePaused;
  }

  outOfAmmo(): boolean {
    return this.level && this.bullets === 0;
  }

  endLevel(): void {
    this.wave = 0;
    this.goToNextLevel();
  }

  goToNextLevel(): void {
    this.levelIndex++;
    if (!this.levelWon()) {
      this.loss();
    } else if (this.levelIndex < this.levels.length) {
      this.startLevel();
    } else {
      this.win();
    }
  }

  levelWon(): boolean {
    return this.ducksShot > SUCCESS_RATIO * this.level.ducks * this.level.waves;
  }

  win(): void {
    sound.play("champ");
    this.gameStatus = "You Win!";
    this.showReplay(this.getScoreMessage());
  }

  loss(): void {
    sound.play("loserSound");
    this.gameStatus = "You Lose!";
    this.showReplay(this.getScoreMessage());
  }

  getScoreMessage(): string {
    let scoreMessage = "";

    const percentage = (this.score / this.maxScore) * 100;

    if (percentage === 100) {
      scoreMessage = "Flawless victory.";
    }
    if (percentage < 100) {
      scoreMessage = "Close to perfection.";
    }
    if (percentage <= 95) {
      scoreMessage = "Truly impressive score.";
    }
    if (percentage <= 85) {
      scoreMessage = "Solid score.";
    }
    if (percentage <= 75) {
      scoreMessage = "Participation award.";
    }
    if (percentage <= 63) {
      scoreMessage = "Yikes.";
    }

    return scoreMessage;
  }

  showReplay(replayText: string): void {
    this.stage.hud.createTextBox("replayButton", {
      location: Stage.replayButtonLocation(),
    });
    this.stage.hud.replayButton = replayText + " Play Again?";
  }

  openLevelCreator(): void {
    if (!this.paused) {
      this.pause();
    }
    window.open("/creator.html", "_blank");
  }

  handleClick(event: any): void {
    const clickPoint = {
      x: event.global.x,
      y: event.global.y,
    };

    if (this.stage.clickedPauseLink(clickPoint)) {
      this.pause();
      return;
    }
    if (this.stage.clickedMuteLink(clickPoint)) {
      this.mute();
      return;
    }
    if (this.stage.clickedFullscreenLink(clickPoint)) {
      this.fullscreen();
      return;
    }
    if (this.stage.clickedLevelCreatorLink(clickPoint)) {
      this.openLevelCreator();
      return;
    }

    if (
      !this.stage.hud.replayButton &&
      !this.outOfAmmo() &&
      !this.shouldWaveEnd() &&
      !this.paused
    ) {
      sound.play("gunSound");
      this.bullets -= 1;
      this.updateScore(this.stage.shotsFired(clickPoint, this.level.radius));
      return;
    }

    if (this.stage.hud.replayButton && this.stage.clickedReplay(clickPoint)) {
      (window as any).location = window.location.pathname;
    }
  }

  updateScore(ducksShot: number): void {
    this.ducksShot += ducksShot;
    this.ducksShotThisWave = (this.ducksShotThisWave || 0) + ducksShot;
    this.score += ducksShot * this.level.pointsPerDuck;
  }

  animate(): void {
    this.app.ticker.add(() => {
      if (!this.paused) {
        if (this.shouldWaveEnd()) {
          this.endWave();
        }
      }
    });
  }
}

export default Game;

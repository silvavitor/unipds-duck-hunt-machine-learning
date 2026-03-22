import { Howl } from "howler";
// @ts-ignore - dist/audio.json is generated at build time by gulp
import audioSpriteSheet from "../../dist/audio.json";

const sound = new Howl(audioSpriteSheet as any);

export default sound;

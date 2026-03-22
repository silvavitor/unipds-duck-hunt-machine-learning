declare module "gsap" {
  export class TimelineLite {
    constructor(opts?: Record<string, any>);
    add(item: any, position?: any): this;
    to(target: any, duration: number, vars: Record<string, any>): this;
    pause(): this;
    play(): this;
    getChildren(): any[];
    isActive(): boolean;
  }

  export class TweenMax {
    static to(target: any, duration: number, vars: Record<string, any>): any;
  }
}

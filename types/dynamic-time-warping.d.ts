declare module 'dynamic-time-warping' {
  class DynamicTimeWarping {
    constructor(
      ts1: number[],
      ts2: number[],
      distanceFunction: (a: number, b: number) => number
    );
    getDistance(): number;
    getPath(): number[][];
  }
  export = DynamicTimeWarping;
}

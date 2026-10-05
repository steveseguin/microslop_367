/** Types for the parts of imagetracerjs (public domain) that NinjaSVG uses. */
declare module 'imagetracerjs' {
  export interface TraceSegment {
    type: 'L' | 'Q';
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    x3?: number;
    y3?: number;
  }
  export interface TracePath {
    segments: TraceSegment[];
    holechildren: number[];
    isholepath: boolean;
    /** [x1, y1, x2, y2] */
    boundingbox: [number, number, number, number];
  }
  export interface TraceData {
    layers: TracePath[][];
    palette: { r: number; g: number; b: number; a: number }[];
    width: number;
    height: number;
  }
  export interface TracerOptions {
    ltres?: number;
    qtres?: number;
    pathomit?: number;
    rightangleenhance?: boolean;
    colorsampling?: number;
    numberofcolors?: number;
    mincolorratio?: number;
    colorquantcycles?: number;
    blurradius?: number;
    blurdelta?: number;
    pal?: { r: number; g: number; b: number; a: number }[];
  }
  const ImageTracer: {
    imagedataToTracedata(img: ImageData, options?: TracerOptions): TraceData;
  };
  export default ImageTracer;
}

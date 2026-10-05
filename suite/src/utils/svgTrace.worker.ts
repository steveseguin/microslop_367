/// <reference lib="webworker" />
import { traceImageData } from './svgTrace';
import type { TraceOptions } from './svgTrace';

self.onmessage = (
  e: MessageEvent<{
    id: number;
    img: ImageData;
    options: TraceOptions;
    outWidth: number;
    outHeight: number;
  }>,
) => {
  const { id, img, options, outWidth, outHeight } = e.data;
  try {
    const result = traceImageData(img, options, outWidth, outHeight);
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({
      id,
      error: error instanceof Error ? error.message : 'Tracing failed.',
    });
  }
};

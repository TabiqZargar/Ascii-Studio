import { convertToAscii, type ConversionOptions } from "../engine/conversionEngine";

self.onmessage = (e: MessageEvent) => {
  const { imageData, options } = e.data as {
    imageData: ImageData;
    options: ConversionOptions;
  };

  const result = convertToAscii(imageData, options);

  self.postMessage({
    output: result.ascii,
    colorGrid: result.colorGrid,
    time: result.processingTime,
  });
};

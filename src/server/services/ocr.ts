import Tesseract from "tesseract.js";

export interface OcrResult {
  text: string;
}

export async function recognizeImage(
  image: Buffer | string,
): Promise<OcrResult> {
  const result = await Tesseract.recognize(image, "eng");
  return { text: result.data.text };
}

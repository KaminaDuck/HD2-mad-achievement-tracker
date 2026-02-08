import Tesseract from "tesseract.js";

export async function recognizeImage(
  image: Buffer | string,
): Promise<string> {
  const result = await Tesseract.recognize(image, "eng");
  return result.data.text;
}

/**
 * Photos live in LocalStorage alongside everything else, which gives the whole
 * app roughly 5 MB. Full-size iPhone photos would fill that with three pictures,
 * so every import is downscaled and re-encoded before it is stored.
 */

export const MAX_PHOTO_EDGE = 1280;
export const PHOTO_QUALITY = 0.72;
export const MAX_PHOTOS_PER_ENTRY = 6;

export class ImageTooLargeError extends Error {
  constructor() {
    super("That photo is too large to store even after resizing.");
    this.name = "ImageTooLargeError";
  }
}

/** Hard ceiling per photo after compression: ~600 KB of base64. */
const MAX_STORED_BYTES = 600_000;

export async function fileToStoredPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("That file is not an image.");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    MAX_PHOTO_EDGE / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("This browser will not let the app resize images.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = PHOTO_QUALITY;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);

  // Step the quality down rather than rejecting a photo outright.
  while (dataUrl.length > MAX_STORED_BYTES && quality > 0.35) {
    quality -= 0.12;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  if (dataUrl.length > MAX_STORED_BYTES) throw new ImageTooLargeError();

  return dataUrl;
}

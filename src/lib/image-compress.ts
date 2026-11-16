import imageCompression from "browser-image-compression";

/**
 * Comprime y achica la foto en el celular antes de subirla.
 * La dueña no tiene que preocuparse por el peso ni el formato.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Ese archivo no es una foto.");
  }
  try {
    const out = await imageCompression(file, {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      initialQuality: 0.82,
      fileType: file.type === "image/png" ? "image/png" : "image/jpeg",
    });
    const name = file.name.replace(/\.[^.]+$/, "") + (out.type === "image/png" ? ".png" : ".jpg");
    return new File([out], name, { type: out.type });
  } catch {
    // Si falla la compresión (formato raro), subimos el original.
    return file;
  }
}

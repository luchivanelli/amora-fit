import { v2 as cloudinary } from "cloudinary";

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET,
  );
}

function configure() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

/**
 * Firma para subir directo desde el navegador a Cloudinary.
 * Así no pasa el archivo por nuestro servidor ni hace falta una API route.
 */
export function createUploadSignature(productId: string) {
  const c = configure();
  const timestamp = Math.round(Date.now() / 1000);
  const folder = `${process.env.CLOUDINARY_FOLDER || "amora/productos"}/${productId}`;
  const params = { timestamp, folder };
  const signature = c.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);
  return {
    signature,
    timestamp,
    folder,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
  };
}

export async function destroyImage(publicId: string) {
  if (!isCloudinaryConfigured()) return;
  try {
    await configure().uploader.destroy(publicId);
  } catch (e) {
    // No frenamos la operación de la dueña por una foto huérfana en Cloudinary.
    console.error("No se pudo borrar la imagen en Cloudinary:", publicId, e);
  }
}

/** Verifica que la URL sea de nuestro Cloudinary (o del seed) antes de guardarla. */
export function isAllowedImageUrl(url: string) {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    return u.hostname === "res.cloudinary.com" || u.hostname === "images.unsplash.com";
  } catch {
    return false;
  }
}

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  api_key: process.env.CLOUDINARY_API_KEY ?? "",
  api_secret: process.env.CLOUDINARY_API_SECRET ?? "",
});

export { cloudinary };

export async function uploadImagem(buffer: Buffer, pasta: string = "produtos"): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `linkcommerce/${pasta}`,
          resource_type: "image",
          transformation: [
            { width: 1200, height: 1200, crop: "limit" },
            { quality: "auto:good" },
            { fetch_format: "webp" },
          ],
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error("Upload falhou"));
          resolve(result.secure_url);
        }
      )
      .end(buffer);
  });
}

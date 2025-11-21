export const prepareHeaders = (headers) => {
  const token = localStorage.getItem("token");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
};

export const baseUrl =
  import.meta.env.VITE_API_BASE ||
  "https://picture-selection-be-stg.esparkconsultants.com/api/v1/";

export function createImage(url = "") {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Crop image from base64 / URL and return Blob + Object URL
 * @param {string|object} imageData - Either URL string or { image: base64, mime_type: string }
 * @param {object} croppedAreaPixels - { x, y, width, height }
 * @returns {Promise<{blob: Blob, url: string}>}
 */
export async function getCroppedImg(imageData, croppedAreaPixels) {
  return new Promise((resolve, reject) => {
    let mimeType = "image/jpeg";
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = Math.max(1, Math.floor(croppedAreaPixels.width));
      canvas.height = Math.max(1, Math.floor(croppedAreaPixels.height));

      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve({ blob, url: URL.createObjectURL(blob) });
      }, mimeType);
    };

    img.onerror = (err) => reject(err);

    if (typeof imageData === "object" && imageData?.image) {
      mimeType = imageData.mime_type || mimeType;
      img.src = `data:${mimeType};base64,${imageData.image}`;
    } else {
      img.src = imageData;
    }
  });
}

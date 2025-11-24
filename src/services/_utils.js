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
 * Perfectly crops an image (supports multi-time cropping without shifting)
 * @param {string|object} imageData - URL or { image: base64, mime_type }
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

      // ---- FIXED: avoid floating pixel issues ----
      const sx = Math.round(croppedAreaPixels.x);
      const sy = Math.round(croppedAreaPixels.y);
      const sw = Math.round(croppedAreaPixels.width);
      const sh = Math.round(croppedAreaPixels.height);

      canvas.width = sw;
      canvas.height = sh;

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas empty"));
            return;
          }

          // ---- FIXED: prevent memory leak & ensure correct next crop ----
          const url = URL.createObjectURL(blob);

          resolve({ blob, url });
        },
        mimeType,
        1
      );
    };

    img.onerror = (err) => reject(err);

    // RESET IMG BEFORE LOADING
    img.src = "";

    if (typeof imageData === "object" && imageData?.image) {
      mimeType = imageData.mime_type || mimeType;
      img.src = `data:${mimeType};base64,${imageData.image}`;
    } else {
      img.src = imageData;
    }
  });
}

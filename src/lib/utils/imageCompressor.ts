/**
 * Utility to compress images on the client side using HTML Canvas.
 * Automatically resizes large images and converts them to high-efficiency WebP format.
 */
export function compressImageToWebP(
  file: File,
  quality = 0.82,
  maxWidth = 1600
): Promise<File> {
  return new Promise((resolve) => {
    // If not an image, resolve immediately with original file
    if (!file.type.startsWith("image/")) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Resize only if larger than maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(file);
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas contents to webp blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }

            // Construct new WebP filename
            const originalName = file.name;
            const dotIndex = originalName.lastIndexOf(".");
            const baseName = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
            
            const webpFile = new File([blob], `${baseName}.webp`, {
              type: "image/webp",
              lastModified: Date.now(),
            });

            resolve(webpFile);
          },
          "image/webp",
          quality
        );
      };
      
      img.onerror = () => {
        resolve(file); // fallback on image load error
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      resolve(file); // fallback on read error
    };

    reader.readAsDataURL(file);
  });
}

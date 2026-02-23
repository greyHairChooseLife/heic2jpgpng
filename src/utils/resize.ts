interface ResizeOptions {
  maxWidth: number | null;
  maxHeight: number | null;
}

export const resizeImage = async (
  blob: Blob,
  options: ResizeOptions
): Promise<Blob> => {
  const { maxWidth, maxHeight } = options;

  // No resize needed
  if (!maxWidth && !maxHeight) {
    return blob;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Calculate new dimensions
      if (maxWidth && maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      } else if (maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height *= ratio;
      } else if (maxHeight) {
        const ratio = maxHeight / height;
        height = maxHeight;
        width *= ratio;
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (resizedBlob) => {
          if (resizedBlob) {
            resolve(resizedBlob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        blob.type,
        0.95
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
};

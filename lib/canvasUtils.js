/**
 * Loads an image from a URL.
 * Uses a proxy for remote (http/https) images to avoid CORS/canvas tainting issues.
 */
export const createImage = (url) => {
  let src = url;
  if (url && url.startsWith('http')) {
    src = `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (err) => reject(err));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = src;
  });
};

/**
 * Core Canvas Processing Engine.
 *
 * Takes the raw image and the editor settings (zoom, crop position, aspect ratio, logo)
 * and physically draws the final output image — exactly matching what the preview shows.
 *
 * @param {string} imageUrl - Blob URL or remote URL of the source image
 * @param {object} settings - Editor settings from the queued image state
 * @param {string|null} logoUrl - URL of the logo/watermark to overlay
 * @returns {Promise<Blob>} - The final processed JPEG image Blob
 */
export async function createProcessedImage(imageUrl, settings, logoUrl) {
  const {
    croppedAreaPixels,
    zoom = 1,
    crop = { x: 0, y: 0 },
    aspect,
    naturalAspect,
    showLogo = false,
    logoOpacity = 70,
    logoSizePercent = 30,
    logoPosPercent = { x: 50, y: 50 },
  } = settings;

  const originalImage = await createImage(imageUrl);
  const { naturalWidth: imgW, naturalHeight: imgH } = originalImage;

  let cropPixels = croppedAreaPixels;

  // If croppedAreaPixels is not provided (user didn't drag crop area),
  // calculate it from zoom + crop position + aspect ratio to match the preview exactly.
  if (!cropPixels) {
    // Determine the output aspect ratio
    const outputAspect = aspect || naturalAspect || (imgW / imgH);

    // The cropper shows the image scaled to fit a container, then zoomed.
    // We need to reverse-calculate the actual pixel crop from the zoom level and crop offset.
    //
    // react-easy-crop works this way:
    // - The image is scaled to fit within the crop area maintaining aspect ratio.
    // - zoom multiplies that scale.
    // - crop.x and crop.y are pixel offsets FROM the CENTER of the rendered image.
    //
    // To find the source rectangle we need to map crop-area pixels back to image pixels.

    // The crop area in display-space is defined by the output aspect ratio.
    // We need to figure out what portion of the original image is visible.

    // Simplest accurate method: derive from the final aspect ratio and zoom.
    // The visible crop width in image-space = imgW / zoom
    // The visible crop height in image-space = imgH / zoom
    // But we also need to account for the output aspect.

    // Find the crop area dimensions in image pixels based on aspect and zoom:
    // The image fills the crop-box. If outputAspect > imgAspect, image is limited by width.
    const imgAspect = imgW / imgH;

    let visibleW, visibleH;
    if (outputAspect >= imgAspect) {
      // Width is the limiting dimension
      visibleW = imgW / zoom;
      visibleH = visibleW / outputAspect;
    } else {
      // Height is the limiting dimension
      visibleH = imgH / zoom;
      visibleW = visibleH * outputAspect;
    }

    // The center of the image in image-space
    const centerX = imgW / 2;
    const centerY = imgH / 2;

    // crop.x and crop.y in react-easy-crop are percentage-based offsets in display space
    // Convert them to image pixel offsets:
    // At zoom=1 with image fitting the box, 1 display pixel = imgW/containerW image pixels
    // crop offset in image pixels = -(crop.x / scale)
    // But since we don't have containerW, we use the relationship:
    // The offset of crop.x maps to (crop.x / zoom) fraction of the original image width
    const offsetX = -(crop.x / zoom);
    const offsetY = -(crop.y / zoom);

    const x = Math.max(0, Math.round(centerX + offsetX - visibleW / 2));
    const y = Math.max(0, Math.round(centerY + offsetY - visibleH / 2));
    const width = Math.min(Math.round(visibleW), imgW - x);
    const height = Math.min(Math.round(visibleH), imgH - y);

    cropPixels = { x, y, width, height };
  }

  // Create the canvas with the cropped dimensions
  const canvas = document.createElement('canvas');
  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;
  const ctx = canvas.getContext('2d');

  // Draw cropped region from original image
  ctx.drawImage(
    originalImage,
    cropPixels.x, cropPixels.y,
    cropPixels.width, cropPixels.height,
    0, 0,
    cropPixels.width, cropPixels.height
  );

  // Overlay the logo watermark if enabled
  if (showLogo && logoUrl) {
    try {
      const logoImage = await createImage(logoUrl);

      const logoW = (canvas.width * logoSizePercent) / 100;
      const logoH = logoW * (logoImage.naturalHeight / logoImage.naturalWidth);

      const logoX = (canvas.width * logoPosPercent.x) / 100 - logoW / 2;
      const logoY = (canvas.height * logoPosPercent.y) / 100 - logoH / 2;

      ctx.globalAlpha = logoOpacity / 100;
      ctx.drawImage(logoImage, logoX, logoY, logoW, logoH);
      ctx.globalAlpha = 1.0;
    } catch (logoErr) {
      console.warn('Logo overlay failed, skipping:', logoErr);
    }
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Canvas is empty'));
        resolve(blob);
      },
      'image/jpeg',
      0.92
    );
  });
}

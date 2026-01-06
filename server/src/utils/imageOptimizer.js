const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

/**
 * Image Optimizer Utility
 *
 * Optimizes images using sharp for better performance
 * Supports format conversion, resizing, and quality adjustment
 */

/**
 * Optimize image with specified options
 *
 * @param {string} inputPath - Path to input image
 * @param {Object} options - Optimization options
 * @param {string} options.outputPath - Path for output (optional, defaults to inputPath with suffix)
 * @param {string} options.format - Output format: 'webp', 'jpeg', 'png' (default: 'webp')
 * @param {number} options.quality - Quality 1-100 (default: 80)
 * @param {number} options.width - Max width (optional)
 * @param {number} options.height - Max height (optional)
 * @param {boolean} options.fit - How to fit: 'cover', 'contain', 'fill', 'inside', 'outside' (default: 'inside')
 * @returns {Promise<Object>} - Result with output path and metadata
 */
async function optimizeImage(inputPath, options = {}) {
  const {
    outputPath = null,
    format = 'webp',
    quality = 80,
    width = null,
    height = null,
    fit = 'inside'
  } = options;

  try {
    // Check if input file exists
    await fs.access(inputPath);

    // Generate output path if not provided
    let finalOutputPath = outputPath;
    if (!finalOutputPath) {
      const ext = path.extname(inputPath);
      const basename = path.basename(inputPath, ext);
      const dirname = path.dirname(inputPath);
      finalOutputPath = path.join(dirname, `${basename}_optimized.${format}`);
    }

    // Create sharp instance
    let pipeline = sharp(inputPath);

    // Apply resizing if dimensions provided
    if (width || height) {
      pipeline = pipeline.resize(width, height, {
        fit,
        withoutEnlargement: true
      });
    }

    // Apply format and quality settings
    switch (format.toLowerCase()) {
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
      case 'jpeg':
      case 'jpg':
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        break;
      case 'png':
        pipeline = pipeline.png({ quality, compressionLevel: 9 });
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    // Save optimized image
    const info = await pipeline.toFile(finalOutputPath);

    // Get file sizes for comparison
    const inputStats = await fs.stat(inputPath);
    const outputStats = await fs.stat(finalOutputPath);

    return {
      success: true,
      inputPath,
      outputPath: finalOutputPath,
      originalSize: inputStats.size,
      optimizedSize: outputStats.size,
      savings: inputStats.size - outputStats.size,
      savingsPercent: Math.round(((inputStats.size - outputStats.size) / inputStats.size) * 100),
      format: info.format,
      width: info.width,
      height: info.height
    };
  } catch (error) {
    throw new Error(`Failed to optimize image: ${error.message}`);
  }
}

/**
 * Generate thumbnail from image
 *
 * @param {string} inputPath - Path to input image
 * @param {Object} options - Thumbnail options
 * @param {string} options.outputPath - Path for thumbnail (optional)
 * @param {number} options.width - Thumbnail width (default: 200)
 * @param {number} options.height - Thumbnail height (default: 200)
 * @param {string} options.format - Output format (default: 'webp')
 * @param {number} options.quality - Quality 1-100 (default: 70)
 * @param {string} options.fit - How to fit (default: 'cover')
 * @returns {Promise<Object>} - Result with thumbnail path and metadata
 */
async function generateThumbnail(inputPath, options = {}) {
  const {
    outputPath = null,
    width = 200,
    height = 200,
    format = 'webp',
    quality = 70,
    fit = 'cover'
  } = options;

  try {
    // Check if input file exists
    await fs.access(inputPath);

    // Generate output path if not provided
    let finalOutputPath = outputPath;
    if (!finalOutputPath) {
      const ext = path.extname(inputPath);
      const basename = path.basename(inputPath, ext);
      const dirname = path.dirname(inputPath);
      finalOutputPath = path.join(dirname, `${basename}_thumb.${format}`);
    }

    // Create thumbnail
    const pipeline = sharp(inputPath)
      .resize(width, height, {
        fit,
        position: 'center'
      });

    // Apply format
    switch (format.toLowerCase()) {
      case 'webp':
        pipeline.webp({ quality });
        break;
      case 'jpeg':
      case 'jpg':
        pipeline.jpeg({ quality, mozjpeg: true });
        break;
      case 'png':
        pipeline.png({ quality });
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    const info = await pipeline.toFile(finalOutputPath);

    return {
      success: true,
      inputPath,
      thumbnailPath: finalOutputPath,
      format: info.format,
      width: info.width,
      height: info.height,
      size: (await fs.stat(finalOutputPath)).size
    };
  } catch (error) {
    throw new Error(`Failed to generate thumbnail: ${error.message}`);
  }
}

/**
 * Get image metadata
 *
 * @param {string} imagePath - Path to image
 * @returns {Promise<Object>} - Image metadata
 */
async function getImageMetadata(imagePath) {
  try {
    const metadata = await sharp(imagePath).metadata();
    const stats = await fs.stat(imagePath);

    return {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      space: metadata.space,
      channels: metadata.channels,
      depth: metadata.depth,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
      size: stats.size
    };
  } catch (error) {
    throw new Error(`Failed to get image metadata: ${error.message}`);
  }
}

/**
 * Batch optimize images
 *
 * @param {Array<string>} imagePaths - Array of image paths
 * @param {Object} options - Optimization options
 * @returns {Promise<Array>} - Array of optimization results
 */
async function batchOptimize(imagePaths, options = {}) {
  const results = [];

  for (const imagePath of imagePaths) {
    try {
      const result = await optimizeImage(imagePath, options);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        inputPath: imagePath,
        error: error.message
      });
    }
  }

  return results;
}

module.exports = {
  optimizeImage,
  generateThumbnail,
  getImageMetadata,
  batchOptimize
};

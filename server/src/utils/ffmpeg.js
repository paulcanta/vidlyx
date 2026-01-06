const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;

/**
 * FFmpeg Utilities
 * Handles video frame extraction and video analysis using FFmpeg
 */

/**
 * Get video duration using ffprobe
 * @param {string} videoPath - Path to video file or URL
 * @returns {Promise<number>} Duration in seconds
 */
function getVideoDuration(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to get video duration: ${err.message}`));
        return;
      }

      const duration = metadata.format.duration;
      if (!duration) {
        reject(new Error('Duration not found in video metadata'));
        return;
      }

      resolve(duration);
    });
  });
}

/**
 * Extract a single frame at a specific timestamp
 * @param {string} videoPath - Path to video file or URL
 * @param {string} outputPath - Path where the frame should be saved
 * @param {number} timestamp - Timestamp in seconds
 * @param {Object} options - Optional settings
 * @param {number} options.width - Output width (maintains aspect ratio)
 * @param {number} options.quality - JPEG quality 1-31 (2 is high quality, default: 2)
 * @returns {Promise<string>} Path to the extracted frame
 */
function extractFrameAt(videoPath, outputPath, timestamp, options = {}) {
  return new Promise((resolve, reject) => {
    const {
      width = null,
      quality = 2
    } = options;

    let command = ffmpeg(videoPath)
      .seekInput(timestamp)
      .frames(1)
      .outputOptions([
        `-q:v ${quality}` // JPEG quality (lower is better, range 1-31)
      ]);

    // Apply width scaling if specified
    if (width) {
      command = command.size(`${width}x?`);
    }

    command
      .output(outputPath)
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        reject(new Error(`Failed to extract frame at ${timestamp}s: ${err.message}`));
      })
      .run();
  });
}

/**
 * Extract frames at regular intervals from a video
 * @param {string} videoPath - Path to video file or URL
 * @param {string} outputDir - Directory where frames should be saved
 * @param {Object} options - Extraction options
 * @param {number} options.interval - Interval in seconds between frames (default: 5)
 * @param {number} options.width - Output width in pixels (maintains aspect ratio)
 * @param {number} options.quality - JPEG quality 1-31 (2 is high quality, default: 2)
 * @param {string} options.format - Output format (default: 'jpg')
 * @param {number} options.maxFrames - Maximum number of frames to extract (optional)
 * @param {number} options.startTime - Start time in seconds (default: 0)
 * @param {number} options.endTime - End time in seconds (optional)
 * @returns {Promise<Array<Object>>} Array of extracted frame info
 */
async function extractFrames(videoPath, outputDir, options = {}) {
  const {
    interval = 5,
    width = null,
    quality = 2,
    format = 'jpg',
    maxFrames = null,
    startTime = 0,
    endTime = null
  } = options;

  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Get video duration
    const duration = await getVideoDuration(videoPath);
    const effectiveEndTime = endTime || duration;

    // Calculate frame timestamps
    const timestamps = [];
    let currentTime = startTime;

    while (currentTime < effectiveEndTime) {
      timestamps.push(currentTime);

      if (maxFrames && timestamps.length >= maxFrames) {
        break;
      }

      currentTime += interval;
    }

    // Extract frames at calculated timestamps
    const frames = [];

    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      const frameNumber = i + 1;
      const filename = `frame_${String(frameNumber).padStart(6, '0')}_${timestamp.toFixed(2)}s.${format}`;
      const outputPath = path.join(outputDir, filename);

      try {
        await extractFrameAt(videoPath, outputPath, timestamp, { width, quality });

        frames.push({
          frameNumber,
          timestamp,
          filename,
          path: outputPath
        });
      } catch (error) {
        console.error(`Failed to extract frame at ${timestamp}s:`, error.message);
        // Continue with next frame even if one fails
      }
    }

    return frames;

  } catch (error) {
    throw new Error(`Failed to extract frames: ${error.message}`);
  }
}

/**
 * Extract frames using FFmpeg fps filter (alternative method)
 * This method uses FFmpeg's fps filter which can be more efficient for large batches
 * @param {string} videoPath - Path to video file or URL
 * @param {string} outputDir - Directory where frames should be saved
 * @param {Object} options - Extraction options
 * @param {number} options.fps - Frames per second to extract (default: 0.2 = 1 frame every 5 seconds)
 * @param {number} options.width - Output width in pixels (maintains aspect ratio)
 * @param {number} options.quality - JPEG quality 1-31 (2 is high quality, default: 2)
 * @param {string} options.format - Output format (default: 'jpg')
 * @param {number} options.startTime - Start time in seconds (default: 0)
 * @param {number} options.duration - Duration to extract in seconds (optional)
 * @returns {Promise<string>} Output directory path
 */
function extractFramesWithFps(videoPath, outputDir, options = {}) {
  return new Promise(async (resolve, reject) => {
    const {
      fps = 0.2, // 1 frame every 5 seconds
      width = null,
      quality = 2,
      format = 'jpg',
      startTime = 0,
      duration = null
    } = options;

    try {
      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      const outputPattern = path.join(outputDir, `frame_%06d.${format}`);

      let command = ffmpeg(videoPath)
        .outputOptions([
          `-vf fps=${fps}${width ? `,scale=${width}:-1` : ''}`,
          `-q:v ${quality}`
        ]);

      // Apply time range if specified
      if (startTime > 0) {
        command = command.seekInput(startTime);
      }

      if (duration) {
        command = command.duration(duration);
      }

      command
        .output(outputPattern)
        .on('end', () => {
          resolve(outputDir);
        })
        .on('error', (err) => {
          reject(new Error(`Failed to extract frames with fps filter: ${err.message}`));
        })
        .run();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get video metadata using ffprobe
 * @param {string} videoPath - Path to video file or URL
 * @returns {Promise<Object>} Video metadata
 */
function getVideoMetadata(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to get video metadata: ${err.message}`));
        return;
      }

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');

      resolve({
        duration: metadata.format.duration,
        size: metadata.format.size,
        bitrate: metadata.format.bit_rate,
        format: metadata.format.format_name,
        width: videoStream?.width,
        height: videoStream?.height,
        fps: videoStream?.r_frame_rate,
        codec: videoStream?.codec_name
      });
    });
  });
}

module.exports = {
  getVideoDuration,
  extractFrameAt,
  extractFrames,
  extractFramesWithFps,
  getVideoMetadata
};

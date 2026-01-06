const { spawn } = require('child_process');
const path = require('path');

/**
 * Python Service
 * Manages execution of Python scripts for YouTube analysis
 */

// Path to Python virtual environment
const PYTHON_VENV = path.join(__dirname, '../../../python/venv/bin/python3');
const SCRIPTS_DIR = path.join(__dirname, '../../../python/scripts');

/**
 * Run a Python script and return parsed JSON result
 * @param {string} scriptName - Name of the Python script to run
 * @param {Array<string>} args - Arguments to pass to the script
 * @param {number} timeout - Timeout in milliseconds (default: 30000)
 * @returns {Promise<Object>} Parsed JSON response from Python script
 */
function runPythonScript(scriptName, args = [], timeout = 30000) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(SCRIPTS_DIR, scriptName);

        // Spawn Python process
        const pythonProcess = spawn(PYTHON_VENV, [scriptPath, ...args]);

        let stdout = '';
        let stderr = '';
        let timeoutId;

        // Set timeout
        timeoutId = setTimeout(() => {
            pythonProcess.kill();
            reject(new Error(`Python script timed out after ${timeout}ms`));
        }, timeout);

        // Collect stdout
        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        // Collect stderr
        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        // Handle process completion
        pythonProcess.on('close', (code) => {
            clearTimeout(timeoutId);

            if (code !== 0) {
                reject(new Error(`Python script exited with code ${code}: ${stderr}`));
                return;
            }

            try {
                const result = JSON.parse(stdout);
                resolve(result);
            } catch (error) {
                reject(new Error(`Failed to parse Python script output: ${error.message}\nOutput: ${stdout}`));
            }
        });

        // Handle process errors
        pythonProcess.on('error', (error) => {
            clearTimeout(timeoutId);
            reject(new Error(`Failed to start Python process: ${error.message}`));
        });
    });
}

/**
 * Get video metadata from YouTube
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object>} Video metadata
 */
async function getVideoMetadata(videoId) {
    try {
        const result = await runPythonScript('youtube_analyzer.py', ['metadata', videoId], 60000);

        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch video metadata');
        }

        return result.data;
    } catch (error) {
        throw new Error(`Failed to get video metadata: ${error.message}`);
    }
}

/**
 * Get video transcript from YouTube
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object>} Video transcript data
 */
async function getTranscript(videoId) {
    try {
        const result = await runPythonScript('youtube_analyzer.py', ['transcript', videoId], 60000);

        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch video transcript');
        }

        return result.data;
    } catch (error) {
        throw new Error(`Failed to get video transcript: ${error.message}`);
    }
}

/**
 * Get direct video stream URL for frame extraction
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object>} Stream URL and video info
 */
async function getStreamUrl(videoId) {
    try {
        const result = await runPythonScript('youtube_analyzer.py', ['stream', videoId], 60000);

        if (!result.success) {
            throw new Error(result.error || 'Failed to get video stream URL');
        }

        return result.data;
    } catch (error) {
        throw new Error(`Failed to get stream URL: ${error.message}`);
    }
}

module.exports = {
    runPythonScript,
    getVideoMetadata,
    getTranscript,
    getStreamUrl
};

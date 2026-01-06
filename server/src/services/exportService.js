/**
 * Export service for generating exports of saves and transcripts
 */

const pool = require('./db');

/**
 * Sanitize a string for use as a filename
 * @param {string} name - The string to sanitize
 * @returns {string} - Sanitized filename
 */
function sanitizeFilename(name) {
  if (!name) return 'download';

  return name
    .replace(/[^a-z0-9_\-\s]/gi, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Trim underscores from start and end
    .substring(0, 100); // Limit length
}

/**
 * Format time in seconds to SRT format (HH:MM:SS,mmm)
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time
 */
function formatSrtTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

/**
 * Format time in seconds to VTT format (HH:MM:SS.mmm)
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time
 */
function formatVttTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

/**
 * Get save with all related content
 * @param {string} saveId - Save ID
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Save with all related data
 */
async function getSaveWithContent(saveId, userId) {
  const client = await pool.connect();

  try {
    // Get save with video info
    const saveQuery = `
      SELECT
        s.id,
        s.user_id,
        s.video_id,
        s.title,
        s.notes,
        s.created_at,
        s.updated_at,
        v.youtube_id,
        v.title as video_title,
        v.channel_name,
        v.duration,
        v.thumbnail_url
      FROM saves s
      JOIN videos v ON s.video_id = v.id
      WHERE s.id = $1 AND s.user_id = $2
    `;

    const saveResult = await client.query(saveQuery, [saveId, userId]);

    if (saveResult.rows.length === 0) {
      return null;
    }

    const save = saveResult.rows[0];

    // Get frames
    const framesQuery = `
      SELECT
        f.id,
        f.timestamp_seconds,
        f.frame_path,
        f.on_screen_text,
        f.scene_description,
        f.visual_elements,
        f.is_keyframe
      FROM frames f
      JOIN save_frames sf ON f.id = sf.frame_id
      WHERE sf.save_id = $1
      ORDER BY f.timestamp_seconds ASC
    `;

    const framesResult = await client.query(framesQuery, [saveId]);

    // Get transcript selections
    const transcriptsQuery = `
      SELECT
        id,
        start_time,
        end_time,
        text
      FROM save_transcripts
      WHERE save_id = $1
      ORDER BY start_time ASC
    `;

    const transcriptsResult = await client.query(transcriptsQuery, [saveId]);

    // Get summary excerpts
    const summariesQuery = `
      SELECT
        ss.id,
        ss.excerpt,
        s.title as section_title,
        s.start_time,
        s.end_time
      FROM save_summaries ss
      LEFT JOIN sections s ON ss.section_id = s.id
      WHERE ss.save_id = $1
      ORDER BY s.start_time ASC NULLS LAST
    `;

    const summariesResult = await client.query(summariesQuery, [saveId]);

    // Get folders
    const foldersQuery = `
      SELECT
        f.id,
        f.name,
        f.color,
        f.icon
      FROM folders f
      JOIN save_folders sf ON f.id = sf.folder_id
      WHERE sf.save_id = $1
      ORDER BY f.name ASC
    `;

    const foldersResult = await client.query(foldersQuery, [saveId]);

    // Get tags
    const tagsQuery = `
      SELECT
        t.id,
        t.name,
        t.color
      FROM tags t
      JOIN save_tags st ON t.id = st.tag_id
      WHERE st.save_id = $1
      ORDER BY t.name ASC
    `;

    const tagsResult = await client.query(tagsQuery, [saveId]);

    return {
      ...save,
      frames: framesResult.rows,
      transcripts: transcriptsResult.rows,
      summaries: summariesResult.rows,
      folders: foldersResult.rows,
      tags: tagsResult.rows
    };
  } finally {
    client.release();
  }
}

/**
 * Export save as JSON
 * @param {object} save - Save with all content
 * @returns {object} - JSON export
 */
function exportAsJson(save) {
  return {
    id: save.id,
    title: save.title,
    notes: save.notes,
    created_at: save.created_at,
    updated_at: save.updated_at,
    video: {
      youtube_id: save.youtube_id,
      title: save.video_title,
      channel_name: save.channel_name,
      duration: save.duration,
      thumbnail_url: save.thumbnail_url,
      url: `https://youtube.com/watch?v=${save.youtube_id}`
    },
    frames: save.frames.map(f => ({
      timestamp: parseFloat(f.timestamp_seconds),
      on_screen_text: f.on_screen_text,
      scene_description: f.scene_description,
      visual_elements: f.visual_elements,
      is_keyframe: f.is_keyframe
    })),
    transcripts: save.transcripts.map(t => ({
      start_time: parseFloat(t.start_time),
      end_time: parseFloat(t.end_time),
      text: t.text
    })),
    summaries: save.summaries.map(s => ({
      excerpt: s.excerpt,
      section_title: s.section_title,
      start_time: s.start_time ? parseFloat(s.start_time) : null,
      end_time: s.end_time ? parseFloat(s.end_time) : null
    })),
    folders: save.folders.map(f => ({
      name: f.name,
      color: f.color,
      icon: f.icon
    })),
    tags: save.tags.map(t => ({
      name: t.name,
      color: t.color
    }))
  };
}

/**
 * Export save as Markdown
 * @param {object} save - Save with all content
 * @returns {string} - Markdown export
 */
function exportAsMarkdown(save) {
  let md = '';

  // Header
  md += `# ${save.title}\n\n`;

  // Video info
  md += `## Video Information\n\n`;
  md += `**Title:** ${save.video_title}\n\n`;
  if (save.channel_name) {
    md += `**Channel:** ${save.channel_name}\n\n`;
  }
  md += `**URL:** [Watch on YouTube](https://youtube.com/watch?v=${save.youtube_id})\n\n`;

  // Notes
  if (save.notes) {
    md += `## Notes\n\n${save.notes}\n\n`;
  }

  // Tags
  if (save.tags && save.tags.length > 0) {
    md += `## Tags\n\n`;
    md += save.tags.map(t => `\`${t.name}\``).join(' ') + '\n\n';
  }

  // Folders
  if (save.folders && save.folders.length > 0) {
    md += `## Folders\n\n`;
    save.folders.forEach(f => {
      md += `- ${f.name}\n`;
    });
    md += '\n';
  }

  // Transcript selections
  if (save.transcripts && save.transcripts.length > 0) {
    md += `## Transcript Selections\n\n`;
    save.transcripts.forEach((t, index) => {
      const startTime = formatTimestamp(parseFloat(t.start_time));
      const endTime = formatTimestamp(parseFloat(t.end_time));
      md += `### ${index + 1}. ${startTime} - ${endTime}\n\n`;
      md += `${t.text}\n\n`;
    });
  }

  // Summary excerpts
  if (save.summaries && save.summaries.length > 0) {
    md += `## Summary Excerpts\n\n`;
    save.summaries.forEach((s, index) => {
      if (s.section_title) {
        md += `### ${index + 1}. ${s.section_title}\n\n`;
      } else {
        md += `### ${index + 1}. Summary Excerpt\n\n`;
      }
      md += `${s.excerpt}\n\n`;
    });
  }

  // Frames
  if (save.frames && save.frames.length > 0) {
    md += `## Frames\n\n`;
    save.frames.forEach((f, index) => {
      const timestamp = formatTimestamp(parseFloat(f.timestamp_seconds));
      md += `### ${index + 1}. Frame at ${timestamp}${f.is_keyframe ? ' (Key Frame)' : ''}\n\n`;

      if (f.scene_description) {
        md += `**Scene:** ${f.scene_description}\n\n`;
      }

      if (f.on_screen_text) {
        md += `**On-screen text:**\n\n\`\`\`\n${f.on_screen_text}\n\`\`\`\n\n`;
      }

      if (f.visual_elements && Object.keys(f.visual_elements).length > 0) {
        md += `**Visual elements:** ${JSON.stringify(f.visual_elements)}\n\n`;
      }
    });
  }

  // Footer
  md += `---\n\n`;
  md += `*Exported from Vidlyx on ${new Date().toLocaleDateString()}*\n`;

  return md;
}

/**
 * Export save as plain text
 * @param {object} save - Save with all content
 * @returns {string} - Plain text export
 */
function exportAsText(save) {
  let text = '';

  // Header
  text += `${save.title}\n`;
  text += `${'='.repeat(save.title.length)}\n\n`;

  // Video info
  text += `VIDEO INFORMATION\n`;
  text += `-----------------\n`;
  text += `Title: ${save.video_title}\n`;
  if (save.channel_name) {
    text += `Channel: ${save.channel_name}\n`;
  }
  text += `URL: https://youtube.com/watch?v=${save.youtube_id}\n\n`;

  // Notes
  if (save.notes) {
    text += `NOTES\n`;
    text += `-----\n`;
    text += `${save.notes}\n\n`;
  }

  // Tags
  if (save.tags && save.tags.length > 0) {
    text += `TAGS\n`;
    text += `----\n`;
    text += save.tags.map(t => t.name).join(', ') + '\n\n';
  }

  // Folders
  if (save.folders && save.folders.length > 0) {
    text += `FOLDERS\n`;
    text += `-------\n`;
    save.folders.forEach(f => {
      text += `- ${f.name}\n`;
    });
    text += '\n';
  }

  // Transcript selections
  if (save.transcripts && save.transcripts.length > 0) {
    text += `TRANSCRIPT SELECTIONS\n`;
    text += `---------------------\n\n`;
    save.transcripts.forEach((t, index) => {
      const startTime = formatTimestamp(parseFloat(t.start_time));
      const endTime = formatTimestamp(parseFloat(t.end_time));
      text += `${index + 1}. ${startTime} - ${endTime}\n`;
      text += `${t.text}\n\n`;
    });
  }

  // Summary excerpts
  if (save.summaries && save.summaries.length > 0) {
    text += `SUMMARY EXCERPTS\n`;
    text += `----------------\n\n`;
    save.summaries.forEach((s, index) => {
      if (s.section_title) {
        text += `${index + 1}. ${s.section_title}\n`;
      } else {
        text += `${index + 1}. Summary Excerpt\n`;
      }
      text += `${s.excerpt}\n\n`;
    });
  }

  // Frames
  if (save.frames && save.frames.length > 0) {
    text += `FRAMES\n`;
    text += `------\n\n`;
    save.frames.forEach((f, index) => {
      const timestamp = formatTimestamp(parseFloat(f.timestamp_seconds));
      text += `${index + 1}. Frame at ${timestamp}${f.is_keyframe ? ' (Key Frame)' : ''}\n`;

      if (f.scene_description) {
        text += `   Scene: ${f.scene_description}\n`;
      }

      if (f.on_screen_text) {
        text += `   On-screen text:\n`;
        const lines = f.on_screen_text.split('\n');
        lines.forEach(line => {
          text += `      ${line}\n`;
        });
      }

      text += '\n';
    });
  }

  // Footer
  text += `${'='.repeat(60)}\n`;
  text += `Exported from Vidlyx on ${new Date().toLocaleDateString()}\n`;

  return text;
}

/**
 * Format timestamp in seconds to HH:MM:SS or MM:SS
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted timestamp
 */
function formatTimestamp(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

/**
 * Export save in specified format
 * @param {string} saveId - Save ID
 * @param {string} userId - User ID
 * @param {string} format - Export format (json, markdown, txt)
 * @returns {Promise<object>} - Export data with content and metadata
 */
async function exportSave(saveId, userId, format = 'json') {
  const save = await getSaveWithContent(saveId, userId);

  if (!save) {
    throw new Error('Save not found');
  }

  let content;
  let contentType;
  let fileExtension;

  switch (format.toLowerCase()) {
    case 'markdown':
    case 'md':
      content = exportAsMarkdown(save);
      contentType = 'text/markdown';
      fileExtension = 'md';
      break;

    case 'text':
    case 'txt':
      content = exportAsText(save);
      contentType = 'text/plain';
      fileExtension = 'txt';
      break;

    case 'json':
    default:
      content = exportAsJson(save);
      contentType = 'application/json';
      fileExtension = 'json';
      break;
  }

  const filename = sanitizeFilename(save.title || 'save') + '.' + fileExtension;

  return {
    content,
    contentType,
    filename
  };
}

/**
 * Get full transcript for a video
 * @param {string} videoId - Video ID
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Transcript data
 */
async function getTranscriptForVideo(videoId, userId) {
  const client = await pool.connect();

  try {
    // Verify video belongs to user
    const videoQuery = `
      SELECT
        v.id,
        v.youtube_id,
        v.title,
        v.channel_name
      FROM videos v
      WHERE v.id = $1 AND v.user_id = $2
    `;

    const videoResult = await client.query(videoQuery, [videoId, userId]);

    if (videoResult.rows.length === 0) {
      return null;
    }

    const video = videoResult.rows[0];

    // Get transcript with segments
    const transcriptQuery = `
      SELECT
        full_text,
        segments,
        transcript_type,
        language
      FROM transcriptions
      WHERE video_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const transcriptResult = await client.query(transcriptQuery, [videoId]);

    if (transcriptResult.rows.length === 0) {
      throw new Error('No transcript found for this video');
    }

    const transcript = transcriptResult.rows[0];

    return {
      ...video,
      full_text: transcript.full_text,
      segments: transcript.segments,
      transcript_type: transcript.transcript_type,
      language: transcript.language
    };
  } finally {
    client.release();
  }
}

/**
 * Export transcript as plain text
 * @param {object} transcript - Transcript data
 * @returns {string} - Plain text transcript
 */
function transcriptAsText(transcript) {
  let text = '';

  text += `${transcript.title}\n`;
  text += `${'='.repeat(transcript.title.length)}\n\n`;

  if (transcript.channel_name) {
    text += `Channel: ${transcript.channel_name}\n`;
  }
  text += `URL: https://youtube.com/watch?v=${transcript.youtube_id}\n\n`;

  text += `TRANSCRIPT\n`;
  text += `----------\n\n`;

  if (transcript.segments && Array.isArray(transcript.segments)) {
    transcript.segments.forEach(segment => {
      const timestamp = formatTimestamp(segment.start || 0);
      text += `[${timestamp}] ${segment.text}\n`;
    });
  } else {
    text += transcript.full_text;
  }

  text += `\n\n${'='.repeat(60)}\n`;
  text += `Exported from Vidlyx on ${new Date().toLocaleDateString()}\n`;

  return text;
}

/**
 * Export transcript as SRT
 * @param {object} transcript - Transcript data
 * @returns {string} - SRT format transcript
 */
function transcriptAsSrt(transcript) {
  let srt = '';

  if (!transcript.segments || !Array.isArray(transcript.segments)) {
    throw new Error('Transcript does not have timestamped segments');
  }

  transcript.segments.forEach((segment, index) => {
    const start = segment.start || 0;
    const duration = segment.duration || 3;
    const end = start + duration;

    srt += `${index + 1}\n`;
    srt += `${formatSrtTime(start)} --> ${formatSrtTime(end)}\n`;
    srt += `${segment.text}\n\n`;
  });

  return srt;
}

/**
 * Export transcript as VTT
 * @param {object} transcript - Transcript data
 * @returns {string} - VTT format transcript
 */
function transcriptAsVtt(transcript) {
  let vtt = 'WEBVTT\n\n';

  if (!transcript.segments || !Array.isArray(transcript.segments)) {
    throw new Error('Transcript does not have timestamped segments');
  }

  transcript.segments.forEach((segment, index) => {
    const start = segment.start || 0;
    const duration = segment.duration || 3;
    const end = start + duration;

    vtt += `${index + 1}\n`;
    vtt += `${formatVttTime(start)} --> ${formatVttTime(end)}\n`;
    vtt += `${segment.text}\n\n`;
  });

  return vtt;
}

/**
 * Export transcript in specified format
 * @param {string} videoId - Video ID
 * @param {string} userId - User ID
 * @param {string} format - Export format (txt, srt, vtt)
 * @returns {Promise<object>} - Export data with content and metadata
 */
async function exportTranscript(videoId, userId, format = 'txt') {
  const transcript = await getTranscriptForVideo(videoId, userId);

  if (!transcript) {
    throw new Error('Video not found');
  }

  let content;
  let contentType;
  let fileExtension;

  switch (format.toLowerCase()) {
    case 'srt':
      content = transcriptAsSrt(transcript);
      contentType = 'text/srt';
      fileExtension = 'srt';
      break;

    case 'vtt':
    case 'webvtt':
      content = transcriptAsVtt(transcript);
      contentType = 'text/vtt';
      fileExtension = 'vtt';
      break;

    case 'text':
    case 'txt':
    default:
      content = transcriptAsText(transcript);
      contentType = 'text/plain';
      fileExtension = 'txt';
      break;
  }

  const filename = sanitizeFilename(transcript.title || 'transcript') + '.' + fileExtension;

  return {
    content,
    contentType,
    filename
  };
}

module.exports = {
  exportSave,
  exportTranscript,
  getSaveWithContent,
  exportAsJson,
  exportAsMarkdown,
  exportAsText,
  transcriptAsText,
  transcriptAsSrt,
  transcriptAsVtt,
  formatSrtTime,
  formatVttTime,
  sanitizeFilename
};

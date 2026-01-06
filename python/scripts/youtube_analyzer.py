#!/usr/bin/env python3
"""
YouTube Video Analyzer
Fetches metadata and transcripts from YouTube videos
"""

import sys
import json
import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable
)


def get_video_metadata(video_id):
    """
    Fetch video metadata using yt-dlp

    Args:
        video_id (str): YouTube video ID

    Returns:
        dict: JSON response with metadata
    """
    try:
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            url = f'https://www.youtube.com/watch?v={video_id}'
            info = ydl.extract_info(url, download=False)

            metadata = {
                'title': info.get('title', ''),
                'channel': info.get('uploader', '') or info.get('channel', ''),
                'duration': info.get('duration', 0),
                'description': info.get('description', ''),
                'thumbnail': info.get('thumbnail', ''),
                'upload_date': info.get('upload_date', ''),
                'view_count': info.get('view_count', 0)
            }

            return {
                'success': True,
                'data': metadata
            }

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def get_transcript(video_id):
    """
    Fetch video transcript using youtube-transcript-api

    Args:
        video_id (str): YouTube video ID

    Returns:
        dict: JSON response with transcript data
    """
    try:
        # Create API instance
        ytt_api = YouTubeTranscriptApi()

        # Try to get transcript in English first, then any available language
        transcript_list = ytt_api.list(video_id)

        # Try to get manually created transcript first
        transcript = None
        language = None
        transcript_type = 'manual'

        try:
            # Try English manual transcript first
            transcript = transcript_list.find_manually_created_transcript(['en'])
            language = 'en'
        except:
            try:
                # Try any manual transcript
                transcript = transcript_list.find_manually_created_transcript(
                    transcript_list._manually_created_transcripts.keys()
                )
                language = transcript.language_code
            except:
                try:
                    # Fall back to generated transcript
                    transcript = transcript_list.find_generated_transcript(['en'])
                    language = 'en'
                    transcript_type = 'generated'
                except:
                    # Try any generated transcript
                    transcript = transcript_list.find_generated_transcript(
                        transcript_list._generated_transcripts.keys()
                    )
                    language = transcript.language_code
                    transcript_type = 'generated'

        # Fetch the transcript data
        transcript_data = transcript.fetch()

        # Build segments array
        segments = []
        full_text_parts = []

        for item in transcript_data:
            segment = {
                'start': float(item.start),
                'end': float(item.start) + float(item.duration),
                'duration': float(item.duration),
                'text': item.text
            }
            segments.append(segment)
            full_text_parts.append(item.text)

        full_text = ' '.join(full_text_parts)

        return {
            'success': True,
            'data': {
                'full_text': full_text,
                'segments': segments,
                'type': transcript_type,
                'language': language
            }
        }

    except TranscriptsDisabled:
        return {
            'success': False,
            'error': 'Transcripts are disabled for this video'
        }
    except NoTranscriptFound:
        return {
            'success': False,
            'error': 'No transcript found for this video'
        }
    except VideoUnavailable:
        return {
            'success': False,
            'error': 'Video is unavailable'
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def get_stream_url(video_id):
    """
    Get direct video stream URL for frame extraction using yt-dlp
    Returns the best quality video stream URL that can be used with ffmpeg

    Args:
        video_id (str): YouTube video ID

    Returns:
        dict: JSON response with stream URL and video info
    """
    try:
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'format': 'best[ext=mp4]/best',  # Prefer mp4, fallback to best
            'extract_flat': False,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            url = f'https://www.youtube.com/watch?v={video_id}'
            info = ydl.extract_info(url, download=False)

            # Get the direct stream URL
            stream_url = info.get('url', '')

            # If no direct URL, try to get from formats
            if not stream_url and 'formats' in info:
                # Get best video format with audio
                formats = info['formats']
                # Prefer format with both video and audio
                for fmt in reversed(formats):
                    if fmt.get('vcodec') != 'none' and fmt.get('acodec') != 'none':
                        stream_url = fmt.get('url', '')
                        break

                # If no combined format, get best video only
                if not stream_url:
                    for fmt in reversed(formats):
                        if fmt.get('vcodec') != 'none':
                            stream_url = fmt.get('url', '')
                            break

            if not stream_url:
                return {
                    'success': False,
                    'error': 'Could not extract stream URL from video'
                }

            return {
                'success': True,
                'data': {
                    'stream_url': stream_url,
                    'duration': info.get('duration', 0),
                    'width': info.get('width', 0),
                    'height': info.get('height', 0),
                    'format': info.get('format', ''),
                    'ext': info.get('ext', 'mp4')
                }
            }

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def main():
    """Main CLI entry point"""
    if len(sys.argv) < 3:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python youtube_analyzer.py <metadata|transcript|stream> <video_id>'
        }))
        sys.exit(1)

    command = sys.argv[1]
    video_id = sys.argv[2]

    if command == 'metadata':
        result = get_video_metadata(video_id)
    elif command == 'transcript':
        result = get_transcript(video_id)
    elif command == 'stream':
        result = get_stream_url(video_id)
    else:
        result = {
            'success': False,
            'error': f'Unknown command: {command}. Use "metadata", "transcript", or "stream"'
        }

    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()

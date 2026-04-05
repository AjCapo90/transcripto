"""Vercel Python serverless function for YouTube transcript extraction."""

import json
import re
from http.server import BaseHTTPRequestHandler

import httpx
from youtube_transcript_api import YouTubeTranscriptApi, IpBlocked, RequestBlocked


def _extract_video_id(url: str) -> str | None:
    match = re.search(
        r"(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/|youtube\.com/shorts/)"
        r"([a-zA-Z0-9_-]{11})",
        url,
    )
    return match.group(1) if match else None


def _format_time(seconds: float) -> str:
    mins, secs = divmod(int(seconds), 60)
    hours, mins = divmod(mins, 60)
    if hours:
        return f"{hours}:{mins:02d}:{secs:02d}"
    return f"{mins}:{secs:02d}"


def _fetch_metadata(video_id: str) -> dict:
    url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
    try:
        with httpx.Client(timeout=10) as client:
            resp = client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "title": data.get("title", ""),
                    "channel": data.get("author_name", ""),
                }
    except Exception:
        pass
    return {"title": "", "channel": ""}


def _fetch_transcript(video_id: str) -> dict:
    api = YouTubeTranscriptApi()
    languages = ["en", "it"]

    # Attempt 1: preferred languages
    try:
        result = api.fetch(video_id, languages=languages)
    except (IpBlocked, RequestBlocked):
        raise
    except Exception:
        # Attempt 2: list available and pick best match
        transcript_list = api.list(video_id)
        best = None
        for lc in languages:
            for t in transcript_list:
                if t.language_code == lc:
                    best = t
                    break
            if best:
                break
        if not best and transcript_list:
            best = transcript_list[0]
        if not best:
            return None

        result = api.fetch(video_id, languages=[best.language_code])

    lines = []
    total_seconds = 0.0
    for snippet in result.snippets:
        lines.append({
            "time": _format_time(snippet.start),
            "text": snippet.text.replace("\n", " "),
        })
        total_seconds = max(total_seconds, snippet.start + snippet.duration)

    # Detect language info
    language = "unknown"
    is_generated = False
    try:
        tl = api.list(video_id)
        for t in tl:
            language = t.language_code
            is_generated = t.is_generated
            break
    except Exception:
        pass

    return {
        "language": language,
        "is_generated": is_generated,
        "duration": _format_time(total_seconds),
        "lines": lines,
    }


def _json_response(handler, status: int, body: dict):
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.end_headers()
    handler.wfile.write(json.dumps(body).encode())


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        _json_response(self, 200, {})

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length)) if length else {}
        except Exception:
            return _json_response(self, 400, {"detail": "Invalid JSON body"})

        url = body.get("url", "")
        if not url or not isinstance(url, str):
            return _json_response(self, 400, {"detail": 'Missing or invalid "url" field'})

        video_id = _extract_video_id(url)
        if not video_id:
            return _json_response(self, 400, {"detail": "Could not extract video ID from URL"})

        # Fetch metadata via oEmbed (never fails, returns defaults)
        meta = _fetch_metadata(video_id)

        # Fetch transcript
        try:
            transcript = _fetch_transcript(video_id)
        except (IpBlocked, RequestBlocked):
            return _json_response(self, 429, {
                "detail": "YouTube has rate-limited this server. Try again in a few minutes.",
            })
        except Exception as e:
            return _json_response(self, 404, {"detail": f"No transcript available: {e}"})

        if not transcript:
            return _json_response(self, 404, {"detail": "No captions available for this video"})

        return _json_response(self, 200, {
            "video_id": video_id,
            "title": meta["title"],
            "channel": meta["channel"],
            "thumbnail": f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
            "channel_thumbnail": "",
            "language": transcript["language"],
            "is_generated": transcript["is_generated"],
            "duration": transcript["duration"],
            "lines": transcript["lines"],
        })

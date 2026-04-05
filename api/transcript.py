"""Vercel Python serverless function for YouTube transcript extraction.

Uses ScraperAPI to fetch the YouTube watch page (bypasses cloud IP blocking).
Caption XML is fetched directly (signed URLs are IP-independent).
"""

import json
import os
import re
import xml.etree.ElementTree as ET
from html import unescape
from http.server import BaseHTTPRequestHandler
from urllib.parse import quote

import httpx

SCRAPER_API_KEY = os.environ.get("SCRAPER_API_KEY", "")


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


def _extract_player_response(html: str) -> dict | None:
    marker = "var ytInitialPlayerResponse = "
    start = html.find(marker)
    if start == -1:
        return None

    json_start = start + len(marker)
    depth = 0
    end = json_start

    for i in range(json_start, len(html)):
        if html[i] == "{":
            depth += 1
        elif html[i] == "}":
            depth -= 1
        if depth == 0:
            end = i + 1
            break

    try:
        return json.loads(html[json_start:end])
    except Exception:
        return None


def _parse_caption_xml(xml_text: str) -> list[dict]:
    lines = []
    root = ET.fromstring(xml_text)

    for text_el in root.findall("text"):
        start = float(text_el.get("start", "0"))
        raw = text_el.text or ""
        raw = raw.strip()
        if not raw:
            continue
        lines.append({
            "time": _format_time(start),
            "text": unescape(raw).replace("\n", " "),
        })

    return lines


def _fetch_watch_page(video_id: str) -> str:
    """Fetch YouTube watch page via ScraperAPI."""
    target = quote(f"https://www.youtube.com/watch?v={video_id}&hl=en", safe="")
    url = f"https://api.scraperapi.com?api_key={SCRAPER_API_KEY}&url={target}"

    with httpx.Client(timeout=30) as http:
        resp = http.get(url)
        if resp.status_code != 200:
            raise Exception(f"ScraperAPI returned {resp.status_code}")
        return resp.text


def _fetch_caption_xml(caption_url: str) -> str:
    """Fetch caption XML directly (signed URLs should work from any IP)."""
    with httpx.Client(timeout=15) as http:
        resp = http.get(caption_url)
        if resp.status_code != 200:
            raise Exception(f"Caption fetch returned {resp.status_code}")
        if not resp.text:
            raise Exception("Caption response is empty")
        return resp.text


def _get_transcript(video_id: str) -> dict:
    html = _fetch_watch_page(video_id)
    player = _extract_player_response(html)

    if not player:
        raise Exception("Could not extract player data")

    video_details = player.get("videoDetails", {})
    if not video_details:
        raise Exception("Video not found or unavailable")

    caption_tracks = (
        player.get("captions", {})
        .get("playerCaptionsTracklistRenderer", {})
        .get("captionTracks", [])
    )
    if not caption_tracks:
        raise Exception("No captions available for this video")

    manual = next((t for t in caption_tracks if t.get("kind") != "asr"), None)
    track = manual or caption_tracks[0]
    is_generated = track.get("kind") == "asr"

    caption_xml = _fetch_caption_xml(track["baseUrl"])
    lines = _parse_caption_xml(caption_xml)

    if not lines:
        raise Exception("Captions are empty")

    duration_seconds = int(video_details.get("lengthSeconds", "0"))

    return {
        "video_id": video_id,
        "title": video_details.get("title", ""),
        "channel": video_details.get("author", ""),
        "thumbnail": f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
        "channel_thumbnail": "",
        "language": track.get("languageCode", "unknown"),
        "is_generated": is_generated,
        "duration": _format_time(duration_seconds),
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

        try:
            result = _get_transcript(video_id)
            return _json_response(self, 200, result)
        except Exception as e:
            msg = str(e)
            if "429" in msg:
                status = 429
            elif "not found" in msg or "unavailable" in msg or "No captions" in msg:
                status = 404
            else:
                status = 500
            return _json_response(self, status, {"detail": msg})

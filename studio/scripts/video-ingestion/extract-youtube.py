#!/usr/bin/env python3
"""Extract YouTube metadata and English captions without downloading video media."""

from __future__ import annotations

import argparse
import html
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=Path, default=Path("scripts/seed/seed.ndjson"))
    parser.add_argument("--raw-dir", type=Path, default=Path("scripts/video-ingestion/raw"))
    parser.add_argument("--output", type=Path, default=Path("scripts/video-ingestion/generated/manifest.json"))
    parser.add_argument("--report", type=Path, default=Path("scripts/video-ingestion/reports/youtube-extraction.json"))
    parser.add_argument("--limit", type=int)
    return parser.parse_args()


def clean_text(value: str) -> str:
    value = html.unescape(re.sub(r"<[^>]+>", "", value))
    return re.sub(r"\s+", " ", value).strip()


def read_lessons(seed_path: Path) -> list[dict[str, Any]]:
    lessons: list[dict[str, Any]] = []
    for line_number, line in enumerate(seed_path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        document = json.loads(line)
        if document.get("_type") != "lesson":
            continue
        url = document.get("videoUrl")
        if not isinstance(url, str) or "youtube.com" not in url and "youtu.be" not in url:
            raise ValueError(f"Seed line {line_number}: lesson has no supported YouTube videoUrl")
        lessons.append({"lessonId": document.get("_id"), "url": url, "durationSeconds": document.get("duration")})
    return lessons


def run_ytdlp(python_bin: str, args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run([python_bin, "-m", "yt_dlp", *args], capture_output=True, text=True, timeout=120)


def json3_to_transcript(path: Path) -> list[dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    entries: list[dict[str, Any]] = []
    for event in payload.get("events", []):
        parts = [clean_text(segment.get("utf8", "")) for segment in event.get("segs", [])]
        text = clean_text(" ".join(part for part in parts if part))
        if text:
            entries.append({"startSeconds": max(0, round(event.get("tStartMs", 0) / 1000)), "text": text})
    return entries


def find_caption(raw_dir: Path, video_id: str) -> Path | None:
    candidates = sorted(raw_dir.glob(f"{video_id}.*.json3"))
    return candidates[0] if candidates else None


def fallback_transcript(video_id: str) -> list[dict[str, Any]]:
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        fetched = YouTubeTranscriptApi().fetch(video_id, languages=["en", "en-US", "en-GB"])
        return [
            {"startSeconds": max(0, round(float(snippet.start))), "text": clean_text(snippet.text)}
            for snippet in fetched.snippets
            if clean_text(snippet.text)
        ]
    except Exception:
        return []


def main() -> int:
    args = parse_args()
    python_bin = sys.executable
    lessons = read_lessons(args.seed)
    if args.limit is not None:
        lessons = lessons[: args.limit]
    args.raw_dir.mkdir(parents=True, exist_ok=True)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.report.parent.mkdir(parents=True, exist_ok=True)

    videos: list[dict[str, Any]] = []
    statuses: list[dict[str, Any]] = []
    seen: set[str] = set()
    for index, lesson in enumerate(lessons, 1):
        lesson_id = lesson["lessonId"] or f"line-{index}"
        url = lesson["url"]
        print(f"[{index}/{len(lessons)}] {lesson_id}", flush=True)
        metadata = run_ytdlp(python_bin, ["--skip-download", "--no-playlist", "--no-warnings", "--dump-single-json", url])
        if metadata.returncode != 0:
            statuses.append({"lessonId": lesson_id, "url": url, "status": "metadata-error", "error": metadata.stderr.strip()[-500:]})
            continue
        try:
            info = json.loads(metadata.stdout)
        except json.JSONDecodeError as error:
            statuses.append({"lessonId": lesson_id, "url": url, "status": "metadata-error", "error": str(error)})
            continue
        video_id = info.get("id")
        if not isinstance(video_id, str) or not video_id:
            statuses.append({"lessonId": lesson_id, "url": url, "status": "metadata-error", "error": "missing YouTube video ID"})
            continue
        if video_id in seen:
            statuses.append({"lessonId": lesson_id, "url": url, "status": "duplicate-video-id", "videoId": video_id})
            continue
        seen.add(video_id)
        (args.raw_dir / f"{video_id}.info.json").write_text(json.dumps(info, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

        subtitles = run_ytdlp(python_bin, ["--skip-download", "--no-playlist", "--no-warnings", "--write-auto-subs", "--sub-langs", "en.*,en", "--sub-format", "json3", "--output", str(args.raw_dir / "%(id)s.%(ext)s"), url])
        caption_path = find_caption(args.raw_dir, video_id)
        transcript = json3_to_transcript(caption_path) if caption_path else []
        if not transcript:
            transcript = fallback_transcript(video_id)
            if transcript:
                (args.raw_dir / f"{video_id}.transcript-api.json").write_text(json.dumps(transcript, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        chapters = [
            {"startSeconds": max(0, round(float(chapter.get("start_time", 0)))), "label": clean_text(str(chapter.get("title", "")))}
            for chapter in (info.get("chapters") or [])
            if clean_text(str(chapter.get("title", "")))
        ]
        record = {"url": url, "durationSeconds": lesson.get("durationSeconds"), "chapters": chapters, "transcript": transcript}
        if transcript:
            videos.append(record)
            status = "usable" if chapters else "usable-no-chapters"
        else:
            status = "no-english-captions" if subtitles.returncode == 0 else "caption-error"
        statuses.append({"lessonId": lesson_id, "url": url, "videoId": video_id, "status": status, "chapterCount": len(chapters), "transcriptEntryCount": len(transcript)})

    args.output.write_text(json.dumps({"videos": videos}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    report = {"lessonCountRequested": len(lessons), "videoCountWithCaptions": len(videos), "statuses": statuses}
    args.report.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Extracted captions for {len(videos)}/{len(lessons)} lessons.")
    print(f"Manifest: {args.output}")
    print(f"Report: {args.report}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

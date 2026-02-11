from __future__ import annotations

import re
import unicodedata
from typing import Optional

_KANJI_DIGITS = {
    "〇": 0,
    "零": 0,
    "一": 1,
    "二": 2,
    "三": 3,
    "四": 4,
    "五": 5,
    "六": 6,
    "七": 7,
    "八": 8,
    "九": 9,
}

_KANJI_UNITS = {
    "十": 10,
    "百": 100,
    "千": 1000,
}

_UPPER_LOWER_MAP = {
    "上": 1,
    "中": 2,
    "下": 3,
}

_ARABIC_VOLUME_RE = re.compile(
    r"(?:第\s*(?P<dai_arabic>\d+)\s*巻|(?P<arabic>\d+)\s*巻|vol\.?\s*(?P<vol_arabic>\d+))",
    re.IGNORECASE,
)

_PAREN_ARABIC_RE = re.compile(
    r"[（(「『【\[]\s*(?P<paren_arabic>\d{1,4})\s*[）)」』】\]]"
)

_KANJI_VOLUME_RE = re.compile(
    r"(?:第\s*(?P<dai_kanji>[〇零一二三四五六七八九十百千]+)\s*巻|(?P<kanji>[〇零一二三四五六七八九十百千]+)\s*巻)"
)

_PAREN_UPPER_LOWER_RE = re.compile(r"[（(「『【\[]\s*([上中下])(?:巻)?\s*[）)」』】\]]")

_STANDALONE_UPPER_LOWER_RE = re.compile(
    r"(?:(?<=^)|(?<=[\s\-_/]))([上中下])(?:巻)?(?=$|[\s\-_/])"
)

_TRAILING_ARABIC_RE = re.compile(
    r"(?:(?<=\s)|(?<=^)|(?<=[\-_/#]))(?P<trailing_arabic>\d{1,4})(?=$)"
)

_REMOVE_ARABIC_VOLUME_RE = re.compile(
    r"(?:第\s*\d+\s*巻|\d+\s*巻|vol\.?\s*\d+)", re.IGNORECASE
)
_REMOVE_PAREN_ARABIC_RE = re.compile(r"[（(「『【\[]\s*\d{1,4}\s*[）)」』】\]]")
_REMOVE_KANJI_VOLUME_RE = re.compile(
    r"(?:第\s*[〇零一二三四五六七八九十百千]+\s*巻|[〇零一二三四五六七八九十百千]+\s*巻)"
)
_REMOVE_PAREN_UPPER_LOWER_RE = re.compile(
    r"[（(「『【\[]\s*[上中下](?:巻)?\s*[）)」』】\]]"
)
_REMOVE_STANDALONE_UPPER_LOWER_RE = re.compile(
    r"(?:(?<=^)|(?<=[\s\-_/]))[上中下](?:巻)?(?=$|[\s\-_/])"
)
_REMOVE_TRAILING_ARABIC_RE = re.compile(r"(?:(?:\s+)|(?:[-_/#]))\d{1,4}$")


def normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", value or "")
    normalized = re.sub(r"\s+", " ", normalized).strip().lower()
    return normalized


def extract_volume_number(title: str) -> Optional[int]:
    if not title:
        return None

    normalized_title = unicodedata.normalize("NFKC", title)
    candidates: list[int] = []

    for match in _ARABIC_VOLUME_RE.finditer(normalized_title):
        for key in ("dai_arabic", "arabic", "vol_arabic"):
            raw = match.group(key)
            if not raw:
                continue
            try:
                value = int(raw)
            except ValueError:
                continue
            if _is_plausible_volume(value):
                candidates.append(value)

    for match in _PAREN_ARABIC_RE.finditer(normalized_title):
        raw = match.group("paren_arabic")
        if not raw:
            continue
        try:
            value = int(raw)
        except ValueError:
            continue
        if _is_plausible_volume(value):
            candidates.append(value)

    for match in _TRAILING_ARABIC_RE.finditer(normalized_title):
        raw = match.group("trailing_arabic")
        if not raw:
            continue
        try:
            value = int(raw)
        except ValueError:
            continue
        if _is_plausible_volume(value):
            candidates.append(value)

    for match in _KANJI_VOLUME_RE.finditer(normalized_title):
        raw = match.group("dai_kanji") or match.group("kanji")
        if not raw:
            continue
        value = _parse_kanji_number(raw)
        if value and value > 0:
            candidates.append(value)

    for match in _PAREN_UPPER_LOWER_RE.finditer(normalized_title):
        mapped = _UPPER_LOWER_MAP.get(match.group(1))
        if mapped:
            candidates.append(mapped)

    for match in _STANDALONE_UPPER_LOWER_RE.finditer(normalized_title):
        mapped = _UPPER_LOWER_MAP.get(match.group(1))
        if mapped:
            candidates.append(mapped)

    if not candidates:
        return None
    return max(candidates)


def build_series_key(title: str, author: str) -> str:
    base_title = normalize_text(_strip_volume_expression(title))
    if not base_title:
        base_title = normalize_text(title)
    normalized_author = normalize_author_key(author)
    return f"title:{base_title}|author:{normalized_author}"


def normalize_author_key(author: str) -> str:
    normalized = normalize_text(author)
    normalized = re.sub(r"\s+", "", normalized)
    return normalized


def _strip_volume_expression(title: str) -> str:
    normalized = unicodedata.normalize("NFKC", title or "")
    stripped = _REMOVE_ARABIC_VOLUME_RE.sub(" ", normalized)
    stripped = _REMOVE_PAREN_ARABIC_RE.sub(" ", stripped)
    stripped = _REMOVE_KANJI_VOLUME_RE.sub(" ", stripped)
    stripped = _REMOVE_PAREN_UPPER_LOWER_RE.sub(" ", stripped)
    stripped = _REMOVE_STANDALONE_UPPER_LOWER_RE.sub(" ", stripped)
    stripped = _REMOVE_TRAILING_ARABIC_RE.sub("", stripped)
    stripped = re.sub(r"\s+", " ", stripped).strip()
    return stripped


def _parse_kanji_number(raw: str) -> Optional[int]:
    if not raw:
        return None

    value = unicodedata.normalize("NFKC", raw)
    total = 0
    current = 0

    for char in value:
        if char in _KANJI_DIGITS:
            current = _KANJI_DIGITS[char]
            continue

        unit = _KANJI_UNITS.get(char)
        if unit is None:
            return None

        if current == 0:
            current = 1

        total += current * unit
        current = 0

    total += current
    if not _is_plausible_volume(total):
        return None
    return total


def _is_plausible_volume(value: int) -> bool:
    return 0 < value <= 500

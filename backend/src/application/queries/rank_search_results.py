from __future__ import annotations

import re
import unicodedata
from typing import List

from domain.models import LibraryItem
from domain.search import SearchQuery, SearchResult

SERIES_HINT_WORDS = [
    "外伝",
    "スピンオフ",
    "番外編",
    "公式ガイド",
    "公式ファンブック",
    "キャラクターズ",
    "キャラクターズブック",
    "小説",
    "ノベライズ",
    "アンソロジー",
    "ムック",
    "パーティー",
    "学園",
]

SOURCE_WEIGHTS = {
    "rakuten": 1.0,
    "google": 0.85,
    "ndl": 0.7,
}


def rank_search_result(result: SearchResult, query: SearchQuery) -> SearchResult:
    ranked = rank_results(result.items, query)
    return SearchResult(
        items=ranked,
        total=result.total,
        page=result.page,
        limit=result.limit,
    )


def rank_results(items: List[LibraryItem], query: SearchQuery) -> List[LibraryItem]:
    query_title = normalize_text(query.title or query.q or "")
    query_author = normalize_text(query.author or "")

    def score(item: LibraryItem) -> float:
        title = normalize_text(item.title)
        author = normalize_text(item.author)
        score_value = 0.0

        if query_title:
            if title == query_title:
                score_value += 100
            elif title.startswith(query_title):
                score_value += 80
            elif query_title in title:
                score_value += 60

        if query_author:
            if author == query_author:
                score_value += 25
            elif query_author and query_author in author:
                score_value += 15

        if title:
            for word in SERIES_HINT_WORDS:
                if word in item.title:
                    score_value -= 5

        score_value += SOURCE_WEIGHTS.get((item.source or "").lower(), 0.0)
        score_value += published_date_bonus(item.published_date)
        return score_value

    return sorted(items, key=lambda item: (score(item), item.title), reverse=True)


def normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", value or "")
    normalized = re.sub(r"\s+", " ", normalized).strip().lower()
    return normalized


def published_date_bonus(value: str | None) -> float:
    if not value:
        return 0.0
    match = re.search(r"\d{4}", value)
    if not match:
        return 0.0
    year = int(match.group())
    if year < 1950:
        return 0.0
    return min((year - 1950) / 200.0, 1.0)

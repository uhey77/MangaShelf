from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query

from application.queries.search_books import SearchBooksHandler
from domain.errors import SearchServiceError
from domain.search import SearchQuery
from presentation.dependencies import get_search_books_handler
from presentation.schemas import SearchResponseSchema

router = APIRouter(prefix="/api", tags=["search"])


def _normalize(value: str | None) -> str | None:
    if value is None:
        return None
    trimmed = value.strip()
    return trimmed or None


@router.get("/search", response_model=SearchResponseSchema)
def search(
    q: str | None = None,
    title: str | None = None,
    author: str | None = None,
    publisher: str | None = None,
    from_: date | None = Query(None, alias="from"),
    until: date | None = None,
    page: int = 1,
    limit: int = 20,
    handler: SearchBooksHandler = Depends(get_search_books_handler),
) -> SearchResponseSchema:
    query = SearchQuery(
        q=_normalize(q),
        title=_normalize(title),
        author=_normalize(author),
        publisher=_normalize(publisher),
        from_date=from_,
        until=until,
        page=page,
        limit=limit,
    )

    try:
        result = handler.handle(query)
    except SearchServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return SearchResponseSchema.from_domain(result)

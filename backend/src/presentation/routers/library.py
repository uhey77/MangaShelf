from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends

from application.commands.delete_library_item import (
    DeleteLibraryItemCommand,
    DeleteLibraryItemHandler,
)
from application.commands.upsert_library_item import (
    UpsertLibraryItemCommand,
    UpsertLibraryItemHandler,
)
from application.queries.get_library import GetLibraryHandler, GetLibraryQuery
from presentation.dependencies import (
    get_delete_library_handler,
    get_get_library_handler,
    get_upsert_library_handler,
)
from presentation.schemas import LibraryItemSchema

router = APIRouter(prefix="/api", tags=["library"])


@router.get("/library", response_model=List[LibraryItemSchema])
def get_library(
    handler: GetLibraryHandler = Depends(get_get_library_handler),
) -> List[LibraryItemSchema]:
    items = handler.handle(GetLibraryQuery())
    return [LibraryItemSchema.from_domain(item) for item in items]


@router.post("/library", response_model=LibraryItemSchema)
def upsert_library(
    payload: LibraryItemSchema,
    handler: UpsertLibraryItemHandler = Depends(get_upsert_library_handler),
) -> LibraryItemSchema:
    saved = handler.handle(UpsertLibraryItemCommand(payload.to_domain()))
    return LibraryItemSchema.from_domain(saved)


@router.delete("/library/{item_id}", status_code=204)
def delete_library(
    item_id: str,
    handler: DeleteLibraryItemHandler = Depends(get_delete_library_handler),
) -> None:
    handler.handle(DeleteLibraryItemCommand(item_id=item_id))

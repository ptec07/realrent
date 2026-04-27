from sqlalchemy import distinct, or_, select
from sqlalchemy.orm import Session

from app.models.region import Region


def search_regions(db: Session, query: str, *, limit: int = 20) -> list[Region]:
    normalized_query = query.strip()
    if not normalized_query:
        return []

    like_query = f"%{normalized_query}%"
    statement = (
        select(Region)
        .where(Region.is_target_region.is_(True))
        .where(
            or_(
                Region.full_name.ilike(like_query),
                Region.sido_name.ilike(like_query),
                Region.sigungu_name.ilike(like_query),
                Region.dong_name.ilike(like_query),
            )
        )
        .order_by(Region.sido_name, Region.sigungu_name, Region.dong_name)
        .limit(limit)
    )

    return list(db.scalars(statement).all())


def list_region_hierarchy(
    db: Session,
    *,
    sido: str | None = None,
    sigungu: str | None = None,
) -> tuple[list[str], list[str], list[Region]]:
    normalized_sido = sido.strip() if sido else None
    normalized_sigungu = sigungu.strip() if sigungu else None

    sidos_statement = (
        select(distinct(Region.sido_name))
        .where(Region.is_target_region.is_(True))
        .order_by(Region.sido_name)
    )
    sidos = [value for value in db.scalars(sidos_statement).all() if value]

    sigungus: list[str] = []
    if normalized_sido:
        sigungus_statement = (
            select(distinct(Region.sigungu_name))
            .where(Region.is_target_region.is_(True))
            .where(Region.sido_name == normalized_sido)
            .order_by(Region.sigungu_name)
        )
        sigungus = [value for value in db.scalars(sigungus_statement).all() if value]

    dongs: list[Region] = []
    if normalized_sido and normalized_sigungu:
        dongs_statement = (
            select(Region)
            .where(Region.is_target_region.is_(True))
            .where(Region.sido_name == normalized_sido)
            .where(Region.sigungu_name == normalized_sigungu)
            .where(Region.dong_name.is_not(None))
            .order_by(Region.dong_name)
        )
        dongs = list(db.scalars(dongs_statement).all())

    return sidos, sigungus, dongs

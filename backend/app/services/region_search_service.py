from sqlalchemy import or_, select
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

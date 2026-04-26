from app.models.region import Region
from app.services.region_search_service import search_regions


def add_region(
    db_session,
    *,
    sido_name="서울특별시",
    sigungu_name="성동구",
    dong_name="성수동",
    region_code_5="11200",
    region_code_full="1120010100",
    full_name="서울특별시 성동구 성수동",
    is_target_region=True,
):
    region = Region(
        sido_name=sido_name,
        sigungu_name=sigungu_name,
        dong_name=dong_name,
        region_code_5=region_code_5,
        region_code_full=region_code_full,
        full_name=full_name,
        is_target_region=is_target_region,
    )
    db_session.add(region)
    db_session.commit()
    return region


def test_search_regions_matches_full_name(db_session):
    add_region(db_session)

    results = search_regions(db_session, "성수")

    assert [region.full_name for region in results] == ["서울특별시 성동구 성수동"]


def test_search_regions_returns_only_target_regions(db_session):
    add_region(db_session)
    add_region(
        db_session,
        sido_name="부산광역시",
        sigungu_name="해운대구",
        dong_name="우동",
        region_code_5="26350",
        region_code_full="2635010500",
        full_name="부산광역시 해운대구 우동",
        is_target_region=False,
    )

    results = search_regions(db_session, "구")

    assert [region.full_name for region in results] == ["서울특별시 성동구 성수동"]


def test_search_regions_blank_query_returns_empty_list(db_session):
    add_region(db_session)

    assert search_regions(db_session, "   ") == []

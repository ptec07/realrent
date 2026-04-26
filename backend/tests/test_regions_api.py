from app.models.region import Region


def test_regions_api_returns_matching_regions(client, db_session):
    db_session.add(
        Region(
            sido_name="서울특별시",
            sigungu_name="성동구",
            dong_name="성수동",
            region_code_5="11200",
            region_code_full="1120010100",
            full_name="서울특별시 성동구 성수동",
            is_target_region=True,
        )
    )
    db_session.commit()

    response = client.get("/api/regions", params={"q": "성수"})

    assert response.status_code == 200
    assert response.json() == {
        "items": [
            {
                "fullName": "서울특별시 성동구 성수동",
                "sido": "서울특별시",
                "sigungu": "성동구",
                "dong": "성수동",
                "regionCode5": "11200",
            }
        ]
    }


def test_regions_api_blank_query_returns_empty_items(client):
    response = client.get("/api/regions", params={"q": "   "})

    assert response.status_code == 200
    assert response.json() == {"items": []}

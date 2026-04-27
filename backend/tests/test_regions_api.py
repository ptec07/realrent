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


def test_region_hierarchy_api_returns_child_options(client, db_session):
    db_session.add_all(
        [
            Region(
                sido_name="경기도",
                sigungu_name="남양주시",
                dong_name="별내면 청학리",
                region_code_5="41360",
                region_code_full="4136031000",
                full_name="경기도 남양주시 별내면 청학리",
                is_target_region=True,
            ),
            Region(
                sido_name="경기도",
                sigungu_name="의정부시",
                dong_name="가능동",
                region_code_5="41150",
                region_code_full="4115010900",
                full_name="경기도 의정부시 가능동",
                is_target_region=True,
            ),
            Region(
                sido_name="경기도",
                sigungu_name="의정부시",
                dong_name="의정부동",
                region_code_5="41150",
                region_code_full="4115010100",
                full_name="경기도 의정부시 의정부동",
                is_target_region=True,
            ),
            Region(
                sido_name="인천광역시",
                sigungu_name="연수구",
                dong_name="송도동",
                region_code_5="28185",
                region_code_full="2818510600",
                full_name="인천광역시 연수구 송도동",
                is_target_region=True,
            ),
            Region(
                sido_name="경기도",
                sigungu_name="의정부시",
                dong_name="숨은동",
                region_code_5="41150",
                region_code_full="4115019999",
                full_name="경기도 의정부시 숨은동",
                is_target_region=False,
            ),
        ]
    )
    db_session.commit()

    top_response = client.get("/api/regions/hierarchy")
    sigungu_response = client.get("/api/regions/hierarchy", params={"sido": "경기도"})
    dong_response = client.get("/api/regions/hierarchy", params={"sido": "경기도", "sigungu": "의정부시"})

    assert top_response.status_code == 200
    assert top_response.json()["sidos"] == ["경기도", "인천광역시"]
    assert sigungu_response.status_code == 200
    assert sigungu_response.json()["sigungus"] == ["남양주시", "의정부시"]
    assert sigungu_response.json()["dongs"] == []
    assert dong_response.status_code == 200
    assert dong_response.json()["dongs"] == [
        {
            "fullName": "경기도 의정부시 가능동",
            "sido": "경기도",
            "sigungu": "의정부시",
            "dong": "가능동",
            "regionCode5": "41150",
        },
        {
            "fullName": "경기도 의정부시 의정부동",
            "sido": "경기도",
            "sigungu": "의정부시",
            "dong": "의정부동",
            "regionCode5": "41150",
        },
    ]

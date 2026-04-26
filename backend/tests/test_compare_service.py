from app.services.compare_service import build_compare_insight


def test_compare_insight_when_region_b_deposit_and_rent_are_lower():
    assert build_compare_insight(
        region_a_label="A",
        region_b_label="B",
        deposit_diff_manwon=-3000,
        monthly_rent_diff_manwon=-20,
    ) == "B가 A보다 평균 보증금과 월세가 낮습니다."


def test_compare_insight_when_only_deposit_is_lower():
    assert build_compare_insight(
        region_a_label="A",
        region_b_label="B",
        deposit_diff_manwon=-3000,
        monthly_rent_diff_manwon=5,
    ) == "B가 A보다 평균 보증금이 낮습니다."


def test_compare_insight_when_only_rent_is_lower():
    assert build_compare_insight(
        region_a_label="A",
        region_b_label="B",
        deposit_diff_manwon=1000,
        monthly_rent_diff_manwon=-10,
    ) == "B가 A보다 평균 월세가 낮습니다."


def test_compare_insight_when_price_level_is_close():
    assert build_compare_insight(
        region_a_label="A",
        region_b_label="B",
        deposit_diff_manwon=0,
        monthly_rent_diff_manwon=0,
    ) == "두 지역의 평균 가격 수준이 비슷합니다."

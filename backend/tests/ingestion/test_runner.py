from app.ingestion.runner import ingest_rent_transactions
from app.models.monthly_region_summary import MonthlyRegionSummary
from app.models.region import Region
from app.models.rental_transaction import RentalTransaction


class FakeMolitClient:
    def __init__(self, xml_text: str):
        self.xml_text = xml_text
        self.calls = []

    def fetch_rent_transactions(self, **kwargs):
        self.calls.append(kwargs)
        return self.xml_text


def test_ingest_rent_transactions_fetches_normalizes_and_aggregates(db_session):
    xml = """
    <response><body><items>
      <item>
        <법정동> 역삼동 </법정동>
        <아파트>테스트아파트</아파트>
        <지번>1-1</지번>
        <전용면적>84.91</전용면적>
        <층>7</층>
        <건축년도>2005</건축년도>
        <계약년월>202501</계약년월>
        <계약일>15</계약일>
        <보증금액>10,000</보증금액>
        <월세금액>80</월세금액>
      </item>
      <item>
        <법정동> 역삼동 </법정동>
        <아파트>테스트아파트2</아파트>
        <전용면적>59.50</전용면적>
        <계약년월>202501</계약년월>
        <계약일>20</계약일>
        <보증금액>20,000</보증금액>
        <월세금액>0</월세금액>
      </item>
    </items></body></response>
    """
    client = FakeMolitClient(xml)

    result = ingest_rent_transactions(
        db_session,
        client=client,
        source_type="apartment",
        region_code_5="11680",
        contract_year_month="2025-01",
        region_sido="서울특별시",
        region_sigungu="강남구",
    )

    assert client.calls == [
        {
            "source_type": "apartment",
            "region_code_5": "11680",
            "contract_year_month": "2025-01",
        }
    ]
    assert result.fetched_count == 2
    assert result.inserted_count == 2
    assert result.skipped_duplicate_count == 0
    assert result.summary_count == 2

    transactions = db_session.query(RentalTransaction).order_by(RentalTransaction.building_name).all()
    assert [tx.region_sido for tx in transactions] == ["서울특별시", "서울특별시"]
    assert [tx.region_sigungu for tx in transactions] == ["강남구", "강남구"]
    assert [tx.region_code_5 for tx in transactions] == ["11680", "11680"]

    region = db_session.query(Region).one()
    assert region.full_name == "서울특별시 강남구 역삼동"
    assert region.is_target_region is True

    summaries = db_session.query(MonthlyRegionSummary).all()
    assert len(summaries) == 2


def test_ingest_rent_transactions_skips_existing_source_hashes(db_session):
    xml = """
    <response><body><items>
      <item>
        <법정동> 성수동 </법정동>
        <아파트>중복아파트</아파트>
        <전용면적>84.91</전용면적>
        <계약년월>202501</계약년월>
        <계약일>15</계약일>
        <보증금액>10,000</보증금액>
        <월세금액>80</월세금액>
      </item>
    </items></body></response>
    """
    client = FakeMolitClient(xml)

    first = ingest_rent_transactions(
        db_session,
        client=client,
        source_type="apartment",
        region_code_5="11200",
        contract_year_month="2025-01",
        region_sido="서울특별시",
        region_sigungu="성동구",
    )
    second = ingest_rent_transactions(
        db_session,
        client=client,
        source_type="apartment",
        region_code_5="11200",
        contract_year_month="2025-01",
        region_sido="서울특별시",
        region_sigungu="성동구",
    )

    assert first.inserted_count == 1
    assert second.inserted_count == 0
    assert second.skipped_duplicate_count == 1
    assert db_session.query(RentalTransaction).count() == 1

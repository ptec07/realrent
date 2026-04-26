import pytest

from app.ingestion.xml_parser import parse_public_data_items


SAMPLE_XML = """
<response>
  <body>
    <items>
      <item>
        <법정동>성수동</법정동>
        <보증금액>10,000</보증금액>
        <월세금액>65</월세금액>
      </item>
    </items>
  </body>
</response>
"""


def test_parse_items_from_xml():
    items = parse_public_data_items(SAMPLE_XML)

    assert items == [
        {
            "법정동": "성수동",
            "보증금액": "10,000",
            "월세금액": "65",
        }
    ]


def test_parse_multiple_items_and_trims_text():
    xml = """
    <response>
      <body>
        <items>
          <item><법정동> 성수동 </법정동><아파트>서울숲</아파트></item>
          <item><법정동> 왕십리동 </법정동><아파트>텐즈힐</아파트></item>
        </items>
      </body>
    </response>
    """

    assert parse_public_data_items(xml) == [
        {"법정동": "성수동", "아파트": "서울숲"},
        {"법정동": "왕십리동", "아파트": "텐즈힐"},
    ]


def test_parse_empty_or_missing_items_returns_empty_list():
    assert parse_public_data_items("<response><body><items /></body></response>") == []
    assert parse_public_data_items("<response><body /></response>") == []


def test_parse_invalid_xml_raises_value_error():
    with pytest.raises(ValueError, match="Invalid public data XML"):
        parse_public_data_items("<response><body>")

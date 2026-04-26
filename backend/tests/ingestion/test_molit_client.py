import httpx
import pytest

from app.ingestion.molit_client import MolitClient, fetch_rental_transactions_xml


def test_fetch_rental_transactions_xml_includes_required_public_data_params():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = request.url
        return httpx.Response(200, text="<response><body /></response>")

    http_client = httpx.Client(transport=httpx.MockTransport(handler))

    xml = fetch_rental_transactions_xml(
        http_client=http_client,
        endpoint_url="https://example.test/openapi/rent",
        service_key="SERVICE_KEY",
        region_code_5="11200",
        contract_year_month="202501",
        page_no=2,
        num_of_rows=500,
    )

    assert xml == "<response><body /></response>"
    assert str(captured["url"]).startswith("https://example.test/openapi/rent?")
    params = dict(captured["url"].params.multi_items())
    assert params["serviceKey"] == "SERVICE_KEY"
    assert params["LAWD_CD"] == "11200"
    assert params["DEAL_YMD"] == "202501"
    assert params["pageNo"] == "2"
    assert params["numOfRows"] == "500"


def test_fetch_rental_transactions_xml_normalizes_dash_month():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = request.url
        return httpx.Response(200, text="<ok />")

    http_client = httpx.Client(transport=httpx.MockTransport(handler))

    fetch_rental_transactions_xml(
        http_client=http_client,
        endpoint_url="https://example.test/openapi/rent",
        service_key="SERVICE_KEY",
        region_code_5="11200",
        contract_year_month="2025-01",
    )

    assert dict(captured["url"].params.multi_items())["DEAL_YMD"] == "202501"


def test_fetch_rental_transactions_xml_raises_for_error_response():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(503, text="temporarily unavailable")

    http_client = httpx.Client(transport=httpx.MockTransport(handler))

    with pytest.raises(httpx.HTTPStatusError):
        fetch_rental_transactions_xml(
            http_client=http_client,
            endpoint_url="https://example.test/openapi/rent",
            service_key="SERVICE_KEY",
            region_code_5="11200",
            contract_year_month="202501",
        )


def test_molit_client_uses_configured_service_key_and_source_endpoint():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = request.url
        return httpx.Response(200, text="<items />")

    client = MolitClient(
        service_key="SERVICE_KEY",
        http_client=httpx.Client(transport=httpx.MockTransport(handler)),
        apartment_endpoint_url="https://example.test/apartment",
        officetel_endpoint_url="https://example.test/officetel",
    )

    xml = client.fetch_rent_transactions(
        source_type="officetel",
        region_code_5="11230",
        contract_year_month="202501",
    )

    assert xml == "<items />"
    assert str(captured["url"]).startswith("https://example.test/officetel?")
    params = dict(captured["url"].params.multi_items())
    assert params["serviceKey"] == "SERVICE_KEY"
    assert params["LAWD_CD"] == "11230"
    assert params["DEAL_YMD"] == "202501"


def test_molit_client_uses_sale_endpoint_for_sale_transactions():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = request.url
        return httpx.Response(200, text="<sale-items />")

    client = MolitClient(
        service_key="SERVICE_KEY",
        http_client=httpx.Client(transport=httpx.MockTransport(handler)),
        apartment_sale_endpoint_url="https://example.test/apartment-sale",
        officetel_sale_endpoint_url="https://example.test/officetel-sale",
    )

    xml = client.fetch_sale_transactions(
        source_type="apartment",
        region_code_5="11680",
        contract_year_month="2025-01",
    )

    assert xml == "<sale-items />"
    assert str(captured["url"]).startswith("https://example.test/apartment-sale?")
    params = dict(captured["url"].params.multi_items())
    assert params["serviceKey"] == "SERVICE_KEY"
    assert params["LAWD_CD"] == "11680"
    assert params["DEAL_YMD"] == "202501"

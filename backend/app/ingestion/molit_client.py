from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx

from app.config import settings
from app.models.enums import HousingType

APARTMENT_RENT_ENDPOINT_URL = "https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent"
OFFICETEL_RENT_ENDPOINT_URL = "https://apis.data.go.kr/1613000/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent"
DEFAULT_TIMEOUT_SECONDS = 10.0


@dataclass
class MolitClient:
    service_key: str | None = None
    http_client: httpx.Client | None = None
    apartment_endpoint_url: str = APARTMENT_RENT_ENDPOINT_URL
    officetel_endpoint_url: str = OFFICETEL_RENT_ENDPOINT_URL
    timeout: float = DEFAULT_TIMEOUT_SECONDS

    def fetch_rent_transactions(
        self,
        *,
        source_type: HousingType | str,
        region_code_5: str,
        contract_year_month: str,
        page_no: int = 1,
        num_of_rows: int = 1000,
    ) -> str:
        endpoint_url = self._endpoint_for_source_type(source_type)
        return fetch_rental_transactions_xml(
            http_client=self._http_client(),
            endpoint_url=endpoint_url,
            service_key=self._service_key(),
            region_code_5=region_code_5,
            contract_year_month=contract_year_month,
            page_no=page_no,
            num_of_rows=num_of_rows,
            timeout=self.timeout,
        )

    def _endpoint_for_source_type(self, source_type: HousingType | str) -> str:
        normalized_source_type = HousingType(source_type)
        if normalized_source_type == HousingType.apartment:
            return self.apartment_endpoint_url
        return self.officetel_endpoint_url

    def _service_key(self) -> str:
        service_key = self.service_key or settings.public_data_service_key
        if not service_key:
            raise ValueError("public data service key is required")
        return service_key

    def _http_client(self) -> httpx.Client:
        return self.http_client or httpx.Client(timeout=self.timeout)


def fetch_rental_transactions_xml(
    *,
    http_client: httpx.Client,
    endpoint_url: str,
    service_key: str,
    region_code_5: str,
    contract_year_month: str,
    page_no: int = 1,
    num_of_rows: int = 1000,
    timeout: float | None = DEFAULT_TIMEOUT_SECONDS,
) -> str:
    response = http_client.get(
        endpoint_url,
        params=_build_public_data_params(
            service_key=service_key,
            region_code_5=region_code_5,
            contract_year_month=contract_year_month,
            page_no=page_no,
            num_of_rows=num_of_rows,
        ),
        timeout=timeout,
    )
    response.raise_for_status()
    return response.text


def _build_public_data_params(
    *,
    service_key: str,
    region_code_5: str,
    contract_year_month: str,
    page_no: int,
    num_of_rows: int,
) -> dict[str, Any]:
    return {
        "serviceKey": service_key,
        "LAWD_CD": region_code_5,
        "DEAL_YMD": _normalize_year_month(contract_year_month),
        "pageNo": page_no,
        "numOfRows": num_of_rows,
    }


def _normalize_year_month(value: str) -> str:
    normalized = value.strip().replace("-", "")
    if len(normalized) != 6 or not normalized.isdigit():
        raise ValueError("contract_year_month must be in YYYYMM or YYYY-MM format")
    return normalized

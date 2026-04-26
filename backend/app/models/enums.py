from enum import StrEnum


class HousingType(StrEnum):
    apartment = "apartment"
    officetel = "officetel"


class RentType(StrEnum):
    jeonse = "jeonse"
    monthly = "monthly"
    sale = "sale"


class SyncStatus(StrEnum):
    pending = "pending"
    running = "running"
    success = "success"
    failed = "failed"

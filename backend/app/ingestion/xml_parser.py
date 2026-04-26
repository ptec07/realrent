from __future__ import annotations

import xml.etree.ElementTree as ET


def parse_public_data_items(xml_text: str) -> list[dict[str, str]]:
    """Parse public data portal XML and return each ``<item>`` as a dict.

    The MOLIT public-data APIs used by RealRent return XML shaped like
    ``response/body/items/item``. Field names are Korean XML tags, so this
    parser preserves tag names exactly while trimming text values.
    """

    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError as exc:
        raise ValueError("Invalid public data XML") from exc

    items_parent = root.find(".//items")
    if items_parent is None:
        return []

    parsed_items: list[dict[str, str]] = []
    for item in items_parent.findall("item"):
        parsed_item: dict[str, str] = {}
        for child in list(item):
            parsed_item[child.tag] = (child.text or "").strip()
        if parsed_item:
            parsed_items.append(parsed_item)

    return parsed_items

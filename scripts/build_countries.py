#!/usr/bin/env python3
import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional
from urllib.request import urlopen


CLDR_EN_URLS = [
    "https://raw.githubusercontent.com/unicode-org/cldr-json/main/"
    "cldr-json/cldr-localenames-full/main/en/territories.json",
    "https://raw.githubusercontent.com/unicode-org/cldr-json/master/"
    "cldr-json/cldr-localenames-full/main/en/territories.json",
]
CLDR_ZH_URLS = [
    "https://raw.githubusercontent.com/unicode-org/cldr-json/main/"
    "cldr-json/cldr-localenames-full/main/zh/territories.json",
    "https://raw.githubusercontent.com/unicode-org/cldr-json/master/"
    "cldr-json/cldr-localenames-full/main/zh/territories.json",
]
ISO3166_URLS = [
    "https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/"
    "master/all/all.json"
]


def fetch_json(urls: List[str]) -> dict:
    last_error = None
    for url in urls:
        try:
            with urlopen(url) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as exc:  # noqa: BLE001
            last_error = exc
    raise RuntimeError(f"Failed to fetch JSON from: {urls}") from last_error


def flag_emoji(cc: str) -> str:
    if not re.fullmatch(r"[A-Z]{2}", cc):
        return ""
    return chr(127397 + ord(cc[0])) + chr(127397 + ord(cc[1]))


def normalize_spaces(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def compact_alias(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", text.lower())


def build_aliases(cc: str, name_en: str, name_zh: str, alpha3: Optional[str]) -> List[str]:
    aliases = set()
    if cc:
        aliases.add(cc.lower())
    if alpha3:
        aliases.add(alpha3.lower())

    if name_en:
        lower = normalize_spaces(name_en.lower())
        aliases.add(lower)
        compact = compact_alias(lower)
        if compact and compact != lower:
            aliases.add(compact)

    if name_zh:
        aliases.add(name_zh)

    aliases.discard("")
    return sorted(aliases)


def load_patch(path: Path) -> Dict:
    if not path.exists():
        return {}
    try:
        import yaml  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "PyYAML is required to read countries_patch.yaml. "
            "Install it with: pip install pyyaml"
        ) from exc
    with path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    if not isinstance(data, dict):
        raise ValueError("countries_patch.yaml must be a mapping at the root.")
    return data


def merge_aliases(base: List[str], extra: List[str]) -> List[str]:
    merged = set(base)
    for item in extra:
        if item:
            merged.add(item)
    return sorted(merged)


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    sources_dir = root / "dict" / "sources"
    generated_dir = root / "dict" / "generated"
    patch_path = sources_dir / "countries_patch.yaml"

    generated_dir.mkdir(parents=True, exist_ok=True)

    cldr_en = fetch_json(CLDR_EN_URLS)
    cldr_zh = fetch_json(CLDR_ZH_URLS)
    iso_list = fetch_json(ISO3166_URLS)

    en_territories = cldr_en["main"]["en"]["localeDisplayNames"]["territories"]
    zh_territories = cldr_zh["main"]["zh"]["localeDisplayNames"]["territories"]

    alpha3_by_cc: Dict[str, Optional[str]] = {}
    iso_name_by_cc: Dict[str, str] = {}
    for item in iso_list:
        cc = item.get("alpha-2")
        alpha3 = item.get("alpha-3")
        name = item.get("name")
        if cc:
            alpha3_by_cc[cc] = alpha3
            if name:
                iso_name_by_cc[cc] = name

    codes = set(alpha3_by_cc.keys())
    codes.update(code for code in en_territories.keys() if re.fullmatch(r"[A-Z]{2}", code))
    codes.update(code for code in zh_territories.keys() if re.fullmatch(r"[A-Z]{2}", code))

    patch = load_patch(patch_path)
    overrides = patch.get("overrides", {}) if isinstance(patch.get("overrides"), dict) else {}
    code_aliases = (
        patch.get("code_aliases", {}) if isinstance(patch.get("code_aliases"), dict) else {}
    )

    result = {}
    for cc in sorted(codes):
        name_en = en_territories.get(cc) or iso_name_by_cc.get(cc) or ""
        name_zh = zh_territories.get(cc, "")
        alpha3 = alpha3_by_cc.get(cc)
        aliases = build_aliases(cc, name_en, name_zh, alpha3)

        override = overrides.get(cc, {}) if isinstance(overrides.get(cc), dict) else {}
        if override.get("name_en"):
            name_en = override["name_en"]
        if override.get("name_zh"):
            name_zh = override["name_zh"]
        if override.get("aliases"):
            if isinstance(override["aliases"], list):
                aliases = merge_aliases(aliases, override["aliases"])

        result[cc] = {
            "cc": cc,
            "flag": flag_emoji(cc),
            "name_en": name_en,
            "name_zh": name_zh,
            "aliases": aliases,
        }

    countries_path = generated_dir / "countries.json"
    countries_path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    alias_map: Dict[str, str] = {}
    for cc, data in result.items():
        for alias in data["aliases"]:
            alias_map[alias] = cc
    for alias, target in code_aliases.items():
        alias_map[alias.lower()] = target

    alias_map_path = generated_dir / "country_alias_map.json"
    alias_map_path.write_text(
        json.dumps(alias_map, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

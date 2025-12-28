#!/usr/bin/env python3
"""
Build cities.json from cities.yaml source file.
Generates a normalized dictionary of cities grouped by country.
"""
import json
import sys
from pathlib import Path


def compact_alias(text: str) -> str:
    """Remove all non-alphanumeric characters and convert to lowercase."""
    import re
    return re.sub(r"[^a-z0-9]+", "", text.lower())


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    sources_dir = root / "dict" / "sources"
    generated_dir = root / "dict" / "generated"
    
    cities_yaml = sources_dir / "cities.yaml"
    
    if not cities_yaml.exists():
        print(f"Error: {cities_yaml} not found", file=sys.stderr)
        return 1
    
    try:
        import yaml  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "PyYAML is required to read cities.yaml. "
            "Install it with: pip install pyyaml"
        ) from exc
    
    with cities_yaml.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    
    if not isinstance(data, dict) or "cities" not in data:
        raise ValueError("cities.yaml must contain a 'cities' mapping at the root.")
    
    cities_by_country = data["cities"]
    result = {}
    alias_map = {}
    total_cities = 0
    
    for country_code, cities in cities_by_country.items():
        if not isinstance(cities, dict):
            continue
        
        result[country_code] = {}
        
        for city_key, info in cities.items():
            if not isinstance(info, dict):
                continue
            
            total_cities += 1
            name_en = info.get("name_en", city_key)
            name_zh = info.get("name_zh", city_key)
            aliases = info.get("aliases", [])
            
            # Normalize aliases
            normalized_aliases = set()
            for alias in aliases:
                if alias:
                    # Add original lowercase
                    normalized_aliases.add(alias.lower())
                    # Add compact version (no spaces/punctuation)
                    compact = compact_alias(alias)
                    if compact and compact != alias.lower():
                        normalized_aliases.add(compact)
            
            # Add the city key itself as an alias
            normalized_aliases.add(city_key.lower())
            normalized_aliases.add(compact_alias(city_key))
            
            # Remove empty strings
            normalized_aliases.discard("")
            
            result[country_code][city_key] = {
                "name_en": name_en,
                "name_zh": name_zh,
                "aliases": sorted(normalized_aliases)
            }
            
            # Build reverse alias map (alias -> country_code.city_key)
            for alias in normalized_aliases:
                # Store as "CC.CityKey" for easy lookup
                alias_map[alias] = f"{country_code}.{city_key}"
    
    # Write cities.json
    generated_dir.mkdir(parents=True, exist_ok=True)
    cities_path = generated_dir / "cities.json"
    cities_path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    
    # Write city_alias_map.json for quick lookups
    alias_map_path = generated_dir / "city_alias_map.json"
    alias_map_path.write_text(
        json.dumps(alias_map, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    
    print(f"✓ Generated {cities_path}")
    print(f"✓ Generated {alias_map_path}")
    print(f"  {len(result)} countries, {total_cities} cities, {len(alias_map)} aliases")
    
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

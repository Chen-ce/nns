#!/usr/bin/env python3
"""
Build cities.json from cities.yaml source file.
Generates a normalized dictionary of cities grouped by country.
"""
import json
import sys
from pathlib import Path
from typing import Dict, Set

from utils import compact_alias
from version_manager import update_version_file


# Version for generated files
VERSION = "1.0.0"


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
    alias_map: Dict[str, Set[str]] = {}  # Use set to collect all candidates
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
            
            # Build reverse alias map (alias -> set of country_code.city_key)
            for alias in normalized_aliases:
                city_ref = f"{country_code}.{city_key}"
                alias_map.setdefault(alias, set()).add(city_ref)
    
    # Write cities.json
    generated_dir.mkdir(parents=True, exist_ok=True)
    cities_path = generated_dir / "cities.json"
    cities_path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    
    # Convert alias_map from set to sorted list for consistent output
    # All values are lists (even single candidates) for type consistency
    alias_map_output = {k: sorted(list(v)) for k, v in alias_map.items()}
    
    # Write city_alias_map.json for quick lookups
    alias_map_path = generated_dir / "city_alias_map.json"
    alias_map_path.write_text(
        json.dumps(alias_map_output, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    
    # Count and report conflicts (aliases with multiple candidates)
    conflicts = {k: v for k, v in alias_map_output.items() if len(v) > 1}
    
    # Update version.json (merges with existing data)
    update_version_file(
        generated_dir,
        VERSION,
        {
            "cities.json": {"countries": len(result), "cities": total_cities},
            "city_alias_map.json": {"aliases": len(alias_map_output), "conflicts": len(conflicts)}
        }
    )
    version_path = generated_dir / "version.json"
    
    print(f"✓ Generated {cities_path}")
    print(f"✓ Generated {alias_map_path}")
    print(f"✓ Generated {version_path}")
    print(f"  {len(result)} countries, {total_cities} cities, {len(alias_map_output)} aliases")
    
    if conflicts:
        print(f"⚠ {len(conflicts)} alias conflicts detected:")
        # Show top 10 most conflicted aliases
        sorted_conflicts = sorted(conflicts.items(), key=lambda x: len(x[1]), reverse=True)
        for alias, refs in sorted_conflicts[:10]:
            print(f"    '{alias}' -> {refs}")
        if len(conflicts) > 10:
            print(f"    ... and {len(conflicts) - 10} more conflicts")
    
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""
Build lines.json from lines.yaml source file.
Generates a normalized dictionary of line types and their aliases.
"""
import json
import sys
from pathlib import Path

from utils import compact_alias


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    sources_dir = root / "dict" / "sources"
    generated_dir = root / "dict" / "generated"
    
    lines_yaml = sources_dir / "lines.yaml"
    
    if not lines_yaml.exists():
        print(f"Error: {lines_yaml} not found", file=sys.stderr)
        return 1
    
    try:
        import yaml  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "PyYAML is required to read lines.yaml. "
            "Install it with: pip install pyyaml"
        ) from exc
    
    with lines_yaml.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    
    if not isinstance(data, dict) or "lines" not in data:
        raise ValueError("lines.yaml must contain a 'lines' mapping at the root.")
    
    lines = data["lines"]
    result = {}
    alias_map = {}
    
    for line_type, info in lines.items():
        if not isinstance(info, dict):
            continue
        
        display_en = info.get("display_en", line_type)
        display_zh = info.get("display_zh", line_type)
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
        
        # Add the line type itself as an alias
        normalized_aliases.add(line_type.lower())
        normalized_aliases.add(compact_alias(line_type))
        
        # Remove empty strings
        normalized_aliases.discard("")
        
        result[line_type] = {
            "display_en": display_en,
            "display_zh": display_zh,
            "aliases": sorted(normalized_aliases)
        }
        
        # Build reverse alias map
        for alias in normalized_aliases:
            alias_map[alias] = line_type
    
    # Write lines.json
    generated_dir.mkdir(parents=True, exist_ok=True)
    lines_path = generated_dir / "lines.json"
    lines_path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    
    # Write line_alias_map.json for quick lookups
    alias_map_path = generated_dir / "line_alias_map.json"
    alias_map_path.write_text(
        json.dumps(alias_map, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    
    print(f"✓ Generated {lines_path}")
    print(f"✓ Generated {alias_map_path}")
    print(f"  {len(result)} line types, {len(alias_map)} aliases")
    
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

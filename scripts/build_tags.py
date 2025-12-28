#!/usr/bin/env python3
"""
Build tags.json from tags.yaml source file.
Generates a normalized dictionary of tags and their aliases.
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
    
    tags_yaml = sources_dir / "tags.yaml"
    
    if not tags_yaml.exists():
        print(f"Error: {tags_yaml} not found", file=sys.stderr)
        return 1
    
    try:
        import yaml  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "PyYAML is required to read tags.yaml. "
            "Install it with: pip install pyyaml"
        ) from exc
    
    with tags_yaml.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    
    if not isinstance(data, dict) or "tags" not in data:
        raise ValueError("tags.yaml must contain a 'tags' mapping at the root.")
    
    tags = data["tags"]
    result = {}
    alias_map = {}
    
    for tag_type, info in tags.items():
        if not isinstance(info, dict):
            continue
        
        display_en = info.get("display_en", tag_type)
        display_zh = info.get("display_zh", tag_type)
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
        
        # Add the tag type itself as an alias
        normalized_aliases.add(tag_type.lower())
        normalized_aliases.add(compact_alias(tag_type))
        
        # Remove empty strings
        normalized_aliases.discard("")
        
        result[tag_type] = {
            "display_en": display_en,
            "display_zh": display_zh,
            "aliases": sorted(normalized_aliases)
        }
        
        # Build reverse alias map
        for alias in normalized_aliases:
            alias_map[alias] = tag_type
    
    # Write tags.json
    generated_dir.mkdir(parents=True, exist_ok=True)
    tags_path = generated_dir / "tags.json"
    tags_path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    
    # Write tag_alias_map.json for quick lookups
    alias_map_path = generated_dir / "tag_alias_map.json"
    alias_map_path.write_text(
        json.dumps(alias_map, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    
    print(f"✓ Generated {tags_path}")
    print(f"✓ Generated {alias_map_path}")
    print(f"  {len(result)} tag types, {len(alias_map)} aliases")
    
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

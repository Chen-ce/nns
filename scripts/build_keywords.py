#!/usr/bin/env python3
"""
Build keywords_status.json and keywords_ad.json from YAML source files.
Generates pattern lists for filtering status lines and advertising content.
"""
import json
import sys
from pathlib import Path


def build_keyword_file(yaml_path: Path, json_path: Path) -> int:
    """Build a single keyword JSON file from YAML source."""
    if not yaml_path.exists():
        print(f"Error: {yaml_path} not found", file=sys.stderr)
        return 1
    
    try:
        import yaml  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "PyYAML is required to read keyword files. "
            "Install it with: pip install pyyaml"
        ) from exc
    
    with yaml_path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    
    if not isinstance(data, dict) or "patterns" not in data:
        raise ValueError(f"{yaml_path.name} must contain a 'patterns' list at the root.")
    
    patterns = data["patterns"]
    if not isinstance(patterns, list):
        raise ValueError(f"'patterns' in {yaml_path.name} must be a list.")
    
    # Remove duplicates and sort
    unique_patterns = sorted(set(p for p in patterns if p))
    
    result = {
        "patterns": unique_patterns
    }
    
    json_path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    
    print(f"✓ Generated {json_path}")
    print(f"  {len(unique_patterns)} patterns")
    
    return 0


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    sources_dir = root / "dict" / "sources"
    generated_dir = root / "dict" / "generated"
    
    generated_dir.mkdir(parents=True, exist_ok=True)
    
    # Build keywords_status.json
    status_yaml = sources_dir / "keywords_status.yaml"
    status_json = generated_dir / "keywords_status.json"
    ret1 = build_keyword_file(status_yaml, status_json)
    
    # Build keywords_ad.json
    ad_yaml = sources_dir / "keywords_ad.yaml"
    ad_json = generated_dir / "keywords_ad.json"
    ret2 = build_keyword_file(ad_yaml, ad_json)
    
    return ret1 or ret2


if __name__ == "__main__":
    raise SystemExit(main())

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
    
    if not isinstance(data, dict):
        raise ValueError(f"{yaml_path.name} must be a dictionary.")
    
    # Handle simple patterns list
    if "patterns" in data and isinstance(data["patterns"], list):
        data["patterns"] = sorted(set(p for p in data["patterns"] if p))
    
    # Write to JSON
    json_path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    
    print(f"✓ Generated {json_path}")
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
    
    # Build keywords_connectors.json
    conn_yaml = sources_dir / "keywords_connectors.yaml"
    conn_json = generated_dir / "keywords_connectors.json"
    ret3 = build_keyword_file(conn_yaml, conn_json)
    
    # Return immediately on first error
    if ret1 != 0:
        return ret1
    if ret2 != 0:
        return ret2
    return ret3


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""
Shared version management for NNS build scripts.
Ensures version.json is properly merged across multiple script runs.
"""
import json
from pathlib import Path
from typing import Any, Dict


def update_version_file(
    generated_dir: Path,
    version: str,
    file_metadata: Dict[str, Dict[str, Any]]
) -> None:
    """Update version.json with metadata from current script.
    
    Merges with existing version.json if present, preserving data from other scripts.
    
    Args:
        generated_dir: Directory where version.json is stored
        version: Version string (e.g., "1.0.0")
        file_metadata: Dictionary mapping filenames to their metadata
        
    Example:
        update_version_file(
            generated_dir,
            "1.0.0",
            {
                "cities.json": {"countries": 125, "cities": 171},
                "city_alias_map.json": {"aliases": 414, "conflicts": 3}
            }
        )
    """
    version_path = generated_dir / "version.json"
    
    # Load existing version data if present
    if version_path.exists():
        try:
            with version_path.open("r", encoding="utf-8") as f:
                version_data = json.load(f)
        except (json.JSONDecodeError, IOError):
            version_data = {"version": version, "files": {}}
    else:
        version_data = {"version": version, "files": {}}
    
    # Update version if newer (simple string comparison for semver)
    if version > version_data.get("version", "0.0.0"):
        version_data["version"] = version
    
    # Merge file metadata
    if "files" not in version_data:
        version_data["files"] = {}
    
    version_data["files"].update(file_metadata)
    
    # Write back
    version_path.write_text(
        json.dumps(version_data, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

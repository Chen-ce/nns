#!/usr/bin/env python3
"""
Shared utility functions for NNS build scripts.
"""
import re


def compact_alias(text: str) -> str:
    """Remove all non-alphanumeric characters and convert to lowercase.
    
    Args:
        text: The text to compact
        
    Returns:
        Compacted lowercase string with only alphanumeric characters
        
    Examples:
        >>> compact_alias("San Francisco")
        'sanfrancisco'
        >>> compact_alias("Hong Kong")
        'hongkong'
    """
    return re.sub(r"[^a-z0-9]+", "", text.lower())


def normalize_spaces(text: str) -> str:
    """Normalize whitespace by replacing multiple spaces with single space.
    
    Args:
        text: The text to normalize
        
    Returns:
        Text with normalized whitespace and trimmed edges
        
    Examples:
        >>> normalize_spaces("San  Francisco  ")
        'San Francisco'
    """
    return re.sub(r"\s+", " ", text).strip()


def lower_and_strip(text: str) -> str:
    """Convert to lowercase and strip whitespace.
    
    Args:
        text: The text to process
        
    Returns:
        Lowercase text with trimmed edges
        
    Examples:
        >>> lower_and_strip("  Paris  ")
        'paris'
    """
    return text.lower().strip()


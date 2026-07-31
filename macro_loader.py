"""
macro_loader.py
---------------
Utility for loading JavaScript macro files from the macros/ directory
and substituting dynamic runtime placeholders before execution.

IMPORTANT: Chrome's address bar only accepts SINGLE-LINE JavaScript when
injected via the javascript: protocol. This loader automatically strips
comment lines and collapses all whitespace into a single line so every
macro works correctly regardless of how the .js file is formatted.

Usage:
    from macro_loader import load_macro

    # Static macro (no placeholders)
    js = load_macro("playbison_navigate.js")

    # Dynamic macro with placeholder substitution
    js = load_macro("ds_open_modal.js", PLAYER_ID=player_id, PLAYER_EMAIL=player_email)
"""

import os
import re

_MACROS_DIR = os.path.join(os.path.dirname(__file__), "macros")


def _minify(source: str) -> str:
    """
    Collapse a multi-line JS source into a single line suitable for
    Chrome's address bar (javascript: protocol).

    Steps:
      1. Remove lines that are purely single-line comments (// ...)
      2. Strip leading/trailing whitespace from every line
      3. Drop empty lines
      4. Join remaining lines with a single space
      5. Collapse any runs of multiple spaces to a single space
    """
    lines = source.splitlines()
    kept = []
    for line in lines:
        stripped = line.strip()
        # Drop pure comment lines and blank lines
        if stripped.startswith("//") or stripped == "":
            continue
        if stripped:
            kept.append(stripped)
    single_line = " ".join(kept)
    # Collapse multiple spaces that may result from joining
    single_line = re.sub(r"  +", " ", single_line)
    return single_line


def load_macro(filename: str, **substitutions) -> str:
    """
    Read a .js macro file, apply placeholder substitutions, and return
    the entire script as a single minified line ready for clipboard injection.

    Placeholders in JS files use the format:  ###KEY###
    Pass substitutions as keyword arguments where the key matches the placeholder name.

    Parameters
    ----------
    filename : str
        The macro filename (basename only, e.g. "playbison_navigate.js").
    **substitutions : str
        Key=value pairs for placeholder replacement.

    Returns
    -------
    str
        The macro source, minified to a single line, with all placeholders resolved.
    """
    path = os.path.join(_MACROS_DIR, filename)
    with open(path, "r", encoding="utf-8") as f:
        source = f.read()

    # Apply placeholder substitutions before minifying
    for key, value in substitutions.items():
        placeholder = f"###{key}###"
        source = source.replace(placeholder, str(value))

    return _minify(source)

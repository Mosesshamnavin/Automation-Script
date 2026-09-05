"""
message_templates.py
--------------------
Fetch multilingual message templates from the shared Google Sheet and
resolve title/body for a given verification status and player language.
"""

import csv
import io
import re
import time
import urllib.parse
import urllib.request

SPREADSHEET_ID = "1-h2yLFAcAgZO1_iom1KgryLnbh1yGYeefgO-JQIu79E"
TEMPLATE_SHEET_URL = (
    f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit"
)

_sheet_cache = {}  # tab_name -> (timestamp, templates_dict)

LANGUAGE_PATTERNS = {
    "PL": [r"polish", r"🇵🇱", r"\bpl\b"],
    "EN": [r"english", r"🇬🇧", r"\ben\b"],
    "HU": [r"hungarian", r"🇭🇺", r"\bhu\b"],
    "PT": [r"portugu", r"portuguese", r"🇵🇹"],
    "DE": [r"german", r"🇩🇪", r"\bde\b"],
    "LV": [r"latvian", r"🇱🇻", r"\blv\b"],
    "NO": [r"norwegian", r"🇳🇴", r"\bno\b"],
}

COUNTRY_TO_LANG = {
    "poland": "PL", "polska": "PL", "pl": "PL",
    "hungary": "HU", "magyarország": "HU", "magyarorszag": "HU", "hu": "HU",
    "germany": "DE", "deutschland": "DE", "de": "DE",
    "austria": "DE", "österreich": "DE", "osterreich": "DE", "at": "DE",
    "latvia": "LV", "latvija": "LV", "lv": "LV",
    "portugal": "PT", "pt": "PT",
    "brazil": "PT", "brasil": "PT", "br": "PT",
    "norway": "NO", "norge": "NO", "no": "NO",
    "united kingdom": "EN", "uk": "EN", "gb": "EN", "england": "EN",
    "ireland": "EN", "ie": "EN",
}

POLISH_CITY_HINTS = (
    "warszawa", "krakow", "kraków", "lodz", "łódź", "wroclaw", "wrocław",
    "poznan", "poznań", "gdansk", "gdańsk", "szczecin", "bydgoszcz", "lublin",
    "katowice", "bialystok", "białystok", "gdynia", "czestochowa", "częstochowa",
)

HUNGarian_CITY_HINTS = (
    "budapest", "debrecen", "szeged", "miskolc", "pecs", "pécs", "gyor", "győr",
)

STATUS_TO_SHEET_TAB = [
    (["req last deposit", "w/d ratio", "verify docs", "no data studio"], "Last deposit verification (D/W ratio)"),
    (["first-time cc", "paysafecard / no 3m cc", "card verification", "req iban"], "Card verification"),
    (["third party"], "3rd party deposit confirmed"),
    (["cancel (mismatch operator", "mismatch operator"], "Depo/wd with the same account/ ewallet + PCS(HU)"),
    (["reject (stack", "exceeded stakes", "stack > 100"], "Exceeded stakes with the bonus"),
    (["review (duplicates", "warning of duplicates"], "WARNING of Duplicates"),
    (["reject (gb iban", "gb withdrawal"], "GB Withdrawal – selecting your ZEN account"),
    (["limit reached", "insufficient funds"], "Insufficient Funds/ Tech issue - WD declined"),
    (["skrill", "paysafecard wallet"], "Skrill/ Paysafecard wallet verification"),
    (["cancellation requested", "returned back"], "Cancellation Requested returned back to acc"),
]


def map_status_to_sheet_tab(approval_status: str) -> str:
    """Map a verification status string to a template sheet tab name."""
    status_lower = (approval_status or "").lower()
    for keywords, tab_name in STATUS_TO_SHEET_TAB:
        if any(kw in status_lower for kw in keywords):
            return tab_name
    return "Last deposit verification (D/W ratio)"


def detect_player_language(city: str = "", country: str = "", email: str = "") -> str:
    """Infer template language code (PL, EN, HU, ...) from player profile hints."""
    for src in (country, city):
        if not src:
            continue
        s = src.strip().lower()
        s = re.sub(r"\([^)]*\)", "", s).strip()
        if s in COUNTRY_TO_LANG:
            return COUNTRY_TO_LANG[s]
        for key, lang in COUNTRY_TO_LANG.items():
            if key in s.split(",")[0].strip():
                return lang

    city_lower = (city or "").lower()
    if any(h in city_lower for h in POLISH_CITY_HINTS):
        return "PL"
    if any(h in city_lower for h in HUNGarian_CITY_HINTS):
        return "HU"

    if re.search(r"\(\d{2}-\d{3}\)", city or ""):
        return "PL"

    email_lower = (email or "").lower()
    if email_lower.endswith(".pl"):
        return "PL"
    if email_lower.endswith(".hu"):
        return "HU"
    if email_lower.endswith(".de"):
        return "DE"
    if email_lower.endswith(".lv"):
        return "LV"
    if email_lower.endswith(".pt") or email_lower.endswith(".br"):
        return "PT"
    if email_lower.endswith(".no"):
        return "NO"

    return "EN"


def _fetch_sheet_csv(tab_name: str) -> list:
    url = (
        f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/gviz/tq"
        f"?tqx=out:csv&sheet={urllib.parse.quote(tab_name)}"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        text = resp.read().decode("utf-8", errors="replace")
    return list(csv.reader(io.StringIO(text)))


def _cell_matches_language(cell: str, lang: str) -> bool:
    cell_lower = (cell or "").strip().lower()
    if not cell_lower or len(cell_lower) > 80:
        return False
    for pattern in LANGUAGE_PATTERNS.get(lang, []):
        if re.search(pattern, cell_lower):
            return True
    return False


def _parse_templates_from_grid(grid: list) -> dict:
    """Parse {lang: {title, body}} from a sheet grid by locating language headers."""
    templates = {}

    for r, row in enumerate(grid):
        for c, cell in enumerate(row):
            for lang in LANGUAGE_PATTERNS:
                if not _cell_matches_language(cell, lang):
                    continue
                title = ""
                body = ""
                if r + 1 < len(grid) and c < len(grid[r + 1]):
                    title = (grid[r + 1][c] or "").strip()
                if r + 2 < len(grid) and c < len(grid[r + 2]):
                    body = (grid[r + 2][c] or "").strip()
                if title and body and len(body) > 40:
                    if lang not in templates or len(body) > len(templates[lang]["body"]):
                        templates[lang] = {"title": title, "body": body}

    if "PL" not in templates and len(grid) >= 3:
        header_b = (grid[0][1] if len(grid[0]) > 1 else "").lower()
        if "english" in header_b:
            pl_title = (grid[1][0] if len(grid[1]) > 0 else "").strip()
            pl_body = (grid[2][0] if len(grid[2]) > 0 else "").strip()
            if pl_title and pl_body and len(pl_body) > 40:
                templates["PL"] = {"title": pl_title, "body": pl_body}

    return templates


def _get_tab_templates(tab_name: str, cache_ttl: float = 300.0) -> dict:
    now = time.time()
    cached = _sheet_cache.get(tab_name)
    if cached and now - cached[0] < cache_ttl:
        return cached[1]

    try:
        grid = _fetch_sheet_csv(tab_name)
        templates = _parse_templates_from_grid(grid)
        _sheet_cache[tab_name] = (now, templates)
        return templates
    except Exception as exc:
        print(f"[MESSAGE TEMPLATE] Failed to fetch tab '{tab_name}': {exc}")
        if cached:
            return cached[1]
        return {}


def fill_placeholders(text: str, dep_date: str = "", dep_amount: str = "", dep_curr: str = "PLN") -> str:
    """Replace XXXXX placeholders: first = date, second = amount (number only)."""
    if not text:
        return text

    date_txt = dep_date.strip() if dep_date else ""
    if date_txt:
        m = re.search(r"\b(20\d\d-\d\d-\d\d)\b", date_txt.replace("T", " "))
        if m:
            date_txt = m.group(1)
        else:
            date_txt = date_txt.split(" ")[0][:10]

    amt_txt = (dep_amount or "").strip()
    amt_txt = re.sub(r"\s*(PLN|EUR|HUF|BRL|USD|GBP|NOK|SEK)\s*$", "", amt_txt, flags=re.I).strip()
    amt_txt = re.sub(r"[^\d.,]", "", amt_txt).replace(",", ".").strip()

    counter = {"n": 0}

    def replacer(_match):
        counter["n"] += 1
        if counter["n"] == 1:
            return date_txt if date_txt else "XXXXX"
        if counter["n"] == 2:
            return amt_txt if amt_txt else "XXXXX"
        return "XXXXX"

    return re.sub(r"XXXXX", replacer, text)


def has_unfilled_placeholders(text: str) -> bool:
    """True if template still contains unfilled XXXXX placeholders."""
    return bool(text and re.search(r"XXXXX", text, re.I))


def get_message_from_sheet(
    approval_status: str,
    city: str = "",
    country: str = "",
    email: str = "",
    dep_date: str = "",
    dep_amount: str = "",
    dep_curr: str = "PLN",
) -> tuple:
    """
    Return (title, body) from the Google Sheet template for this status/language.
    Returns (None, None) if no template could be loaded.
    """
    tab_name = map_status_to_sheet_tab(approval_status)
    lang = detect_player_language(city=city, country=country, email=email)
    templates = _get_tab_templates(tab_name)

    if not templates:
        print(f"[MESSAGE TEMPLATE] No templates loaded for tab '{tab_name}'.")
        return None, None

    entry = templates.get(lang) or templates.get("EN") or next(iter(templates.values()), None)
    if not entry:
        print(f"[MESSAGE TEMPLATE] No template for language '{lang}' on tab '{tab_name}'.")
        return None, None

    title = fill_placeholders(entry["title"], dep_date, dep_amount, dep_curr)
    body = fill_placeholders(entry["body"], dep_date, dep_amount, dep_curr)

    if has_unfilled_placeholders(body):
        print(
            f"[MESSAGE TEMPLATE] WARNING: Placeholders remain unfilled "
            f"(dep_date='{dep_date or ''}' dep_amount='{dep_amount or ''}')."
        )

    print(
        f"[MESSAGE TEMPLATE] Tab='{tab_name}' | Lang={lang} | Title='{title[:60]}...'"
        if len(title) > 60 else
        f"[MESSAGE TEMPLATE] Tab='{tab_name}' | Lang={lang} | Title='{title}'"
    )
    return title, body

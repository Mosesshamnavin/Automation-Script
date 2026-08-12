"""
test_direct_notes.py
---------------------
DIRECT TESTING SCRIPT — starts from the Notes page.

Hardcoded for:
  Email  : technityc@gmail.com
  ID     : 133776
  Wallet : b54b2b21f0edd38a6c396eca

Instructions:
  1. Open Chrome and navigate to the player's wallet page:
       https://api-acnt.playbison.com/platform-admin/#action:admin.user:b54b2b21f0edd38a6c396eca
  2. Click inside the Chrome window so it has keyboard focus.
  3. Run this script and press ENTER when ready.

Output includes:
  - Top note text + 'req' flag
  - Stack transaction lines (e.g. -1050Huf*43)
  - Game names extracted from note column (R: pattern)
  - Bonus name from Bonuses tab (matched by stack date)

The script will then:
  • Click the Notes tab and read the top note
  • Run the Transactions & Stack Check macro
  • Print the final result
"""

import pyautogui
import time
import pyperclip
from macro_loader import load_macro

import os
import json

# ── Dynamic user loading from last_user.json ────────────────────────────────
PLAYER_EMAIL  = ""
PLAYER_ID     = ""
WALLET_ID     = ""
T_CURR        = "PLN"

if os.path.exists("last_user.json"):
    try:
        with open("last_user.json", "r") as f:
            data = json.load(f)
            PLAYER_EMAIL = data.get("email", "")
            PLAYER_ID    = data.get("id", "")
            WALLET_ID    = data.get("wallet_id", data.get("id", ""))
            T_CURR       = data.get("t_curr", "PLN")
    except Exception:
        pass
# ─────────────────────────────────────────────────────────────────────────────


def run_macro_via_addressbar(js: str) -> None:
    """Paste a one-line JS snippet into Chrome's address bar and execute it."""
    pyperclip.copy(js)
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.3)
    pyautogui.write('javascript:')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.3)
    pyautogui.press('enter')


def wait_for_clipboard(sentinel: str, prefix: str, timeout: int = 20) -> str:
    """
    Poll the clipboard until it contains a value that:
      - is non-empty
      - is NOT the sentinel
      - starts with the given prefix (or prefix is empty = accept anything)
    Returns the raw clipboard value, or '' on timeout.
    """
    for _ in range(timeout):
        pyautogui.hotkey('ctrl', 'c')
        time.sleep(1.0)
        val = pyperclip.paste().strip()
        if val and val != sentinel and not val.startswith('(function') and not val.startswith('javascript:'):
            if not prefix or val.startswith(prefix):
                return val
    return ''


def main():
    print("=" * 50)
    print(" DIRECT TESTING FROM WALLET PAGE")
    print("=" * 50)
    print(f"  Email  : {PLAYER_EMAIL}")
    print(f"  ID     : {PLAYER_ID}")
    print(f"  Wallet : {WALLET_ID}")
    print()
    print("Make sure Chrome is open on this user's wallet page:")
    print(f"  https://api-acnt.playbison.com/platform-admin/#action:admin.user:{WALLET_ID}")
    print()
    input("Press ENTER when Chrome is focused and you are on the wallet page...")

    print("Switch to Chrome NOW! You have 3 seconds...")
    for i in range(3, 0, -1):
        print(f"{i}...")
        time.sleep(1)

    # ── Step 1: Open Notes tab ────────────────────────────────────────────────
    print("\n[STEP 1] Opening Notes tab...")
    js_notes = load_macro("ds_open_notes.js")
    run_macro_via_addressbar(js_notes)
    print("[STEP 1] Notes tab clicked. Waiting 5 seconds for data to load...")
    time.sleep(5.0)

    # ── Step 2: Check Notes for 'req' keyword ────────────────────────────────
    print("[STEP 2] Reading top note...")
    js_check_notes = load_macro("ds_check_notes.js")

    note_txt = ""
    notes_have_req = False

    for attempt in range(15):
        pyperclip.copy("WAITING_FOR_NOTES")
        run_macro_via_addressbar(js_check_notes)
        time.sleep(1.0)

        clip_val = pyperclip.paste().strip()
        if clip_val.startswith("REQ_FOUND:"):
            res_part = clip_val.replace("REQ_FOUND:", "")
            if "|" in res_part:
                parts = res_part.split("|")
                note_txt = parts[1].replace("TEXT:", "")
                if note_txt != "NOTES_NOT_FOUND":
                    notes_have_req = (parts[0] == "YES")
                    print(f"[STEP 2] Top note: '{note_txt}'")
                    print(f"[STEP 2] Contains 'req': {notes_have_req}")
                    break
        time.sleep(0.5)
    else:
        print("[STEP 2] WARNING: Could not read notes within timeout.")

    # ── Step 3: Transactions & Stack Check ───────────────────────────────────
    print("\n[STEP 3] Executing Transactions & Stack Check macro...")
    js_trans = load_macro("ds_check_transactions.js")
    js_trans = js_trans.replace("###TCURR###", T_CURR)

    pyperclip.copy("WAITING_FOR_TRANS")
    run_macro_via_addressbar(js_trans)

    print("[STEP 3] Waiting for transactions check & stack pagination...")
    trans_result = ""
    stack_date   = ""

    for poll in range(35):
        pyautogui.hotkey('ctrl', 'c')
        time.sleep(1.0)
        clip_val = pyperclip.paste().strip()

        if clip_val and clip_val.startswith("TRANS_RESULT:"):
            raw = clip_val.replace("TRANS_RESULT:", "").strip()

            if "|STACK_DATE:" in raw:
                parts = raw.split("|STACK_DATE:")
                trans_result = parts[0].strip()
                stack_date   = parts[1].strip()
            else:
                trans_result = raw

            # ── Handle EXCEEDS_5_PAGES (too many transactions) ────────────
            if trans_result.startswith("EXCEEDS_5_PAGES"):
                dates_str = trans_result.split("|")[1] if "|" in trans_result else ""
                print(f"\n{'='*60}")
                print(f"⚠️  OVER 5 PAGES OF TRANSACTIONS FOUND!")
                print(f"   Stack dates on page 1: {dates_str}")
                print(f"{'='*60}")

            # ── Parse out |GAMES: section from trans_result ───────────────
            games_list = []
            if "\n|GAMES:" in trans_result:
                parts = trans_result.split("\n|GAMES:")
                trans_result = parts[0].strip()
                games_list = [g.strip() for g in parts[1].split("|") if g.strip()]

            # ── Handle bonus extraction if a specific stack date was found ─
            if trans_result not in ("NO_STACK", "AUTOMATIC", "NO_TRANSACTIONS_TAB", "NO_DATE_INPUT"):
                print(f"\n{'='*60}")
                print(f"⚠️  STACK TRANSACTIONS FOUND:")
                for line in trans_result.splitlines():
                    print(f"   {line}")
                if games_list:
                    print(f"   Games     : {', '.join(games_list)}")
                if stack_date:
                    print(f"   Stack Date: {stack_date}")
                print(f"{'='*60}")

                if stack_date:
                    print(f"\n[STEP 3b] Navigating to Bonuses tab for date: {stack_date}...")

                    # ── Phase 1: Navigate current tab to BASE wallet URL ──────────
                    # The SPA requires the user page to load cleanly before tabs work.
                    # The /bonuses sub-path in the URL does NOT work for direct nav.
                    wallet_base_url = f"https://api-acnt.playbison.com/platform-admin/#action:admin.user:{WALLET_ID}"
                    pyautogui.hotkey('ctrl', 'l')
                    time.sleep(0.4)
                    pyperclip.copy(wallet_base_url)
                    pyautogui.hotkey('ctrl', 'a')
                    time.sleep(0.1)
                    pyautogui.hotkey('ctrl', 'v')
                    time.sleep(0.2)
                    pyautogui.press('enter')
                    print("[STEP 3b] Waiting 5 seconds for wallet page to reload...")
                    time.sleep(5.0)

                    stack_date_ymd = stack_date.split("T")[0] if "T" in stack_date else stack_date.split(" ")[0]
                    # ── Phase 2: Click the Bonuses tab (proven pattern) ───────────
                    js_open_bonuses = load_macro("ds_open_bonuses.js")
                    run_macro_via_addressbar(js_open_bonuses)
                    print("[STEP 3b] Bonuses tab clicked. Waiting 5 seconds for data to load...")
                    time.sleep(5.0)

                    # ── Phase 3: Inject scan-only macro ──────────────────────────
                    js_bonus = load_macro("ds_extract_bonus.js")
                    js_bonus = js_bonus.replace("###STACK_DATE###", stack_date)

                    pyperclip.copy("__WAITING_BONUS__")
                    run_macro_via_addressbar(js_bonus)

                    bonus_name = ""
                    # Poll pyperclip.paste() directly — no Ctrl+C.
                    # JS execCommand('copy') updates OS clipboard directly.
                    # Up to 90s: up to 15 pages * 3s + scan time
                    for _ in range(90):
                        time.sleep(1.0)
                        bval = pyperclip.paste().strip()
                        if bval.startswith("BONUS_RESULT:"):
                            bonus_name = bval.replace("BONUS_RESULT:", "").strip()
                            break

                    if bonus_name and not bonus_name.startswith("NOT_FOUND") and bonus_name != "":
                        print(f"[STEP 3b] ✅ Bonus: {bonus_name}")
                    else:
                        print(f"[STEP 3b] No matching bonus found for date {stack_date_ymd}.")
                        bonus_name = ""
            else:
                games_list = []
                print(f"\n[STEP 3] Result: {trans_result}")

            break
    else:
        print("[STEP 3] Timed out waiting for transactions macro result.")

    # ── Final Summary ─────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("FINAL TEST RESULT")
    print("=" * 60)
    print(f"  Player    : {PLAYER_EMAIL} (ID: {PLAYER_ID})")
    print(f"  Wallet    : {WALLET_ID}")
    print(f"  Note      : {note_txt or '(none / not found)'}")
    print(f"  Has 'req' : {notes_have_req}")
    if trans_result and trans_result not in ("NO_STACK", "AUTOMATIC", "NO_TRANSACTIONS_TAB", "NO_DATE_INPUT"):
        print(f"  Stack     :")
        for line in trans_result.splitlines():
            print(f"              {line}")
        if games_list:
            print(f"  Games     : {', '.join(games_list)}")
        if stack_date:
            print(f"  Stack Date: {stack_date}")
        if bonus_name:
            print(f"  Bonus     : {bonus_name}")
    else:
        print(f"  Stack     : {trans_result or '(timed out)'}")
    print("=" * 60)


if __name__ == "__main__":
    main()

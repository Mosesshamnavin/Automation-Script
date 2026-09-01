import pyautogui
import time
import pyperclip
import json
import os
import re
import webbrowser
import datetime
import sys
import urllib.request
from macro_loader import load_macro

# Cache live exchange rates per session to avoid repeated API calls
_fx_rate_cache = {}

def convert_to_pln(amount_str, currency, **kwargs):
    """Convert an amount in a given currency to PLN using live exchange rates.
    Returns a tuple: (pln_amount_str, note_str)
    e.g. ('476.00', '40000.00 HUF → 476.00 PLN')
    """
    currency = (currency or "PLN").strip().upper()
    if currency == "PLN":
        return amount_str, ""

    try:
        amount = float(str(amount_str).replace(",", ".").strip())
    except ValueError:
        return amount_str, ""

    global _fx_rate_cache
    if currency not in _fx_rate_cache:
        try:
            url = f"https://open.er-api.com/v6/latest/{currency}"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode())
                rate_to_pln = data.get("rates", {}).get("PLN")
                if rate_to_pln:
                    _fx_rate_cache[currency] = float(rate_to_pln)
                    print(f"[FX] Live rate: 1 {currency} = {rate_to_pln} PLN")
                else:
                    print(f"[FX] WARNING: PLN rate not found for {currency}. Keeping original.")
                    return f"{amount_str} {currency}", ""
        except Exception as e:
            print(f"[FX] WARNING: Rate fetch failed for {currency}: {e}. Keeping original.")
            return f"{amount_str} {currency}", ""

    rate = _fx_rate_cache[currency]
    pln_amount = round(amount * rate, 2)
    note = f"{amount_str} {currency} -> {pln_amount:.2f} PLN"
    print(f"[FX] Converted: {note}")
    return f"{pln_amount:.2f}", note




def cleanup_tabs(sheets_opened=False, analytics_opened=False, wallet_opened=False, datastudio_opened=False, duplicates_opened=False):
    print("[DATASTUDIO] Closing opened auxiliary tabs to return to Playbison...")
    if sheets_opened:
        pyautogui.hotkey('ctrl', 'w')
        time.sleep(0.4)
    if analytics_opened:
        pyautogui.hotkey('ctrl', 'w')
        time.sleep(0.4)
    if wallet_opened:
        pyautogui.hotkey('ctrl', 'w')
        time.sleep(0.4)
    if datastudio_opened:
        pyautogui.hotkey('ctrl', 'w')
        time.sleep(0.4)
    if duplicates_opened:
        pyautogui.hotkey('ctrl', 'w')
        time.sleep(0.4)
    
    # Always ensure Chrome focuses on Tab 1 (Main Playbison table)
    time.sleep(0.5)
    pyautogui.hotkey('ctrl', '1')
    time.sleep(0.5)
    pyautogui.press('escape')
    time.sleep(0.3)


def main():
    print("============================================================")
    print("DATA STUDIO AUTOMATION")
    print("============================================================")
    import sys
    
    # Track opened auxiliary tabs to close only what was opened
    duplicates_opened = False
    datastudio_opened = False
    wallet_opened = False
    analytics_opened = False
    sheets_opened = False
    true_player_name = ""

    print("\nINSTRUCTIONS:")
    print("1. Your email should already be copied to your clipboard.")
    print("2. Press ENTER to open Data Studio and start the macro.")
    print("3. DO NOT TOUCH YOUR MOUSE OR KEYBOARD until it is finished!")
    
    if "--auto" not in sys.argv:
        input("\nPress ENTER to start...")
    else:
        print("\n[AUTO-MODE] Starting automatically in 2 seconds...")
        time.sleep(1)

    # Disable pyautogui failsafe to prevent crashes during corner mouse movements
    pyautogui.FAILSAFE = False

    # Read saved user ID, email & brand if available
    import json, os, re
    player_id = ""
    player_email = ""
    player_brand = ""
    player_name = ""
    saved_wid = ""
    w_value = ""
    t_curr = "PLN"
    id_date = ""
    if os.path.exists("last_user.json"):
        try:
            with open("last_user.json", "r") as f:
                data = json.load(f)
                player_email = data.get("email", "")
                player_id = data.get("id", "")
                player_brand = data.get("brand", "")
                player_name = data.get("name", "")
                saved_wid = data.get("wallet_id", "").strip()
                saved_operator = data.get("operator", "").strip()
                w_value = data.get("w_value", "")
                t_curr = data.get("t_curr", "PLN")
                id_date = data.get("id_date", "")
        except Exception:
            pass
            
    # Step A: Switch to Playbison tab and open modal via hash navigation + DOM click
    pyautogui.hotkey('ctrl', '1')
    time.sleep(1)
    
    js_open_modal = load_macro("ds_open_modal.js", PLAYER_ID=player_id, PLAYER_EMAIL=player_email)
    
    pyperclip.copy(js_open_modal)
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.3)
    pyautogui.write('javascript:')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.3)
    pyautogui.press('enter')
    
    print("[PLAYBISON] Waiting 3.5 seconds for Payment Details modal to open...")
    time.sleep(3.5)
    
    # Step B: Extract maskedAccount + wallet_id from open modal
    # Uses getVal('wallet_id') - same proven logic as first/last name extraction.
    # wallet_id is returned via prompt so Python can open it (window.open blocked in bookmarklets).
    # Handles Operator conditions: COINSPAID (skip), PAYSAFECARD/SKRILL (skip name check), BANK WITHDRAWAL PIQ (default check)
    js_extract_macro = load_macro("ds_extract_modal.js", PLAYER_ID=player_id, PLAYER_EMAIL=player_email, PLAYER_NAME=player_name)
    
    pyperclip.copy("WAITING_FOR_PROMPT")
    pyperclip.copy(js_extract_macro)
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.3)
    pyautogui.write('javascript:')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.3)
    pyautogui.press('enter')
    
    verify_raw = ""
    for _ in range(6):
        time.sleep(0.8)
        pyautogui.hotkey('ctrl', 'c')
        time.sleep(0.3)
        clip_val = pyperclip.paste().strip()
        if clip_val and clip_val != "WAITING_FOR_PROMPT" and not clip_val.startswith("(function") and not clip_val.startswith("javascript:"):
            verify_raw = clip_val
            pyautogui.press('enter')
            break
    else:
        pyautogui.press('enter')
    
    # Chrome prompt() Ctrl+C copies the INPUT FIELD value only, not the label.
    # Format: "maskedAccount_value|WALLET:hexId"  or  "NAMEFAIL:first last|WALLET:hexId"
    
    # Extract wallet_id from response
    wallet_id = ""
    is_third_party_request = False
    modal_account_holder = ""
    wallet_id_and_rest = ""
    rest = ""

    if "|WALLET:" in verify_raw:
        parts = verify_raw.split("|WALLET:")
        verify_raw = parts[0].strip()
        wallet_id_and_rest = parts[1].strip()
        
        # Now split wallet_id from the rest
        if "|FN:" in wallet_id_and_rest:
            wid_parts = wallet_id_and_rest.split("|FN:")
            wallet_id = wid_parts[0].strip()
            rest = wid_parts[1]
        else:
            wallet_id = wallet_id_and_rest
            rest = ""
    else:
        rest = ""

    if "|THIRDPARTY:YES" in wallet_id_and_rest:
        is_third_party_request = True
    if "|ACCHOLDER:" in wallet_id_and_rest:
        try:
            ah_part = wallet_id_and_rest.split("|ACCHOLDER:")[1]
            if "|THIRDPARTY:" in ah_part:
                modal_account_holder = ah_part.split("|THIRDPARTY:")[0].strip()
            elif "|GB_IBAN:" in ah_part:
                modal_account_holder = ah_part.split("|GB_IBAN:")[0].strip()
            else:
                modal_account_holder = ah_part.strip()
        except Exception:
            pass

    is_gb_iban = False
    if "|GB_IBAN:YES" in wallet_id_and_rest or bool(re.search(r'\bGB\d{2}', verify_raw, re.I)):
        is_gb_iban = True

    # Extract fn, ln, city, op
    fn = ""
    ln = ""
    city = ""
    playbison_op = ""
    if rest:
        if "|ACCHOLDER:" in rest:
            rest = rest.split("|ACCHOLDER:")[0]
        if "|LN:" in rest:
            fn, rest = rest.split("|LN:")
            fn = fn.strip()
            if "|CITY:" in rest:
                if "|OP:" in rest:
                    ln, rest = rest.split("|CITY:")
                    ln = ln.strip()
                    city, playbison_op = rest.split("|OP:")
                    city = city.strip()
                    playbison_op = playbison_op.strip()
                else:
                    ln, city = rest.split("|CITY:")
                    ln = ln.strip()
                    city = city.strip()

    # Safety guard: PAYSAFECARD, SKRILL, COINSPAID, or null/empty account holder is never third party
    op_upper = playbison_op.upper() if playbison_op else ""
    if any(k in op_upper for k in ["PAYSAFECARD", "PAYSAFE", "SKRILL", "COINSPAID"]) or modal_account_holder.lower() in ["", "null", "undefined"]:
        is_third_party_request = False
    elif modal_account_holder and (fn or ln or player_name):
        # Cross-check accountHolder vs player name directly in Python
        import unicodedata
        def _norm(s):
            if not s: return ""
            s = unicodedata.normalize('NFD', s)
            s = "".join(c for c in s if unicodedata.category(c) != 'Mn')
            return s.replace('ł', 'l').replace('Ł', 'L').lower().strip()
        
        fn_norm = _norm(fn)
        ln_norm = _norm(ln)
        pname_norm = _norm(player_name)
        ah_norm = _norm(modal_account_holder)

        fn_words = [w for w in fn_norm.split() if len(w) > 1]
        ln_words = [w for w in ln_norm.split() if len(w) > 1]
        pname_words = [w for w in pname_norm.split() if len(w) > 1]

        fn_match = any(w in ah_norm for w in fn_words)
        ln_match = any(w in ah_norm for w in ln_words)
        pname_match = any(w in ah_norm for w in pname_words)

        name_match = fn_match or ln_match or pname_match or (ln_norm and ln_norm in ah_norm) or (fn_norm and fn_norm in ah_norm)
        if not name_match:
            is_third_party_request = True
            print(f"[PLAYBISON] ⚠️ THIRD PARTY REQUEST DETECTED: Player '{fn} {ln}' ({player_name}) vs Account Holder '{modal_account_holder}'")
        else:
            is_third_party_request = False

    # Priority 1: If table scan already grabbed the full hex wallet_id, use it directly!
    if saved_wid and len(saved_wid) > 15 and "..." not in saved_wid and not saved_wid.startswith("NOT_FOUND"):
        wallet_id = saved_wid
        print(f"[PLAYBISON] Using exact wallet_id from table scan: {wallet_id}")
    elif saved_wid and "..." in saved_wid:
        clean_prefix = saved_wid.replace("...", "").strip()
        if clean_prefix and wallet_id and not wallet_id.startswith(clean_prefix):
            print(f"[PLAYBISON] WARNING: Modal wallet_id ('{wallet_id}') mismatches scanned prefix ('{clean_prefix}'). Discarding stale modal data!")
            wallet_id = clean_prefix
            fn = ""
            ln = ""
            city = ""
    elif not wallet_id and saved_wid:
        wallet_id = saved_wid

    # Fallback to player_name from scan if fn/ln missing or mismatched
    if (not fn or not ln) and player_name and " " in player_name:
        p_parts = player_name.strip().split(None, 1)
        fn = p_parts[0]
        ln = p_parts[1] if len(p_parts) > 1 else ""
        print(f"[PLAYBISON] Using scanned player name: {fn} {ln}")
    elif player_name and (fn or ln):
        modal_name = f"{fn} {ln}".strip().lower()
        if player_name.lower().split()[-1] not in modal_name:
            print(f"[PLAYBISON] WARNING: Modal name ('{fn} {ln}') does not match scanned name ('{player_name}'). Using scanned name!")
            p_parts = player_name.strip().split(None, 1)
            fn = p_parts[0]
            ln = p_parts[1] if len(p_parts) > 1 else ""
                
    approval_status = "PENDING"
    dup_res = "NO"
    if fn and ln:
        print(f"\n[PLAYBISON] Checking duplicates for {fn} {ln} in Users list...")
        duplicates_opened = True
        webbrowser.open_new_tab("https://api-acnt.playbison.com/platform-admin/#action:admin.users")
        time.sleep(6.0)
        
        js_check_dup = load_macro("ds_check_duplicates.js", FN=fn, LN=ln, CITY=city, BRAND=player_brand)
        
        pyperclip.copy("WAITING_FOR_DUP")
        pyperclip.copy(js_check_dup)
        pyautogui.hotkey('ctrl', 'l')
        time.sleep(0.3)
        pyautogui.write('javascript:')
        time.sleep(0.2)
        pyautogui.hotkey('ctrl', 'v')
        time.sleep(0.3)
        pyautogui.press('enter')
        
        dup_res = ""
        for _ in range(12):
            time.sleep(1.0)
            pyautogui.hotkey('ctrl', 'c')
            time.sleep(0.3)
            clip_val = pyperclip.paste().strip()
            if clip_val and clip_val != "WAITING_FOR_DUP" and not clip_val.startswith("(function") and not clip_val.startswith("javascript:"):
                dup_res = clip_val
                pyautogui.press('enter')
                break
        else:
            pyautogui.press('enter')
            
        if dup_res == "YES":
            print(f"\n\n{'='*60}\n[WARNING] MULTIPLE ACCOUNTS FOUND FOR {fn} {ln}!!!\n{'='*60}\n")
            approval_status = "Review (Duplicates)"
        elif dup_res == "NO":
            print(f"\n\n{'='*60}\n[WARNING] MULTIPLE ACCOUNTS VERIFIED FOR {ln} {city}!!!\n{'='*60}\n")
            approval_status = "Review (Match)"
        else:
            print(f"[PLAYBISON] No duplicate accounts found for {fn} {ln}.")
            approval_status = "Approve"
            
        # Close Duplicates tab immediately
        if duplicates_opened:
            print("[PLAYBISON] Closing Duplicates tab...")
            pyautogui.hotkey('ctrl', 'w')
            time.sleep(0.3)
            duplicates_opened = False
    
    # Detect name mismatch errors
    is_error = verify_raw.startswith("NAMEFAIL:") or "not found in request data" in verify_raw.lower() or verify_raw.startswith("NOTFOUND")
    
    if verify_raw == "COINSPAID_SKIP":
        print(f"\n[PLAYBISON] Operator is COINSPAID. No copy required.")
    elif is_error:
        print(f"\n[PLAYBISON] Name mismatch or error: {verify_raw}")
        approval_status = "Error (Name Mismatch)"

    
    url = "https://datastudio.google.com/u/0/reporting/83ab6a98-d02b-4d39-b793-c17189710132/page/ewQiF"
    datastudio_opened = True
    webbrowser.open_new_tab(url)
    
    print("\nWaiting 9 seconds for Data Studio to fully load...")
    time.sleep(9)
    
    print("Executing Phase 1: Switching to Bison BO and focusing Email...")
    email_to_paste = player_email.strip().lower() if player_email else pyperclip.paste().strip().lower()
    
    # Macro 1: Switch to Bison BO and focus the precise <input> box
    js_macro_1 = load_macro("ds_switch_email.js")
    
    pyperclip.copy(js_macro_1)
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.5)
    pyautogui.write('javascript:')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)
    pyautogui.press('enter')
    
    time.sleep(2) # Wait for javascript macro to finish clicking and focusing
    
    print("Typing the email using simulated keystrokes...")
    pyautogui.hotkey('ctrl', 'a')
    time.sleep(0.1)
    pyautogui.press('backspace')
    time.sleep(0.1)
    # RESTORE THE EMAIL TO THE CLIPBOARD!
    pyperclip.copy(email_to_paste)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)
    pyautogui.press('enter')
    time.sleep(1)
    
    print("Executing Phase 2: Opening the Date Picker...")
    # Macro 2: Open Date Picker (using simple point click)
    js_macro_2 = load_macro("ds_open_date_picker.js")

    pyperclip.copy(js_macro_2)
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.5)
    pyautogui.write('javascript:')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)
    pyautogui.press('enter')
    
    print("Waiting for Date Picker to open...")
    time.sleep(1.5)
    
    print("Executing Phase 3: Setting the Date Range (61 days ago -> today)...")
    end_wd = datetime.datetime.now(datetime.timezone.utc).date()
    start_wd = end_wd - datetime.timedelta(days=61)
    print(f"[DATASTUDIO] W/D UTC range: {start_wd} -> {end_wd}")
    js_macro_3 = load_macro(
        "ds_set_date_range.js",
        START_DATE=start_wd.strftime("%Y-%m-%d"),
        END_DATE=end_wd.strftime("%Y-%m-%d"),
    )
    
    pyperclip.copy(js_macro_3)
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.5)
    pyautogui.write('javascript:')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)
    pyautogui.press('enter')
    
    print("\nWaiting 8 seconds for Data Studio report table to update...")
    time.sleep(8)
    
    print("Executing Phase 4: Checking W/D ratio (volumes)...")
    # Macro 4: Read W/D ratio (volumes) from Data Studio table using robust multi-tier search
    js_macro_4 = load_macro("ds_read_wd_ratio.js")

    # Retry loop: if page hasn't loaded yet (NO_DATA), retry up to 3 times
    MAX_RATIO_RETRIES = 3
    ratio_raw = ""
    for ratio_attempt in range(1, MAX_RATIO_RETRIES + 1):
        pyperclip.copy("WAITING_RATIO")
        pyperclip.copy(js_macro_4)
        pyautogui.hotkey('ctrl', 'l')
        time.sleep(0.3)
        pyautogui.write('javascript:')
        time.sleep(0.2)
        pyautogui.hotkey('ctrl', 'v')
        time.sleep(0.3)
        pyautogui.press('enter')
        
        time.sleep(1.5)
        ratio_raw = pyperclip.paste().strip()
        if ratio_raw.startswith("(function") or ratio_raw == "WAITING_RATIO":
            time.sleep(1.0)
            ratio_raw = pyperclip.paste().strip()
        
        print(f"\n[DATASTUDIO] Raw W/D ratio text: '{ratio_raw}' (attempt {ratio_attempt}/{MAX_RATIO_RETRIES})")
        
        # If we got actual data (not NO_DATA and not JS code), break out of retry loop
        raw_check = ratio_raw.upper()
        if "NO_DATA" not in raw_check and "NO DATA" not in raw_check and not ratio_raw.startswith("(function"):
            break
        
        # NO_DATA -> page might still be loading, retry after waiting
        if ratio_attempt < MAX_RATIO_RETRIES:
            print(f"[DATASTUDIO] Page may still be loading. Waiting 5 seconds before retry...")
            time.sleep(5)
        else:
            print(f"[DATASTUDIO] Still NO_DATA after {MAX_RATIO_RETRIES} attempts. Treating as new account (0%).")

    if ratio_raw == "MULTIBRAND":
        print(f"[DATASTUDIO] Multibrand (2+ rows) detected. Selecting '{player_brand}' in Brand filter...")
        js_macro_brand = load_macro("ds_brand_filter.js", TARGET_BRAND=player_brand)
        
        pyperclip.copy("WAITING_FILTER")
        pyperclip.copy(js_macro_brand)
        pyautogui.hotkey('ctrl', 'l')
        time.sleep(0.3)
        pyautogui.write('javascript:')
        time.sleep(0.2)
        pyautogui.hotkey('ctrl', 'v')
        time.sleep(0.3)
        pyautogui.press('enter')
        
        time.sleep(3.0)
        filter_status = pyperclip.paste().strip()
        print(f"[DATASTUDIO] Brand filter status: '{filter_status}'")
        
        print("[DATASTUDIO] Waiting 5 seconds for filtered data to load...")
        time.sleep(5.0)
        
        print(f"[DATASTUDIO] Re-checking W/D ratio for {player_brand.capitalize()}...")
        pyperclip.copy("WAITING_RATIO")
        pyperclip.copy(js_macro_4)
        pyautogui.hotkey('ctrl', 'l')
        time.sleep(0.3)
        pyautogui.write('javascript:')
        time.sleep(0.2)
        pyautogui.hotkey('ctrl', 'v')
        time.sleep(0.3)
        pyautogui.press('enter')
        
        time.sleep(1.5)
        ratio_raw = pyperclip.paste().strip()
        if ratio_raw.startswith("(function") or ratio_raw == "WAITING_RATIO":
            time.sleep(1.0)
            ratio_raw = pyperclip.paste().strip()
        print(f"[DATASTUDIO] New Raw W/D ratio text: '{ratio_raw}'")
    
    # Parse ratio float
    is_no_data = False
    ratio_val = None
    if ratio_raw:
        raw_upper = ratio_raw.upper()
        if "NO_DATA" in raw_upper or "NO DATA" in raw_upper:
            is_no_data = True
            ratio_val = 0.0
            ratio_raw = "0%"
            print("[DATASTUDIO] No data in Data Studio report (new account). Ratio set to 0.0%.")
        elif "HEADER_NOT_FOUND" not in raw_upper:
            cleaned = ratio_raw.replace('%', '').replace(',', '.').strip()
            match = re.search(r'[-+]?\d*\.?\d+', cleaned)
            if match:
                try:
                    ratio_val = float(match.group())
                except ValueError:
                    pass

    if ratio_val is None:
        print("[DATASTUDIO] Could not determine W/D ratio automatically. Defaulting to 0.0% (manual check).")
        ratio_val = 0.0

    if ratio_val is not None:
        print(f"[DATASTUDIO] Parsed W/D ratio: {ratio_val}%")
        if True:
            if ratio_val >= 25.0:
                print(f"\n[DATASTUDIO] W/D ratio is {ratio_val}% (>= 25%)! Proceeding with flow (Approval status: 'W/d ratio > 25%').")
            else:
                print(f"\n[DATASTUDIO] W/D ratio is {ratio_val}% (< 25%)! Proceeding to Playbison for manual cancellation check!")
            
            # Close Data Studio tab immediately before opening wallet
            if datastudio_opened:
                print("[DATASTUDIO] Closing Data Studio tab...")
                pyautogui.hotkey('ctrl', 'w')
                time.sleep(0.3)
                datastudio_opened = False
                
            print(f"[DATASTUDIO] Opening wallet page for '{player_email or player_id}'...")
            
            # Open wallet_id in new tab regardless of match result
            if (not wallet_id or wallet_id == "NOTFOUND" or "..." in wallet_id) and saved_wid and len(saved_wid) > 10 and "..." not in saved_wid:
                wallet_id = saved_wid
            elif not wallet_id and player_id:
                wallet_id = player_id

            if wallet_id:
                wallet_url = f"https://api-acnt.playbison.com/platform-admin/#action:admin.user:{wallet_id}"
                print(f"[PLAYBISON] Opening wallet_id in new tab: {wallet_url}")
                wallet_opened = True
                webbrowser.open_new_tab(wallet_url)
                
                print("[PLAYBISON] Waiting 7 seconds for wallet page to load to open notes...")
                time.sleep(5.0)
                
                # Extract the correct Player ID and Name from the wallet page
                js_extract_player_id = load_macro("ds_extract_player_id.js")
                pyperclip.copy('WAITING_FOR_ID')
                pyperclip.copy(js_extract_player_id)
                pyautogui.hotkey('ctrl', 'l')
                time.sleep(0.3)
                pyautogui.write('javascript:')
                time.sleep(0.2)
                pyautogui.hotkey('ctrl', 'v')
                time.sleep(0.3)
                pyautogui.press('enter')
                
                time.sleep(1.2)
                clipboard_res = pyperclip.paste().strip()
                true_player_name = ""
                # Verify clipboard is NOT the injected JS code itself or waiting flag
                if (clipboard_res and 
                    clipboard_res != "WAITING_FOR_ID" and 
                    not clipboard_res.startswith("(function") and 
                    not "document.createElement" in clipboard_res):
                    
                    if "|NAME:" in clipboard_res:
                        parts = clipboard_res.split("|NAME:")
                        cand_id = parts[0].strip()
                        if cand_id.isdigit():
                            true_player_id = cand_id
                        true_player_name = parts[1].strip()
                    elif clipboard_res.isdigit():
                        true_player_id = clipboard_res

                if true_player_id and true_player_id.isdigit():
                    # Cross-check extracted name against expected scanned player_name
                    if player_name and true_player_name:
                        scan_last = player_name.strip().split()[-1].lower()
                        wallet_last = true_player_name.strip().split()[-1].lower()
                        if scan_last not in true_player_name.lower() and wallet_last not in player_name.lower():
                            print(f"[PLAYBISON] WARNING: Wallet page extracted name ('{true_player_name}') does not match expected player ('{player_name}'). Keeping scanned player name!")
                            true_player_name = player_name
                            true_player_id = player_id
                    print(f"[PLAYBISON] Extracted true Player ID from wallet page: {true_player_id} (Name: {true_player_name})")
                else:
                    print(f"[PLAYBISON] Warning: Could not extract true Player ID. Falling back to transaction ID.")
                    true_player_id = player_id
                    if not true_player_name and player_name:
                        true_player_name = player_name

                
                # Step 1: Open Notes Tab
                js_notes_macro = load_macro("ds_open_notes.js")
                pyperclip.copy(js_notes_macro)
                pyautogui.hotkey('ctrl', 'l')
                time.sleep(0.3)
                pyautogui.write('javascript:')
                time.sleep(0.2)
                pyautogui.hotkey('ctrl', 'v')
                time.sleep(0.3)
                pyautogui.press('enter')
                print("[PLAYBISON] Opened Notes tab.")
                
                print("[PLAYBISON] Waiting 5 seconds for notes data to load...")
                time.sleep(5.0)

                # Step 1.5: Check top note for "req" or "rem" keyword
                print("[PLAYBISON] Checking Notes tab data (waiting for table to load)...")
                js_check_notes = load_macro("ds_check_notes.js")
                
                notes_have_req = False
                has_doc_req = False
                mistral_failed = False
                note_txt = ""          # Top note text (safe default to avoid UnboundLocalError)
                top_note_date = ""     # Created date of top note
                notes_cc_ver = False   # True if notes tab already has 'cc ver' recorded
                notes_cc_ver_90 = False # True if CC verified in notes within last 90 days (3 months)
                notes_iban_ver = False  # True if IBAN verified in notes within last 90 days
                notes_has_payment_notes = False  # True if payment/important notes exist
                # Inject Notes check macro once
                pyperclip.copy("WAITING_FOR_NOTES")
                pyperclip.copy(js_check_notes)
                pyautogui.hotkey('ctrl', 'l')
                time.sleep(0.3)
                pyautogui.write('javascript:')
                time.sleep(0.2)
                pyautogui.hotkey('ctrl', 'v')
                time.sleep(0.3)
                pyautogui.press('enter')

                # Poll clipboard for notes result
                for i in range(25):
                    time.sleep(1.0)
                    clip_val = pyperclip.paste().strip()
                    if clip_val.startswith("REQ_FOUND:"):
                        res_part = clip_val.replace("REQ_FOUND:", "")
                        if "|" in res_part:
                            parts = res_part.split("|")
                            note_txt = parts[1].replace("TEXT:", "") if len(parts) > 1 else ""
                            # Parse optional |TOP_NOTE_DATE:, |CC_VER:, |CC_VER_90:, |IBAN_VER:, and |PAYMENT_NOTES: fields
                            for p in parts[2:]:
                                if p.startswith("TOP_NOTE_DATE:"):
                                    top_note_date = p.replace("TOP_NOTE_DATE:", "").strip()
                                elif p.startswith("CC_VER:"):
                                    notes_cc_ver = p.replace("CC_VER:", "").strip() == "YES"
                                elif p.startswith("CC_VER_90:"):
                                    notes_cc_ver_90 = p.replace("CC_VER_90:", "").strip() == "YES"
                                elif p.startswith("IBAN_VER:"):
                                    notes_iban_ver = p.replace("IBAN_VER:", "").strip() == "YES"
                                elif p.startswith("PAYMENT_NOTES:"):
                                    notes_has_payment_notes = p.replace("PAYMENT_NOTES:", "").strip() == "YES"
                            if note_txt != "NOTES_NOT_FOUND":
                                if parts[0] == "YES":
                                    notes_have_req = True
                                print(f"[PLAYBISON] Checked top note: '{note_txt}' (Date: {top_note_date}, Verify docs: {notes_have_req}, CC verified: {notes_cc_ver}, IBAN verified: {notes_iban_ver}, Payment/Important notes: {notes_has_payment_notes})")
                                break
                    elif i == 10:
                        # Fallback: re-inject if taking longer than 10 seconds
                        print("[PLAYBISON] Notes scan still pending, re-injecting check macro...")
                        pyperclip.copy("WAITING_FOR_NOTES")
                        pyperclip.copy(js_check_notes)
                        pyautogui.hotkey('ctrl', 'l')
                        time.sleep(0.3)
                        pyautogui.write('javascript:')
                        time.sleep(0.2)
                        pyautogui.hotkey('ctrl', 'v')
                        time.sleep(0.3)
                        pyautogui.press('enter')

                if notes_have_req:
                    print("[PLAYBISON] Keyword 'req' or 'rem' detected in top note, but document checking is disabled for LOOP mode. Skipping Mistral.")
                    
                if False: # Bypass for loop mode
                    print("[PLAYBISON] Keyword 'req' detected in notes! Opening Documents tab...")
                    js_docs_macro = load_macro("ds_open_documents.js")
                    pyperclip.copy(js_docs_macro)
                    pyautogui.hotkey('ctrl', 'l')
                    time.sleep(0.3)
                    pyautogui.write('javascript:')
                    time.sleep(0.2)
                    pyautogui.hotkey('ctrl', 'v')
                    time.sleep(0.3)
                    pyautogui.press('enter')
                    print("[PLAYBISON] Waiting 7 seconds on Documents tab for inspection...")
                    time.sleep(7.0)
                    
                    print("[PLAYBISON] Checking for 'In progress' documents...")
                    js_open_doc = load_macro("ds_open_in_progress_doc.js")
                    pyperclip.copy(js_open_doc)
                    pyautogui.hotkey('ctrl', 'l')
                    time.sleep(0.3)
                    pyautogui.write('javascript:')
                    time.sleep(0.2)
                    pyautogui.hotkey('ctrl', 'v')
                    time.sleep(0.3)
                    pyautogui.press('enter')
                    
                    time.sleep(1.5) # Give it time to click and copy result
                    clip_val = pyperclip.paste().strip()
                    if clip_val == "DOC_OPENED:YES":
                        print("\n" + "="*60)
                        print("⚠️ AN 'IN PROGRESS' DOCUMENT IS OPEN!")
                        print(f"Note context to verify: '{note_txt}'")
                        print("="*60 + "\n")
                        
                        # Use sound alert to notify user
                        try:
                            import winsound
                            winsound.Beep(1000, 500)
                        except:
                            pass
                            
                        print("[PLAYBISON] Taking screenshot of the document in 2 seconds...")
                        time.sleep(2.0)
                        try:
                            import base64
                            import io
                            import requests
                            
                            img = pyautogui.screenshot()
                            buf = io.BytesIO()
                            img.save(buf, format='JPEG', quality=70)
                            b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
                            
                            print("[PLAYBISON] Verifying document via Mistral AI...")
                            r = requests.post('https://api.mistral.ai/v1/chat/completions', 
                                headers={'Authorization': 'Bearer wMV2n0FvKzyQYqiiBlGXHVlNKpiQCWJD', 'Content-Type': 'application/json'},
                                json={
                                    'model': 'pixtral-12b-2409',
                                    'messages': [
                                        {
                                            'role': 'user', 
                                            'content': [
                                                {'type': 'text', 'text': f"This is a screenshot of a user's uploaded document for payment verification.\n1. Check if the name on the document matches (or closely matches) the user's name: '{true_player_name}'.\n2. Check if the payment details in the document match the requirements in this note: '{note_txt}'. (For example, if the note mentions an IBAN or a credit card number, verify it appears in the document).\n\nReply ONLY with YES or NO, followed by a very brief explanation of what you found."},
                                                {'type': 'image_url', 'image_url': {'url': f'data:image/jpeg;base64,{b64}'}}
                                            ]
                                        }
                                    ]
                                }
                            )
                            resp = r.json()
                            ai_msg = resp['choices'][0]['message']['content']
                            print(f"\n[MISTRAL AI VERIFICATION]:\n{ai_msg}\n")
                            
                            if ai_msg.strip().upper().startswith("NO"):
                                print("[PLAYBISON] Verification FAILED! Please check manually.")
                                mistral_failed = True
                                input("Press ENTER when you are ready to continue...")
                            else:
                                print("[PLAYBISON] Verification PASSED! Automatically continuing in 3 seconds...")
                                time.sleep(3.0)
                        except Exception as e:
                            print(f"[PLAYBISON] Mistral API failed: {e}")
                            input("Press ENTER when you have verified the details and are ready to continue...")
                        
                        print("[PLAYBISON] Resuming automation flow...")
                        
                        # Switch focus back to Chrome if they clicked away to the terminal
                        print("[PLAYBISON] Switching back to Chrome in 3 seconds...")
                        time.sleep(3.0)

                # Step 2: Transactions & Stack Check macro
                js_trans_macro = load_macro("ds_check_transactions.js")
                js_trans_macro = js_trans_macro.replace("###TCURR###", t_curr)
                pyperclip.copy("WAITING_FOR_TRANS")
                pyperclip.copy(js_trans_macro)
                pyautogui.hotkey('ctrl', 'l')
                time.sleep(0.3)
                pyautogui.write('javascript:')
                time.sleep(0.2)
                pyautogui.hotkey('ctrl', 'v')
                time.sleep(0.3)
                pyautogui.press('enter')
                print("[PLAYBISON] Executing Transactions & Stack Check Macro...")
                
                print("[PLAYBISON] Waiting for transactions check & multi-page stack pagination...")
                trans_result = ""
                for _ in range(90):
                    pyautogui.hotkey('ctrl', 'c')
                    time.sleep(1.0)
                    clip_val = pyperclip.paste().strip()
                    if clip_val and clip_val.startswith("TRANS_RESULT:"):
                        trans_result = clip_val.replace("TRANS_RESULT:", "").strip()
                        stack_date = ""
                        if "|STACK_DATE:" in trans_result:
                            parts = trans_result.split("|STACK_DATE:")
                            trans_result = parts[0].strip()
                            stack_date = parts[1].strip()

                        if trans_result in ["NO_STACK", "AUTOMATIC", "NO_TRANSACTIONS_TAB", "NO_DATE_INPUT"]:
                            print(f"[PLAYBISON] No stack found ({trans_result}). Continuing flow automatically...")
                            if trans_result == "NO_TRANSACTIONS_TAB":
                                # Wallet page likely didn't load properly — wait extra and
                                # re-open Notes tab to force page interaction before Payment Log
                                print("[PLAYBISON] ⚠️ Transactions tab not found (possible slow page load / network issue).")
                                print("[PLAYBISON] Waiting 4 extra seconds for wallet page to fully render...")
                                time.sleep(4.0)
                                # Re-open Notes tab to verify the page is alive
                                js_notes_retry = load_macro("ds_open_notes.js")
                                pyperclip.copy(js_notes_retry)
                                pyautogui.hotkey('ctrl', 'l')
                                time.sleep(0.3)
                                pyautogui.write('javascript:')
                                time.sleep(0.2)
                                pyautogui.hotkey('ctrl', 'v')
                                time.sleep(0.3)
                                pyautogui.press('enter')
                                print("[PLAYBISON] Re-opened Notes tab. Waiting 3 seconds...")
                                time.sleep(3.0)
                            break
                        elif trans_result.startswith("EXCEEDS_5_PAGES"):
                            dates_str = trans_result.split("|")[1] if "|" in trans_result else ""
                            print(f"\n{'='*60}\n[PLAYBISON] ⚠️ OVER 5 PAGES OF TRANSACTIONS FOUND!\nFound Stack Dates on Page 1: {dates_str}\n{'='*60}\n")
                            
                            analytics_url = "https://playbison-analytics.web.app/reports/violating-transactions"
                            print(f"[PLAYBISON] Opening Analytics Platform: {analytics_url}")
                            analytics_opened = True
                            webbrowser.open_new_tab(analytics_url)
                            print("[PLAYBISON] Waiting 8 seconds for Analytics to load...")
                            time.sleep(8.0)
                            
                            print(f"[PLAYBISON] Pasting Wallet ID: {wallet_id}")
                            js_analytics = f"""(function(){{
                                let inputs = Array.from(document.querySelectorAll('input'));
                                let inp = inputs.find(i => (i.placeholder||'').toLowerCase().includes('walletid') || (i.name||'').toLowerCase().includes('wallet'));
                                if (!inp) inp = inputs[0];
                                if (inp) {{
                                    let s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                                    if (s) s.call(inp, '{wallet_id}'); else inp.value = '{wallet_id}';
                                    inp.dispatchEvent(new Event('input', {{bubbles: true}}));
                                    
                                    setTimeout(() => {{
                                      let btns = Array.from(document.querySelectorAll('button'));
                                      let searchBtn = btns.find(b => (b.textContent||'').toLowerCase().includes('search'));
                                      if (searchBtn) searchBtn.click();
                                    }}, 500);
                                }}
                            }})();"""
                            js_analytics_min = js_analytics.replace('\n', ' ').replace('\r', '')
                            pyperclip.copy(js_analytics_min)
                            time.sleep(0.5)
                            pyautogui.hotkey('ctrl', 'l')
                            time.sleep(0.3)
                            pyautogui.write('javascript:')
                            time.sleep(0.2)
                            pyautogui.hotkey('ctrl', 'v')
                            time.sleep(0.3)
                            pyautogui.press('enter')
                            
                            print("[PLAYBISON] Waiting 10 seconds for Analytics data to load...")
                            time.sleep(10.0)
                            
                            print("[PLAYBISON] Injecting macro to scrape Analytics dates...")
                            js_scrape = load_macro("ds_analytics_scrape.js")
                            pyperclip.copy("WAITING_FOR_ANALYTICS")
                            pyperclip.copy(js_scrape)
                            time.sleep(0.5)
                            pyautogui.hotkey('ctrl', 'l')
                            time.sleep(0.3)
                            pyautogui.write('javascript:')
                            time.sleep(0.2)
                            pyautogui.hotkey('ctrl', 'v')
                            time.sleep(0.3)
                            pyautogui.press('enter')
                            
                            analytics_dates_str = ""
                            for _ in range(15):
                                pyautogui.hotkey('ctrl', 'c')
                                time.sleep(1.0)
                                clip_val = pyperclip.paste().strip()
                                if clip_val and clip_val.startswith("ANALYTICS_DATES:"):
                                    analytics_dates_str = clip_val.replace("ANALYTICS_DATES:", "").strip()
                                    break
                            
                            if not analytics_dates_str or analytics_dates_str == "NO_DATES_FOUND" or analytics_dates_str.startswith("ERROR"):
                                print(f"[PLAYBISON] Failed to extract dates from Analytics: {analytics_dates_str}")
                                cleanup_tabs(sheets_opened, analytics_opened, wallet_opened, datastudio_opened, duplicates_opened)
                                sys.exit(1)
                            
                            print("[PLAYBISON] Successfully extracted dates from Analytics.")
                            dates_list = analytics_dates_str.split(',')
                            
                            # Parse the original stack dates from the Playbison transactions tab
                            # (These are the dates from rows with empty 'note' field)
                            stack_dates = [d.strip() for d in dates_str.split(',') if d.strip()]
                            stack_days = set()
                            for sd in stack_dates:
                                sd_clean = sd.replace('Z', '').strip()
                                try:
                                    dt = datetime.datetime.strptime(sd_clean, "%Y-%m-%dT%H:%M:%S")
                                    stack_days.add(dt.date())
                                except Exception:
                                    pass
                            
                            print(f"[PLAYBISON] Stack dates from Playbison: {stack_dates}")
                            print(f"[PLAYBISON] Stack days to match in Analytics: {stack_days}")
                            
                            # Parse ALL Analytics dates first
                            all_analytics_dates = []
                            for ds in dates_list:
                                try:
                                    dt = datetime.datetime.strptime(ds.strip(), "%Y-%m-%dT%H:%M:%S")
                                    all_analytics_dates.append(dt)
                                except Exception:
                                    pass
                            
                            if stack_days:
                                # Filter Analytics dates to only those matching the stack days from Playbison
                                parsed_dates = [dt for dt in all_analytics_dates if dt.date() in stack_days]
                                print(f"[PLAYBISON] Filtered to {len(parsed_dates)} Analytics dates matching stack days: {stack_days}")
                            else:
                                # JS couldn't find empty-note rows — fallback:
                                # Use only the MOST RECENT day from Analytics
                                if all_analytics_dates:
                                    most_recent_day = max(dt.date() for dt in all_analytics_dates)
                                    parsed_dates = [dt for dt in all_analytics_dates if dt.date() == most_recent_day]
                                    print(f"[PLAYBISON] Stack days empty — using most recent Analytics day: {most_recent_day} ({len(parsed_dates)} dates)")
                                else:
                                    parsed_dates = []
                            
                            if not parsed_dates:
                                print("[PLAYBISON] Could not parse any valid dates.")
                                cleanup_tabs(sheets_opened, analytics_opened, wallet_opened, datastudio_opened, duplicates_opened)
                                sys.exit(1)
                                
                            min_date = min(parsed_dates)
                            max_date = max(parsed_dates)
                            
                            # Apply 1 minute adjustment (subtract 1 min from start, add 1 min to end)
                            adjusted_start = min_date - datetime.timedelta(minutes=1)
                            adjusted_end = max_date + datetime.timedelta(minutes=1)
                            
                            # Format for Playbison Date Picker (YYYY-MM-DD HH:MM)
                            start_str = adjusted_start.strftime("%Y-%m-%d %H:%M")
                            end_str = adjusted_end.strftime("%Y-%m-%d %H:%M")
                            
                            print(f"\n{'='*60}\n[ANALYTICS] Matched {len(parsed_dates)} dates for stack days {stack_days}:\nDate From: {start_str}\nDate To:   {end_str}\n{'='*60}\n")
                            
                            print("[PLAYBISON] Closing Analytics tab to return to Playbison tab...")
                            pyautogui.hotkey('ctrl', 'w')   # close Analytics tab → Chrome auto-focuses prev tab
                            analytics_opened = False
                            time.sleep(2.0)
                            
                            print("[PLAYBISON] Injecting macro to set Playbison Date filters...")
                            js_set_dates = load_macro("ds_set_transaction_dates.js", DATE_FROM=start_str, DATE_TO=end_str)
                            pyperclip.copy("WAITING_FOR_SET_DATES")
                            pyperclip.copy(js_set_dates)
                            time.sleep(0.5)
                            pyautogui.hotkey('ctrl', 'l')
                            time.sleep(0.3)
                            pyautogui.write('javascript:')
                            time.sleep(0.2)
                            pyautogui.hotkey('ctrl', 'v')
                            time.sleep(0.3)
                            pyautogui.press('enter')
                            
                            for _ in range(5):
                                pyautogui.hotkey('ctrl', 'c')
                                time.sleep(1.0)
                                clip_val = pyperclip.paste().strip()
                                if clip_val and clip_val.startswith("SET_DATES:"):
                                    print(f"[PLAYBISON] Date Set Result: {clip_val}")
                                    break
                            
                            print("\n[PLAYBISON] Waiting for stack check result (dates set, search clicked, checking all pages)...")
                            stack_result = ""
                            for i in range(60):  # wait up to 60 seconds
                                pyautogui.hotkey('ctrl', 'c')
                                time.sleep(1.0)
                                clip_val = pyperclip.paste().strip()
                                
                                if i % 10 == 0 or clip_val.startswith("SET_DATES:") or clip_val.startswith("TRANS_RESULT:"):
                                    print(f"   -> [Clipboard poll {i}/60]: {clip_val[:100]}")
                                    
                                if clip_val and clip_val.startswith("TRANS_RESULT:"):
                                    stack_result = clip_val.replace("TRANS_RESULT:", "").strip()
                                    break
                            
                            if stack_result in ("NO_STACK", ""):
                                print(f"\n{'='*60}\n✅ NO STACK FOUND in filtered date range.\n{'='*60}\n")
                            elif stack_result:
                                print(f"\n{'='*60}\n⚠️ STACK FOUND:\n{stack_result}\n{'='*60}\n")
                            else:
                                print("[PLAYBISON] Timed out waiting for stack check result.")
                            
                            # Forward the result to the main flow logic so it gets logged in Google Sheets
                            trans_result = stack_result
                            if not trans_result or trans_result == "NO_STACK":
                                trans_result = "NO_STACK"
                            time.sleep(3.0)
                        else:
                            print(f"\n{'='*60}\n[PLAYBISON] ⚠️ STACK TRANSACTIONS FOUND:\n{trans_result}\n{'='*60}\n")
                            
                            if stack_date:
                                stack_date_ymd = stack_date.split("T")[0] if "T" in stack_date else stack_date.split(" ")[0]
                                print(f"[PLAYBISON] Stack Date: {stack_date_ymd}. Switching to Bonuses tab to extract Bonus Name...")
                                
                                # ── Phase 1: Click the Bonuses tab directly ───────────
                                js_open_bonuses = load_macro("ds_open_bonuses.js")
                                pyperclip.copy(js_open_bonuses)
                                pyautogui.hotkey('ctrl', 'l')
                                time.sleep(0.3)
                                pyautogui.write('javascript:')
                                time.sleep(0.2)
                                pyautogui.hotkey('ctrl', 'v')
                                time.sleep(0.3)
                                pyautogui.press('enter')
                                print("[PLAYBISON] Bonuses tab clicked. Waiting 4 seconds for bonus tables to load...")
                                time.sleep(4.0)

                                # ── Phase 2: Inject scan-only macro ──────────────────────────
                                js_bonus = load_macro("ds_extract_bonus.js", STACK_DATE=stack_date)

                                pyperclip.copy(js_bonus)
                                pyautogui.hotkey('ctrl', 'l')
                                time.sleep(0.3)
                                pyautogui.write('javascript:')
                                time.sleep(0.2)
                                pyautogui.hotkey('ctrl', 'v')
                                time.sleep(0.3)
                                pyautogui.press('enter')
                                
                                # Clear clipboard immediately so we don't accidentally re-read the JS source code
                                pyperclip.copy("__WAITING_BONUS__")

                                print("[PLAYBISON] Extracting Bonus Name (scanning up to 15 pages)...")
                                bonus_name = ""
                                for _ in range(60):
                                    time.sleep(1.0)
                                    pyautogui.hotkey('ctrl', 'c')
                                    time.sleep(0.2)
                                    clip_val = pyperclip.paste().strip()
                                    if clip_val.startswith("BONUS_RESULT:"):
                                        res_val = clip_val.replace("BONUS_RESULT:", "").strip()
                                        if res_val and not res_val.startswith("(function") and not res_val.startswith("function") and "{" not in res_val:
                                            bonus_name = res_val
                                        pyautogui.press('enter')
                                        break
                                    elif clip_val and not clip_val.startswith("__WAITING") and not clip_val.startswith("javascript") and not clip_val.startswith("DEP_OP") and not clip_val.startswith("(function") and "{" not in clip_val:
                                        if any(k in clip_val for k in ["AFF_", "Treasure", "VIP_", "NDB", "BONUS", "FB", "FS", "Reload", "Free"]):
                                            bonus_name = clip_val.replace("BONUS_RESULT:", "").strip()
                                            pyautogui.press('enter')
                                            break
                                
                                if bonus_name and not bonus_name.startswith("NOT_FOUND") and not bonus_name.startswith("(function") and len(bonus_name) < 100:
                                    print(f"[PLAYBISON] ✅ Found Bonus Name: {bonus_name}")
                                    trans_result = trans_result + f" | Bonus: {bonus_name}"
                                else:
                                    print(f"[PLAYBISON] ⚠️ No matching bonus found for date {stack_date_ymd}.")
                            
                            time.sleep(3.0)
                        break
                else:
                    print("[PLAYBISON] Timeout or completed waiting for transactions macro, proceeding...")
                
                js_payment_log_macro = load_macro("ds_payment_log.js")
                pyperclip.copy(js_payment_log_macro)
                pyautogui.hotkey('ctrl', 'l')
                time.sleep(0.3)
                pyautogui.write('javascript:')
                time.sleep(0.2)
                pyautogui.hotkey('ctrl', 'v')
                time.sleep(0.3)
                pyautogui.press('enter')
                print("[PLAYBISON] Switched to Payment Log, selected Pending/Completed, and clicked Search.")
                
                # If we had NO_TRANSACTIONS_TAB, the page was slow — give extra time for Payment Log
                if trans_result == "NO_TRANSACTIONS_TAB":
                    pay_log_wait = 10.0
                    print(f"[PLAYBISON] Waiting {pay_log_wait} seconds for Payment Log (extended due to slow page load)...")
                else:
                    pay_log_wait = 6.5
                    print(f"[PLAYBISON] Waiting {pay_log_wait} seconds for status selection + search results to load...")
                time.sleep(pay_log_wait)
                
                # Extract the last deposit ID from the Payment Log
                js_get_last_deposit = load_macro("ds_get_last_deposit.js")
                pyperclip.copy('WAITING')
                pyperclip.copy(js_get_last_deposit)
                pyautogui.hotkey('ctrl', 'l')
                time.sleep(0.3)
                pyautogui.write('javascript:')
                time.sleep(0.2)
                pyautogui.hotkey('ctrl', 'v')
                time.sleep(0.3)
                pyautogui.press('enter')
                
                # Poll clipboard in a retry loop (up to ~15 seconds) instead of a single 2s wait
                # This handles cases where the page loads slowly (e.g. after NO_TRANSACTIONS_TAB)
                payment_log_val = ""
                for pay_poll in range(15):
                    time.sleep(1.0)
                    pyautogui.hotkey('ctrl', 'c')
                    time.sleep(0.3)
                    clip_check = pyperclip.paste().strip()
                    if clip_check and clip_check.startswith("DEP_OP:"):
                        payment_log_val = clip_check
                        print(f"[PLAYBISON] Payment Log data received (poll {pay_poll + 1}/15).")
                        break
                    elif pay_poll == 4:
                        # After 5 seconds, re-inject the macro in case it failed silently
                        print("[PLAYBISON] No payment log data yet, re-injecting ds_get_last_deposit.js...")
                        pyperclip.copy('WAITING')
                        pyperclip.copy(js_get_last_deposit)
                        pyautogui.hotkey('ctrl', 'l')
                        time.sleep(0.3)
                        pyautogui.write('javascript:')
                        time.sleep(0.2)
                        pyautogui.hotkey('ctrl', 'v')
                        time.sleep(0.3)
                        pyautogui.press('enter')
                else:
                    payment_log_val = pyperclip.paste().strip()
                    print(f"[PLAYBISON] Payment Log poll timed out. Last clipboard: '{payment_log_val[:80]}'")
                last_deposit_op = "NOT_FOUND"
                withdrawal_op = playbison_op
                has_doc_req = False
                cc_dep_count = 0      # Number of completed CC deposits in payment log
                paylog_cc_ver = False  # True if any payment log note row has 'cc ver'
                dep_date = ""          # Date of last completed deposit
                prev_with_date = ""    # Date of previous completed withdrawal
                
                if payment_log_val.startswith("DEP_OP:"):
                    dep_part = payment_log_val.replace("DEP_OP:", "")
                    if "|WITH_OP:" in dep_part:
                        parts = dep_part.split("|WITH_OP:")
                        last_deposit_op = parts[0]
                        with_rest = parts[1]
                        if "|DOC:" in with_rest:
                            op_parts = with_rest.split("|DOC:")
                            if op_parts[0] != "NOT_FOUND":
                                withdrawal_op = op_parts[0]
                            doc_rest = op_parts[1] if len(op_parts) > 1 else ""
                            # Parse |CC_DEP_COUNT:, |CC_VER:, |DEP_DATE:, |PREV_WITH_DATE:
                            doc_fields = doc_rest.split("|")
                            doc_val = doc_fields[0].strip()
                            if doc_val == "YES":
                                has_doc_req = True
                            for field in doc_fields[1:]:
                                if field.startswith("CC_DEP_COUNT:"):
                                    try:
                                        cc_dep_count = int(field.replace("CC_DEP_COUNT:", "").strip())
                                    except ValueError:
                                        pass
                                elif field.startswith("CC_VER:"):
                                    paylog_cc_ver = field.replace("CC_VER:", "").strip() == "YES"
                                elif field.startswith("DEP_DATE:"):
                                    dep_date = field.replace("DEP_DATE:", "").strip()
                                elif field.startswith("PREV_WITH_DATE:"):
                                    prev_with_date = field.replace("PREV_WITH_DATE:", "").strip()
                        else:
                            if with_rest != "NOT_FOUND":
                                withdrawal_op = with_rest
                    else:
                        last_deposit_op = dep_part
                
                # Final fallback: if withdrawal_op is still empty/NOT_FOUND, use playbison_op or saved_operator
                if not withdrawal_op or withdrawal_op in ["NOT_FOUND", "NO MATCHES FOUND", ""]:
                    if playbison_op and playbison_op not in ["NOT_FOUND", "NO MATCHES FOUND", ""]:
                        withdrawal_op = playbison_op
                    elif saved_operator and saved_operator not in ["NOT_FOUND", "NO MATCHES FOUND", ""]:
                        withdrawal_op = "BANK WITHDRAWAL PIQ" if saved_operator.startswith("BANK WI") else saved_operator
                    else:
                        withdrawal_op = "NOT_FOUND"
                elif withdrawal_op.startswith("BANK WI"):
                    withdrawal_op = "BANK WITHDRAWAL PIQ"
                
                print(f"[PLAYBISON] Extracted Last Deposit Operator: {last_deposit_op} | Withdrawal Operator: {withdrawal_op}")
                
                if notes_have_req or has_doc_req:
                    if notes_have_req:
                        print("[PLAYBISON] 'req' or 'rem' keyword found in top note! Switching to Documents tab...")
                    else:
                        print("[PLAYBISON] 'req' keyword found in Payment Log notes! Switching to Documents tab...")
                    js_docs_macro = load_macro("ds_open_documents.js")
                    pyperclip.copy(js_docs_macro)
                    time.sleep(0.5)
                    pyautogui.hotkey('ctrl', 'l')
                    time.sleep(0.3)
                    pyautogui.write('javascript:')
                    time.sleep(0.2)
                    pyautogui.hotkey('ctrl', 'v')
                    time.sleep(0.3)
                    pyautogui.press('enter')
                    time.sleep(2.0)
                
                if last_deposit_op != "NOT_FOUND":
                    print(f"[PLAYBISON] Extracted Last Deposit Operator: {last_deposit_op} | Withdrawal Operator: {withdrawal_op}")
                else:
                    print(f"[PLAYBISON] Could not find a completed DEPOSIT row in the Payment Log.")
                
                # Use the true player_id extracted from the wallet page
                extracted_id = true_player_id
                
                # Close Wallet tab immediately before opening Google Sheets
                if wallet_opened:
                    print("[PLAYBISON] Closing Wallet tab...")
                    pyautogui.hotkey('ctrl', 'w')
                    time.sleep(0.3)
                    wallet_opened = False
                
                if extracted_id and extracted_id.isdigit():
                    print(f"\n[GOOGLE SHEETS] Formatting data for Google Sheets...")
                    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    sheet_date = id_date or now_str
                    wid_log = wallet_id if (wallet_id and wallet_id != "NOTFOUND" and "..." not in wallet_id) else (saved_wid or "")
                    print(f"[GOOGLE SHEETS] Date & Time: {sheet_date} | Withdrawal ID: {player_id} | Player ID: {extracted_id} | Wallet ID: {wid_log}")
                     
                    # Ensure ratio_val is formatted, or fallback to raw
                    ratio_str = f"{ratio_val}%" if ratio_val is not None else ratio_raw
                    
                    # Extract Games and Bonus for Columns N and O
                    games_col = ""
                    bonus_col = ""
                    
                    if " | Bonus: " in trans_result:
                        parts = trans_result.split(" | Bonus: ")
                        trans_result = parts[0]
                        bonus_col = parts[1].strip()
                        
                    if "|GAMES:" in trans_result:
                        parts = trans_result.split("|GAMES:")
                        trans_result = parts[0].strip()
                        games_rest = parts[1]
                        if "|STACK_DATE:" in games_rest:
                            games_col = games_rest.split("|STACK_DATE:")[0].strip()
                        else:
                            games_col = games_rest.strip()
                        games_col = games_col.replace("|", ", ").strip()
                    
                    # Columns A to M separated by Tabs
                    trans_result_clean = trans_result.replace('\r', '').replace('\n', ', ')
                    
                    # === STATUS DETERMINATION LOGIC (MULTI-STATUS SUPPORT) ===
                    status_list = []

                    # 1. Stack value over 100 PLN check
                    if trans_result and trans_result not in ["NO_STACK", "AUTOMATIC", "NO_TRANSACTIONS_TAB", "NO_DATE_INPUT"]:
                        total_stack_pln = 0.0
                        stack_matches = re.findall(r'[-]?(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s*\*\s*(\d+)', trans_result_clean)
                        for amt_str, cur_str, count_str in stack_matches:
                            try:
                                b_amt = float(amt_str)
                                b_cnt = int(count_str)
                                c_code = cur_str.upper() if cur_str else "PLN"
                                if "EUR" in c_code or "USD" in c_code:
                                    b_amt_pln = b_amt * 4.25
                                elif "HUF" in c_code:
                                    b_amt_pln = b_amt / 90.0
                                else:
                                    b_amt_pln = b_amt
                                total_stack_pln += (b_amt_pln * b_cnt)
                            except Exception:
                                pass
                        
                        if total_stack_pln > 100.0:
                            print(f"[PLAYBISON] Stack value ({total_stack_pln:.2f} PLN) > 100 PLN -> 'Reject (Stack > 100 PLN)'.")
                            status_list.append("Reject (Stack > 100 PLN)")

                    # 2. GB IBAN check
                    if is_gb_iban:
                        print(f"[PLAYBISON] GB IBAN detected in maskedAccount/IBAN -> 'Reject (GB IBAN)'.")
                        status_list.append("Reject (GB IBAN)")

                    # 3. Third Party Request check
                    if is_third_party_request:
                        holder_txt = modal_account_holder if modal_account_holder else "Unknown"
                        print(f"[PLAYBISON] Third Party Request detected (Account Holder mismatch: '{holder_txt}') -> 'Third party request'.")
                        status_list.append(f"Third party request (Name mismatch: {holder_txt})")

                    # 4. Deposit vs Withdrawal Operator mismatch check (Two-way check for Skrill, Paysafecard, Coinspaid)
                    dep_norm = last_deposit_op.upper().replace(" ", "").replace("_", "").replace("-", "") if last_deposit_op else ""
                    with_norm = withdrawal_op.upper().replace(" ", "").replace("_", "").replace("-", "") if withdrawal_op else ""
                    
                    restricted_ops = ["SKRILL", "PAYSAFECARD", "COINSPAID"]
                    for rop in restricted_ops:
                        req_kw = "PAYSAFE" if rop == "PAYSAFECARD" else rop
                        in_dep = req_kw in dep_norm
                        in_with = req_kw in with_norm
                        if in_dep != in_with:
                            print(f"[PLAYBISON] Operator Mismatch Detected! Deposit: '{last_deposit_op}' vs Withdrawal: '{withdrawal_op}' (Rule: {rop} must match on both sides).")
                            status_list.append(f"Cancel (Mismatch Operator: {last_deposit_op} vs {withdrawal_op})")
                            break

                    # 5. Duplicates & Mistral checks
                    if dup_res == "YES":
                        status_list.append("Review (Duplicates)")
                    if mistral_failed:
                        status_list.append("Review (Mistral Failed)")

                    # 6. Verify docs checks:
                    # a) Top note has active 'req' / 'rem' or pending doc
                    # b) Paysafecard withdrawal without CC verified in notes within 3 months (90 days)
                    # c) First-time CC deposit with no 'cc ver' in notes/payment log
                    cc_already_verified = notes_cc_ver or paylog_cc_ver
                    is_cc_dep = "CREDITCARD" in dep_norm or "CREDIT" in dep_norm or "PAYMENTIQCREDITCARD" in dep_norm
                    is_paysafe_withdrawal = "PAYSAFECARD" in with_norm or "PAYSAFE" in with_norm

                    needs_verify_docs = False
                    if notes_have_req or has_doc_req:
                        needs_verify_docs = True
                        status_list.append("Verify docs (Active doc request)")
                    elif is_paysafe_withdrawal and not notes_cc_ver_90:
                        print(f"[PLAYBISON] Paysafecard withdrawal detected and NO CC verification found within 3 months (90 days) -> 'Verify docs'.")
                        needs_verify_docs = True
                        status_list.append("Verify docs (Paysafecard / No 3M CC ver)")
                    elif is_cc_dep and not cc_already_verified and cc_dep_count <= 1 and not notes_have_req:
                        print(f"[PLAYBISON] First-time CC deposit without verification in notes -> 'Verify docs'.")
                        needs_verify_docs = True
                        status_list.append("Verify docs (First-time CC deposit)")

                    # 7. Data Studio / Ratio checks
                    EXEMPT_DEP_KEYWORDS = [
                        "PAYMENTIQCREDITCARD",
                        "WEBREDIRECTAPPLEPAY",
                        "WEBREDIRECTGOOGLEPAY",
                        "WEBREDIRECTBITEXPROAPPLE",
                        "WEBREDIRECTBITEXPROGOOGLE",
                        "ARI10GOOGLE",
                        "ARI10APPLE",
                    ]
                    is_exempt_dep = any(kw in dep_norm for kw in EXEMPT_DEP_KEYWORDS)

                    if is_no_data:
                        if not needs_verify_docs:
                            if notes_cc_ver or notes_iban_ver or paylog_cc_ver or (note_txt and "ver" in note_txt.lower() and "req" not in note_txt.lower() and "rem" not in note_txt.lower()):
                                pass
                            elif notes_has_payment_notes:
                                status_list.append("Req last deposit (No Data Studio / Unverified Notes)")
                    elif ratio_val is not None and ratio_val >= 25.0 and not is_exempt_dep:
                        # If operator is not Paysafecard, Skrill, or Coinspaid -> Req last deposit
                        if not any(k in dep_norm for k in ["PAYSAFECARD", "PAYSAFE", "SKRILL", "COINSPAID"]):
                            print(f"[PLAYBISON] W/D Ratio >= 25% ({ratio_str}) for card/bank operator -> 'Req last deposit'.")
                            status_list.append(f"Req last deposit (W/D Ratio >= 25%: {ratio_str})")
                        else:
                            status_list.append(f"W/D Ratio >= 25% ({ratio_str})")

                    # Previous Year Payment / Withdrawal Check (if last deposit or previous withdrawal was in previous calendar year)
                    curr_year = datetime.datetime.now().year
                    prev_year_reason = None
                    if dep_date:
                        m_year = re.search(r'\b(20\d\d)\b', dep_date)
                        if m_year:
                            d_year = int(m_year.group(1))
                            if d_year < curr_year:
                                prev_year_reason = f"Last deposit in previous year: {d_year}"
                    if not prev_year_reason and prev_with_date:
                        m_year = re.search(r'\b(20\d\d)\b', prev_with_date)
                        if m_year:
                            w_year = int(m_year.group(1))
                            if w_year < curr_year:
                                prev_year_reason = f"Last withdrawal in previous year: {w_year}"

                    if prev_year_reason:
                        print(f"[PLAYBISON] Previous year payment detected ({prev_year_reason}) -> 'Req last deposit'.")
                        status_list.append(f"Req last deposit ({prev_year_reason})")

                    # 8. Amount > 2000 PLN Req IBAN check
                    curr_upper = t_curr.strip().upper() if t_curr else "PLN"
                    val_in_pln = 0.0
                    if curr_upper and curr_upper != "PLN":
                        pln_amount, fx_note = convert_to_pln(str(w_value).strip(), curr_upper)
                        w_value_display = f"{pln_amount} PLN"
                        try:
                            val_in_pln = float(pln_amount)
                        except ValueError:
                            pass
                        if fx_note:
                            print(f"[GOOGLE SHEETS] Amount converted: {fx_note}")
                    else:
                        w_value_display = str(w_value).strip()
                        try:
                            clean_num = re.sub(r'[^0-9.]', '', w_value_display.replace(',', '.'))
                            val_in_pln = float(clean_num) if clean_num else 0.0
                        except ValueError:
                            pass
                        if w_value_display and "PLN" not in w_value_display.upper():
                            w_value_display = f"{w_value_display} PLN"

                    # 8. Amount > 2000 PLN Req IBAN check
                    if val_in_pln > 2000.0 and not notes_iban_ver:
                        print(f"[PLAYBISON] Withdrawal amount ({val_in_pln:.2f} PLN) > 2000 PLN (IBAN unverified within 90 days) -> 'Req IBAN'.")
                        status_list.append(f"Req IBAN (> 2000 PLN: {w_value_display})")

                    # 9. Top note 'Limit reached' check (Daily limit refreshes each date)
                    if "limit reached" in (note_txt or "").lower():
                        is_same_day = False
                        if top_note_date:
                            m_note = re.search(r'\b(20\d\d-\d\d-\d\d)\b', top_note_date)
                            m_w = re.search(r'\b(20\d\d-\d\d-\d\d)\b', id_date or "")
                            today_ymd = datetime.datetime.now().strftime("%Y-%m-%d")
                            note_ymd = m_note.group(1) if m_note else ""
                            w_ymd = m_w.group(1) if m_w else today_ymd
                            if note_ymd and (note_ymd == w_ymd or note_ymd == today_ymd):
                                is_same_day = True
                        else:
                            is_same_day = True

                        if is_same_day:
                            print(f"[PLAYBISON] 'Limit reached' detected on same date ({top_note_date}) in note: '{note_txt}' -> 'Limit Reached'.")
                            status_list.append("Limit Reached")
                        else:
                            print(f"[PLAYBISON] 'Limit reached' in note '{note_txt}' is from previous date ({top_note_date}) - daily limit refreshed!")

                    # Deduplicate while preserving order
                    unique_statuses = []
                    for s in status_list:
                        if s not in unique_statuses:
                            unique_statuses.append(s)

                    if unique_statuses:
                        approval_status = " / ".join(unique_statuses)
                    else:
                        # Determine detailed reason(s) for approval
                        approve_reasons = []
                        if is_exempt_dep:
                            approve_reasons.append(f"Exempt: {last_deposit_op}")
                        elif is_no_data:
                            if notes_cc_ver or notes_iban_ver or paylog_cc_ver:
                                approve_reasons.append("Notes Verified")
                            else:
                                approve_reasons.append("New Account")
                        elif ratio_val is not None and ratio_val < 25.0:
                            approve_reasons.append(f"Ratio {ratio_str}")
                        
                        if is_cc_dep and cc_already_verified:
                            approve_reasons.append("CC Verified")
                        if notes_iban_ver:
                            approve_reasons.append("IBAN Verified")

                        # Deduplicate reasons
                        unique_reasons = []
                        for r in approve_reasons:
                            if r not in unique_reasons:
                                unique_reasons.append(r)

                        if unique_reasons:
                            approval_status = f"Approve ({', '.join(unique_reasons)})"
                        else:
                            approval_status = "Approve"
                        
                    name_to_use = true_player_name.strip() if (true_player_name and true_player_name.strip()) else (f"{fn} {ln}".strip() if (fn or ln) else player_name)
                    withdrawal_id = player_id
                    final_wid = wallet_id if (wallet_id and wallet_id != "NOTFOUND" and "..." not in wallet_id) else (saved_wid or "")
                    row_data = f"{sheet_date}\t{withdrawal_id}\t{extracted_id}\t{name_to_use}\t{final_wid}\t{w_value_display}\t{player_email}\t{city}\t{withdrawal_op}\t{player_brand}\t{ratio_str}\t{dup_res}\t{trans_result_clean}\t{games_col}\t{bonus_col}\t{last_deposit_op}\t{approval_status}"
                    pyperclip.copy(row_data)
                    
                    target_url = "https://docs.google.com/spreadsheets/d/1yIwiUAJh2et1r3klUzPv2xIliFSJGU_ez8WE77ELvAw/edit?gid=0#gid=0"
                    print(f"[GOOGLE SHEETS] Opening {target_url} in a new tab...")
                    
                    # Open Google Sheets
                    sheets_opened = True
                    webbrowser.open_new_tab(target_url)
                    
                    print("[GOOGLE SHEETS] Waiting 4.5 seconds for Google Sheets to load...")
                    time.sleep(4.5)
                    
                    print("[GOOGLE SHEETS] Navigating to the next empty row from bottom...")
                    # 1. Ctrl+End lands on the bottom-right corner of the used data range
                    pyautogui.hotkey('ctrl', 'end')
                    time.sleep(0.8)
                    
                    # 2. Move to Column A of this bottom row
                    pyautogui.press('home')
                    time.sleep(0.4)
                    
                    # 3. Ctrl+Up jumps directly to the last cell that has data in Column A
                    pyautogui.hotkey('ctrl', 'up')
                    time.sleep(0.4)
                    
                    # 4. Step down exactly 1 row to the next empty row
                    pyautogui.press('down')
                    time.sleep(0.4)
                    
                    # Ensure in Column A of the empty row
                    pyautogui.press('home')
                    time.sleep(0.2)
                    
                    # Recopy row_data to clipboard to ensure fresh paste
                    pyperclip.copy(row_data)
                    time.sleep(0.2)
                    
                    print("[GOOGLE SHEETS] Pasting data into the new row...")
                    pyautogui.hotkey('ctrl', 'v')
                    time.sleep(1.0)
                    
                    # Press Enter to finalize paste
                    pyautogui.press('enter')
                    time.sleep(0.5)
                    time.sleep(0.5)
                    
                    print("[GOOGLE SHEETS] Data successfully logged!")
                    
                    # Close Google Sheets tab immediately
                    if sheets_opened:
                        print("[GOOGLE SHEETS] Closing Google Sheets tab...")
                        pyautogui.hotkey('ctrl', 'w')
                        time.sleep(0.3)
                        sheets_opened = False
                    
                    # Record withdrawal_id as successfully completed
                    if withdrawal_id:
                        try:
                            today_str = datetime.date.today().strftime("%Y-%m-%d")
                            completed = set()
                            if os.path.exists("completed_ids.json"):
                                with open("completed_ids.json", "r") as f:
                                    data = json.load(f)
                                if isinstance(data, dict):
                                    if data.get("date") == today_str:
                                        completed = set(data.get("ids", []))
                                elif isinstance(data, list):
                                    completed = set(data)
                            completed.add(str(withdrawal_id).strip())
                            with open("completed_ids.json", "w") as f:
                                json.dump({"date": today_str, "ids": sorted(list(completed))}, f, indent=2)
                            print(f"[STATE] Withdrawal ID {withdrawal_id} recorded in completed_ids.json.")
                        except Exception as e:
                            print(f"[STATE] Error saving completed ID: {e}")
                    
                    # Clean up tabs safely
                    cleanup_tabs(sheets_opened, analytics_opened, wallet_opened, datastudio_opened, duplicates_opened)
                    datastudio_opened = False
                    wallet_opened = False
                    sheets_opened = False
                    duplicates_opened = False
                    analytics_opened = False
                    
                    print("[DATASTUDIO] Done. Ready for next loop.")
                else:
                    print(f"[PLAYBISON] Failed to extract ID from table. Clipboard contained: '{extracted_id}'")
            else:
                print("[PLAYBISON] Could not extract wallet_id from modal.")
                print(f"\n[PLAYBISON] Result: {verify_raw}")
    else:
        print("[DATASTUDIO] Could not determine W/D ratio automatically.")
        
    # Safety cleanup: ensure any remaining auxiliary tabs are closed and Chrome returns to Tab 1
    if any([sheets_opened, analytics_opened, wallet_opened, datastudio_opened, duplicates_opened]):
        cleanup_tabs(sheets_opened, analytics_opened, wallet_opened, datastudio_opened, duplicates_opened)
        
    print("\n[MAIN] Script complete! Workflow finished.")

if __name__ == "__main__":
    main()

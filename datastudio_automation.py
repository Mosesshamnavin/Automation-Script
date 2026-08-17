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

def convert_to_pln(amount_str, currency, pyautogui_ref=None, pyperclip_ref=None, time_ref=None, webbrowser_ref=None, load_macro_ref=None):
    """Convert an amount in a given currency to PLN.
    Primary: opens a Google search tab in Chrome and scrapes the real-time result.
    Fallback: Frankfurter ECB API.
    Returns a tuple: (pln_amount_str, note_str)
    """
    currency = (currency or "PLN").strip().upper()
    if currency == "PLN":
        return amount_str, ""

    try:
        amount = float(str(amount_str).replace(",", ".").strip())
    except ValueError:
        return amount_str, ""

    # --- Browser tab method (primary) ---
    if pyautogui_ref and pyperclip_ref and time_ref and webbrowser_ref and load_macro_ref:
        try:
            search_url = f"https://www.google.com/search?q={amount_str}+{currency}+to+PLN&hl=en"
            print(f"[FX] Opening Google conversion tab: {amount_str} {currency} to PLN...")
            webbrowser_ref.open_new_tab(search_url)
            time_ref.sleep(4.0)

            # Inject the scraper macro
            js_fx = load_macro_ref("gs_get_currency.js")
            pyperclip_ref.copy("FX_WAITING")
            pyautogui_ref.hotkey('ctrl', 'l')
            time_ref.sleep(0.3)
            pyautogui_ref.write('javascript:')
            time_ref.sleep(0.2)
            pyautogui_ref.hotkey('ctrl', 'v')
            time_ref.sleep(0.3)
            pyautogui_ref.press('enter')

            # Wait for the macro to copy the result
            time_ref.sleep(2.0)
            clip = pyperclip_ref.paste().strip()

            # Close the Google tab
            pyautogui_ref.hotkey('ctrl', 'w')
            time_ref.sleep(0.5)

            if clip.startswith("FX_RESULT:") and not clip.endswith("FAILED"):
                result_str = clip.replace("FX_RESULT:", "").strip()
                pln_amount = round(float(result_str), 2)
                note = f"{amount_str} {currency} = {pln_amount:.2f} PLN (Google live rate)"
                print(f"[FX] {note}")
                return f"{pln_amount:.2f}", note
            else:
                print(f"[FX] Google scrape returned: {clip!r}. Trying API fallback...")
        except Exception as e:
            print(f"[FX] Browser conversion error: {e}. Trying API fallback...")

    # --- API fallback (Frankfurter ECB) ---
    global _fx_rate_cache
    if currency not in _fx_rate_cache:
        try:
            url = f"https://api.frankfurter.app/latest?from={currency}&to=PLN"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode())
                rate_to_pln = data.get("rates", {}).get("PLN")
                if rate_to_pln:
                    _fx_rate_cache[currency] = float(rate_to_pln)
                    print(f"[FX] ECB API rate: 1 {currency} = {rate_to_pln} PLN")
                else:
                    print(f"[FX] WARNING: PLN rate not found for {currency}. Keeping original.")
                    return f"{amount_str} {currency}", ""
        except Exception as e:
            print(f"[FX] WARNING: API also failed for {currency}: {e}. Keeping original.")
            return f"{amount_str} {currency}", ""

    rate = _fx_rate_cache[currency]
    pln_amount = round(amount * rate, 2)
    note = f"{amount_str} {currency} = {pln_amount:.2f} PLN (ECB API fallback)"
    print(f"[FX] {note}")
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

    # Read saved user ID, email & brand if available
    import json, os, re
    player_id = ""
    player_email = ""
    player_brand = ""
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
    
    print("[PLAYBISON] Waiting 2 seconds for Payment Details modal to open...")
    time.sleep(2.0)
    
    # Step B: Extract maskedAccount + wallet_id from open modal
    # Uses getVal('wallet_id') - same proven logic as first/last name extraction.
    # wallet_id is returned via prompt so Python can open it (window.open blocked in bookmarklets).
    # Handles Operator conditions: COINSPAID (skip), PAYSAFECARD/SKRILL (skip name check), BANK WITHDRAWAL PIQ (default check)
    js_extract_macro = load_macro("ds_extract_modal.js")
    
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

    # Extract fn, ln, city, op
    fn = ""
    ln = ""
    city = ""
    playbison_op = ""
    if rest:
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
                
    approval_status = "PENDING"
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

    pyperclip.copy(js_macro_4)
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.5)
    pyautogui.write('javascript:')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)
    pyautogui.press('enter')
    
    time.sleep(1.5)
    
    # Grab prompt response via Ctrl+C
    pyautogui.hotkey('ctrl', 'c')
    time.sleep(0.5)
    ratio_raw = pyperclip.paste().strip()
    pyautogui.press('enter') # Close prompt
    
    print(f"\n[DATASTUDIO] Raw W/D ratio text: '{ratio_raw}'")

    if ratio_raw == "MULTIBRAND":
        print(f"[DATASTUDIO] Multibrand (2+ rows) detected. Selecting '{player_brand}' in Brand filter...")
        js_macro_brand = load_macro("ds_brand_filter.js", TARGET_BRAND=player_brand)
        
        pyperclip.copy(js_macro_brand)
        pyautogui.hotkey('ctrl', 'l')
        time.sleep(0.5)
        pyautogui.write('javascript:')
        time.sleep(0.2)
        pyautogui.hotkey('ctrl', 'v')
        time.sleep(0.5)
        pyautogui.press('enter')
        
        time.sleep(3.5)
        pyautogui.hotkey('ctrl', 'c')
        time.sleep(0.5)
        filter_status = pyperclip.paste().strip()
        pyautogui.press('enter')
        print(f"[DATASTUDIO] Brand filter status: '{filter_status}'")
        
        if "SUCCESS" in filter_status:
            print("[DATASTUDIO] Waiting 6 seconds for filtered data to load...")
            time.sleep(6.0)
            
            print(f"[DATASTUDIO] Re-checking W/D ratio for {player_brand.capitalize()}...")
            pyperclip.copy(js_macro_4)
            pyautogui.hotkey('ctrl', 'l')
            time.sleep(0.5)
            pyautogui.write('javascript:')
            time.sleep(0.2)
            pyautogui.hotkey('ctrl', 'v')
            time.sleep(0.5)
            pyautogui.press('enter')
            
            time.sleep(1.5)
            pyautogui.hotkey('ctrl', 'c')
            time.sleep(0.5)
            ratio_raw = pyperclip.paste().strip()
            pyautogui.press('enter')
            print(f"[DATASTUDIO] New Raw W/D ratio text: '{ratio_raw}'")
    
    # Parse ratio float
    ratio_val = None
    if ratio_raw and "HEADER_NOT_FOUND" not in ratio_raw and "NO_DATA" not in ratio_raw:
        cleaned = ratio_raw.replace('%', '').replace(',', '.').strip()
        match = re.search(r'[-+]?\d*\.?\d+', cleaned)
        if match:
            try:
                ratio_val = float(match.group())
            except ValueError:
                pass

    if ratio_val is not None:
        print(f"[DATASTUDIO] Parsed W/D ratio: {ratio_val}%")
        if True: 
            if ratio_val >= 25.0:
                print(f"[DATASTUDIO] W/D ratio is {ratio_val}% (>= 25%)! Closing tabs and terminating flow early.")
                cleanup_tabs(sheets_opened, analytics_opened, wallet_opened, datastudio_opened, duplicates_opened)
                sys.exit(0)
            else:
                print(f"\n[DATASTUDIO] W/D ratio is {ratio_val}% (< 25%)! Proceeding to Playbison for manual cancellation check!")
            print(f"[DATASTUDIO] Opening wallet page for '{player_email or player_id}'...")
            
            # Open wallet_id in new tab regardless of match result
            if not wallet_id and player_id:
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
                pyperclip.copy('')
                pyperclip.copy(js_extract_player_id)
                pyautogui.hotkey('ctrl', 'l')
                time.sleep(0.3)
                pyautogui.write('javascript:')
                time.sleep(0.2)
                pyautogui.hotkey('ctrl', 'v')
                time.sleep(0.3)
                pyautogui.press('enter')
                
                time.sleep(1.0)
                clipboard_res = pyperclip.paste().strip()
                true_player_name = ""
                wallet_email = ""
                if "|NAME:" in clipboard_res:
                    parts = clipboard_res.split("|NAME:")
                    true_player_id = parts[0].strip()
                    rest = parts[1].strip()
                    if "|EMAIL:" in rest:
                        true_player_name, wallet_email = rest.split("|EMAIL:")
                        true_player_name = true_player_name.strip()
                        wallet_email = wallet_email.strip()
                    else:
                        true_player_name = rest
                else:
                    true_player_id = clipboard_res
                    
                if wallet_email:
                    player_email = wallet_email

                if true_player_id and true_player_id.isdigit():
                    print(f"[PLAYBISON] Extracted true Player ID from wallet page: {true_player_id} (Name: {true_player_name}, Email: {player_email})")
                else:
                    print(f"[PLAYBISON] Warning: Could not extract true Player ID. Falling back to transaction ID.")
                    true_player_id = player_id

                
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
                for i in range(15):
                    pyperclip.copy("WAITING_FOR_NOTES")
                    pyperclip.copy(js_check_notes)
                    pyautogui.hotkey('ctrl', 'l')
                    time.sleep(0.3)
                    pyautogui.write('javascript:')
                    time.sleep(0.2)
                    pyautogui.hotkey('ctrl', 'v')
                    time.sleep(0.3)
                    pyautogui.press('enter')
                    
                    time.sleep(1.0) # Wait a bit before checking clipboard
                    
                    clip_val = pyperclip.paste().strip()
                    if clip_val.startswith("REQ_FOUND:"):
                        res_part = clip_val.replace("REQ_FOUND:", "")
                        if "|" in res_part:
                            parts = res_part.split("|")
                            note_txt = parts[1].replace("TEXT:", "")
                            if note_txt != "NOTES_NOT_FOUND":
                                if parts[0] == "YES":
                                    notes_have_req = True
                                print(f"[PLAYBISON] Checked top note: '{note_txt}' (Verify docs: {notes_have_req})")
                                break
                    time.sleep(0.5)

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
                for _ in range(35):
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
                                print(f"[PLAYBISON] Stack Date: {stack_date_ymd}. Navigating to Bonuses tab to extract Bonus Name...")
                                
                                # ── Phase 1: Navigate current tab to BASE wallet URL ──────────
                                wallet_base_url = f"https://api-acnt.playbison.com/platform-admin/#action:admin.user:{wallet_id}"
                                pyautogui.hotkey('ctrl', 'l')
                                time.sleep(0.4)
                                pyperclip.copy(wallet_base_url)
                                pyautogui.hotkey('ctrl', 'a')
                                time.sleep(0.1)
                                pyautogui.hotkey('ctrl', 'v')
                                time.sleep(0.2)
                                pyautogui.press('enter')
                                print("[PLAYBISON] Waiting 5 seconds for wallet page to reload...")
                                time.sleep(5.0)

                                # ── Phase 2: Click the Bonuses tab ───────────
                                js_open_bonuses = load_macro("ds_open_bonuses.js")
                                pyperclip.copy(js_open_bonuses)
                                pyautogui.hotkey('ctrl', 'l')
                                time.sleep(0.3)
                                pyautogui.write('javascript:')
                                time.sleep(0.2)
                                pyautogui.hotkey('ctrl', 'v')
                                time.sleep(0.3)
                                pyautogui.press('enter')
                                print("[PLAYBISON] Bonuses tab clicked. Waiting 5 seconds for data to load...")
                                time.sleep(5.0)

                                # ── Phase 3: Inject scan-only macro ──────────────────────────
                                js_bonus = load_macro("ds_extract_bonus.js")
                                js_bonus = js_bonus.replace("###STACK_DATE###", stack_date)

                                pyperclip.copy("__WAITING_BONUS__")
                                pyperclip.copy(js_bonus)
                                pyautogui.hotkey('ctrl', 'l')
                                time.sleep(0.3)
                                pyautogui.write('javascript:')
                                time.sleep(0.2)
                                pyautogui.hotkey('ctrl', 'v')
                                time.sleep(0.3)
                                pyautogui.press('enter')
                                
                                print("[PLAYBISON] Extracting Bonus Name (scanning up to 15 pages)...")
                                bonus_name = ""
                                for _ in range(90):
                                    time.sleep(1.0)
                                    clip_val = pyperclip.paste().strip()
                                    if clip_val.startswith("BONUS_RESULT:"):
                                        bonus_name = clip_val.replace("BONUS_RESULT:", "").strip()
                                        break
                                
                                if bonus_name and not bonus_name.startswith("NOT_FOUND") and bonus_name != "":
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
                
                print("[PLAYBISON] Waiting 6 seconds for search results to load...")
                time.sleep(6.0)
                
                # Extract the last deposit ID from the Payment Log
                # The JS macro uses setInterval polling up to 10s for AJAX table load.
                # Python must wait at least 11s to ensure polling has finished.
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
                
                # Wait 11s for JS polling (20 × 500ms = 10s max) to complete
                time.sleep(11.0)
                payment_log_val = pyperclip.paste().strip()
                last_deposit_op = "NOT_FOUND"
                withdrawal_op = playbison_op
                has_doc_req = False
                
                if payment_log_val.startswith("DEP_OP:"):
                    dep_part = payment_log_val.replace("DEP_OP:", "")
                    if "|WITH_OP:" in dep_part:
                        parts = dep_part.split("|WITH_OP:")
                        last_deposit_op = parts[0]
                        with_doc_part = parts[1]
                        if "|DOC:" in with_doc_part:
                            op_parts = with_doc_part.split("|DOC:")
                            if op_parts[0] != "NOT_FOUND":
                                withdrawal_op = op_parts[0]
                            if op_parts[1] == "YES":
                                has_doc_req = True
                        else:
                            if with_doc_part != "NOT_FOUND":
                                withdrawal_op = with_doc_part
                    else:
                        last_deposit_op = dep_part
                
                # Final fallback: if withdrawal_op is still empty/NOT_FOUND, use playbison_op from modal
                if not withdrawal_op or withdrawal_op in ["NOT_FOUND", "NO MATCHES FOUND"]:
                    withdrawal_op = playbison_op if playbison_op else "NOT_FOUND"
                
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
                
                if extracted_id and extracted_id.isdigit():
                    print(f"\n[GOOGLE SHEETS] Formatting data for Google Sheets...")
                    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    sheet_date = id_date or now_str
                    print(f"[GOOGLE SHEETS] Date & Time (ID date): {sheet_date}")
                     
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
                    
                    approval_status = "Approve"
                    
                    if dup_res == "YES":
                        approval_status = "Review (Duplicates)"
                    elif mistral_failed:
                        approval_status = "Review (Mistral Failed)"
                        
                    if notes_have_req or has_doc_req:
                        approval_status = "Verify docs"
                        
                    # Check deposit operator vs withdrawal operator rules:
                    # If last deposit operator is Skrill, Paysafecard, or Coinspaid,
                    # withdrawal MUST be requested from that exact same operator.
                    # Otherwise, set approval status to "Cancel (Mismatch Operator)".
                    dep_norm = last_deposit_op.upper().replace(" ", "").replace("_", "").replace("-", "") if last_deposit_op else ""
                    with_norm = withdrawal_op.upper().replace(" ", "").replace("_", "").replace("-", "") if withdrawal_op else ""
                    
                    restricted_dep = None
                    if "SKRILL" in dep_norm:
                        restricted_dep = "SKRILL"
                    elif "PAYSAFECARD" in dep_norm or "PAYSAFE" in dep_norm:
                        restricted_dep = "PAYSAFECARD"
                    elif "COINSPAID" in dep_norm:
                        restricted_dep = "COINSPAID"
                    
                    if restricted_dep:
                        req_keyword = "PAYSAFE" if restricted_dep == "PAYSAFECARD" else restricted_dep
                        if req_keyword not in with_norm:
                            print(f"[PLAYBISON] Operator Mismatch Detected! Last Deposit: '{last_deposit_op}' ({restricted_dep}) vs Withdrawal: '{withdrawal_op}'")
                            approval_status = "Cancel (Mismatch Operator)"
                    
                    # Credit Card last deposit always requires CC verification
                    # Flag as "Verify docs" unless already a harder status like Cancel
                    if "CREDITCARD" in dep_norm or "CREDIT" in dep_norm or "PAYMENTIQCREDITCARD" in dep_norm:
                        if approval_status not in ["Cancel (Mismatch Operator)", "Review (Duplicates)"]:
                            print(f"[PLAYBISON] Last deposit via Credit Card ('{last_deposit_op}'). Flagging as 'Verify docs' — CC verification required.")
                            approval_status = "Verify docs"
                        
                    # Convert withdrawal amount to PLN if not already PLN
                    curr_upper = t_curr.strip().upper() if t_curr else "PLN"
                    if curr_upper and curr_upper != "PLN":
                        pln_amount, fx_note = convert_to_pln(
                            str(w_value).strip(), curr_upper,
                            pyautogui_ref=pyautogui,
                            pyperclip_ref=pyperclip,
                            time_ref=time,
                            webbrowser_ref=webbrowser,
                            load_macro_ref=load_macro
                        )
                        w_value_display = f"{pln_amount} PLN"
                        if fx_note:
                            print(f"[GOOGLE SHEETS] Amount converted: {fx_note}")
                    else:
                        w_value_display = str(w_value).strip()
                        if w_value_display and "PLN" not in w_value_display.upper():
                            w_value_display = f"{w_value_display} PLN"
                        
                    name_to_use = true_player_name.strip() if (true_player_name and true_player_name.strip()) else f"{fn} {ln}".strip()
                    row_data = f"{sheet_date}\t{extracted_id}\t{name_to_use}\t{w_value_display}\t{player_email}\t{city}\t{withdrawal_op}\t{player_brand}\t{ratio_str}\t{dup_res}\t{trans_result_clean}\t{games_col}\t{bonus_col}\t{last_deposit_op}\t{approval_status}"
                    pyperclip.copy(row_data)
                    
                    target_url = "https://docs.google.com/spreadsheets/d/1yIwiUAJh2et1r3klUzPv2xIliFSJGU_ez8WE77ELvAw/edit?gid=0#gid=0"
                    print(f"[GOOGLE SHEETS] Opening {target_url} in a new tab...")
                    
                    # Open Google Sheets
                    sheets_opened = True
                    webbrowser.open_new_tab(target_url)
                    
                    print("[GOOGLE SHEETS] Waiting 9 seconds for Google Sheets to fully load...")
                    time.sleep(9.0)
                    
                    print("[GOOGLE SHEETS] Navigating to the next empty row...")
                    # Press Ctrl+End twice — first press may land on last visible cell,
                    # second press confirms the true last used cell after full render.
                    pyautogui.hotkey('ctrl', 'end')
                    time.sleep(1.2)
                    pyautogui.hotkey('ctrl', 'end')
                    time.sleep(1.2)
                    
                    # Now go to Column A of this last row
                    pyautogui.press('home')
                    time.sleep(0.8)
                    
                    # Navigate: go to A1 first, then jump DOWN to the last filled cell
                    # Ctrl+Home → A1, Ctrl+Down → last filled cell in column A
                    pyautogui.hotkey('ctrl', 'home')
                    time.sleep(0.5)
                    pyautogui.hotkey('ctrl', 'down')
                    time.sleep(0.8)
                    
                    # Go one row down to the first empty row
                    pyautogui.press('down')
                    time.sleep(0.5)
                    
                    print("[GOOGLE SHEETS] Pasting data into the new row...")
                    pyautogui.hotkey('ctrl', 'v')
                    time.sleep(1.0)
                    
                    # Press Enter to finalize paste
                    pyautogui.press('enter')
                    time.sleep(0.5)
                    time.sleep(0.5)
                    
                    print("[GOOGLE SHEETS] Data successfully logged!")
                    
                    # Clean up tabs safely
                    cleanup_tabs(sheets_opened, analytics_opened, wallet_opened, datastudio_opened, duplicates_opened)
                    
                    print("[DATASTUDIO] Done. Ready for next loop.")
                else:
                    print(f"[PLAYBISON] Failed to extract ID from table. Clipboard contained: '{extracted_id}'")
            else:
                print("[PLAYBISON] Could not extract wallet_id from modal.")
                print(f"\n[PLAYBISON] Result: {verify_raw}")
    else:
        print("[DATASTUDIO] Could not determine W/D ratio automatically.")
        
    print("\n[MAIN] Script complete! Workflow finished.")

if __name__ == "__main__":
    main()

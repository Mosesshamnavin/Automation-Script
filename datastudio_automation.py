import pyautogui
import time
import pyperclip
import json
import os
import re
import webbrowser
import datetime
import sys
from macro_loader import load_macro

def main():
    print("============================================================")
    print("DATA STUDIO AUTOMATION")
    print("============================================================")
    import sys
    
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
    if os.path.exists("last_user.json"):
        try:
            with open("last_user.json", "r") as f:
                data = json.load(f)
                player_email = data.get("email", "")
                player_id = data.get("id", "")
                player_brand = data.get("brand", "")
                w_value = data.get("w_value", "")
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
    time.sleep(1)
    
    print("Executing Phase 3: Setting the Date Range (2 months ago -> today)...")
    # Macro 3: Navigate calendar back 1 month (to get 2 months ago), select days, click Apply
    js_macro_3 = load_macro("ds_set_date_range.js")
    
    pyperclip.copy(js_macro_3)
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.5)
    pyautogui.write('javascript:')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)
    pyautogui.press('enter')
    
    print("\nWaiting 6 seconds for Data Studio report table to update...")
    time.sleep(6)
    
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
        if True: # Proceed regardless of ratio
            if ratio_val < 25.0:
                print(f"\n[DATASTUDIO] W/D ratio is {ratio_val}% (< 25%)!")
            else:
                print(f"\n[DATASTUDIO] W/D ratio is {ratio_val}% (>= 25%). Proceeding to Playbison for manual cancellation check!")
            print(f"[DATASTUDIO] Opening wallet page for '{player_email or player_id}'...")
            
            # Open wallet_id in new tab regardless of match result
            if wallet_id:
                wallet_url = f"https://api-acnt.playbison.com/platform-admin/#action:admin.user:{wallet_id}"
                print(f"[PLAYBISON] Opening wallet_id in new tab: {wallet_url}")
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
                if "|NAME:" in clipboard_res:
                    parts = clipboard_res.split("|NAME:")
                    true_player_id = parts[0].strip()
                    true_player_name = parts[1].strip()
                else:
                    true_player_id = clipboard_res
                    
                if true_player_id and true_player_id.isdigit():
                    print(f"[PLAYBISON] Extracted true Player ID from wallet page: {true_player_id} (Name: {true_player_name})")
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

                # Step 1.5: Check Notes for "req" keyword
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
                                print(f"[PLAYBISON] Checked top note: '{note_txt}' (Contains 'req': {notes_have_req})")
                                break
                    time.sleep(0.5)

                if notes_have_req:
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
                        if trans_result in ["NO_STACK", "AUTOMATIC", "NO_TRANSACTIONS_TAB", "NO_DATE_INPUT"]:
                            print(f"[PLAYBISON] No stack found ({trans_result}). Continuing flow automatically...")
                        elif trans_result.startswith("EXCEEDS_5_PAGES"):
                            dates_str = trans_result.split("|")[1] if "|" in trans_result else ""
                            print(f"\n{'='*60}\n[PLAYBISON] ⚠️ OVER 5 PAGES OF TRANSACTIONS FOUND!\nFound Stack Dates on Page 1: {dates_str}\n{'='*60}\n")
                            
                            analytics_url = "https://playbison-analytics.web.app/reports/violating-transactions"
                            print(f"[PLAYBISON] Opening Analytics Platform: {analytics_url}")
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
                
                time.sleep(1.0)
                last_deposit_val = pyperclip.paste().strip()
                last_deposit_id = "NOT_FOUND"
                last_deposit_op = playbison_op
                has_doc_req = False
                
                if last_deposit_val.startswith("DEP_ID:"):
                    id_part = last_deposit_val.replace("DEP_ID:", "")
                    if "|OP:" in id_part:
                        parts = id_part.split("|OP:")
                        last_deposit_id = parts[0]
                        op_doc_part = parts[1]
                        if "|DOC:" in op_doc_part:
                            op_parts = op_doc_part.split("|DOC:")
                            last_deposit_op = op_parts[0]
                            if op_parts[1] == "YES":
                                has_doc_req = True
                        else:
                            last_deposit_op = op_doc_part
                    else:
                        last_deposit_id = id_part
                
                print(f"[PLAYBISON] Extracted Last Deposit ID: {last_deposit_id} (Operator: {last_deposit_op})")
                
                if notes_have_req or has_doc_req:
                    if notes_have_req:
                        print("[PLAYBISON] 'req' keyword found in Notes tab! Switching to Documents tab...")
                    else:
                        print("[PLAYBISON] 'req' keyword found in Payment Log notes! Switching to Documents tab...")
                    js_docs = """(function(){ 
                        let tabs = Array.from(document.querySelectorAll('a, li, span, button'));
                        let docTab = tabs.find(t => t.textContent.trim().toLowerCase() === 'documents');
                        if (docTab) {
                            docTab.dispatchEvent(new MouseEvent('mousedown', {bubbles:true}));
                            docTab.dispatchEvent(new MouseEvent('mouseup', {bubbles:true}));
                            docTab.dispatchEvent(new MouseEvent('click', {bubbles:true}));
                        }
                    })();"""
                    js_docs_min = js_docs.replace('\n', ' ').replace('\r', '')
                    pyperclip.copy(f"javascript:{js_docs_min}")
                    time.sleep(0.5)
                    pyautogui.hotkey('ctrl', 'l')
                    time.sleep(0.3)
                    pyautogui.hotkey('ctrl', 'v')
                    time.sleep(0.3)
                    pyautogui.press('enter')
                    time.sleep(2.0)
                
                if last_deposit_id != "NOT_FOUND":
                    print(f"[PLAYBISON] Extracted Last Deposit ID: {last_deposit_id} (Operator: {last_deposit_op})")
                else:
                    print(f"[PLAYBISON] Could not find a completed DEPOSIT row in the Payment Log.")
                
                # Use the true player_id extracted from the wallet page
                extracted_id = true_player_id
                
                if extracted_id and extracted_id.isdigit():
                    print(f"\n[GOOGLE SHEETS] Formatting data for Google Sheets...")
                    from datetime import datetime
                    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    
                    # Ensure ratio_val is formatted, or fallback to raw
                    ratio_str = f"{ratio_val}%" if ratio_val is not None else ratio_raw
                    
                    # Columns A to M separated by Tabs
                    trans_result_clean = trans_result.replace('\r', '').replace('\n', ', ')
                    
                    approval_status = "Approve"
                    if dup_res == "YES":
                        approval_status = "Review (Duplicates)"
                    elif mistral_failed:
                        approval_status = "Review (Mistral Failed)"
                        
                    row_data = f"{now_str}\t{player_email}\t{extracted_id}\t{w_value}\t{fn} {ln}\t{city}\t{last_deposit_op}\t{player_brand}\t{ratio_str}\t{dup_res}\t{trans_result_clean}\t{last_deposit_id}\t{approval_status}"
                    pyperclip.copy(row_data)
                    
                    target_url = "https://docs.google.com/spreadsheets/d/1n-VC5cQAxhi2a2yC0VPWWSLRWg6NEQsKNv35UZoGbqI/edit?pli=1&gid=0#gid=0"
                    print(f"[GOOGLE SHEETS] Opening {target_url} in a new tab...")
                    
                    # Open Google Sheets
                    webbrowser.open_new_tab(target_url)
                    
                    print("[GOOGLE SHEETS] Waiting 10 seconds for Google Sheets to fully load...")
                    time.sleep(10.0)
                    
                    print("[GOOGLE SHEETS] Navigating to the next empty row...")
                    # Go to the bottom right of the sheet
                    pyautogui.hotkey('ctrl', 'end')
                    time.sleep(1.0)
                    
                    # Go to the first column (Column A) of the bottom row
                    pyautogui.press('home')
                    time.sleep(1.0)
                    
                    # Go UP to the last filled row in Column A
                    pyautogui.hotkey('ctrl', 'up')
                    time.sleep(1.0)
                    
                    # Go DOWN one cell to the next empty row
                    pyautogui.press('down')
                    time.sleep(1.0)
                    
                    print("[GOOGLE SHEETS] Pasting data into the new row...")
                    pyautogui.hotkey('ctrl', 'v')
                    time.sleep(1.0)
                    
                    # Press Enter to finalize paste
                    pyautogui.press('enter')
                    time.sleep(0.5)
                    
                    print("[GOOGLE SHEETS] Data successfully logged!")
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

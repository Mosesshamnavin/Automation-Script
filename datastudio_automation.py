import pyautogui
import time
import pyperclip
import webbrowser
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

    # Read saved user ID & email if available
    import json, os, re
    player_id = ""
    player_email = ""
    if os.path.exists("last_user.json"):
        try:
            with open("last_user.json", "r") as f:
                data = json.load(f)
                player_id = data.get("id", "")
                player_email = data.get("email", "")
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
                
    if fn and ln:
        print(f"\n[PLAYBISON] Checking duplicates for {fn} {ln} in Users list...")
        webbrowser.open_new_tab("https://api-acnt.playbison.com/platform-admin/#action:admin.users")
        time.sleep(6.0)
        
        js_check_dup = load_macro("ds_check_duplicates.js", FN=fn, LN=ln, CITY=city)
        
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
            print(f"\n\n{'='*60}\n[WARNING] MULTIPLE ACCOUNTS FOUND FOR {fn} {ln} {city}!!!\n{'='*60}\n")
        else:
            print(f"[PLAYBISON] No duplicate accounts found for {fn} {ln}.")
    
    # Detect name mismatch errors
    is_error = verify_raw.startswith("NAMEFAIL:") or "not found in request data" in verify_raw.lower() or verify_raw.startswith("NOTFOUND")
    
    if verify_raw == "COINSPAID_SKIP":
        print(f"\n[PLAYBISON] Operator is COINSPAID. No copy required.")
    elif is_error:
        print(f"\n[PLAYBISON] Name mismatch or error: {verify_raw}")

    
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
        print("[DATASTUDIO] Multibrand (2+ rows) detected. Selecting 'Bison Casino' in Brand filter...")
        js_macro_brand = load_macro("ds_brand_filter.js")
        
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
            
            print("[DATASTUDIO] Re-checking W/D ratio for Bison Casino...")
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

                
                # We must manually type 'javascript:' because Chrome strips it when pasted
                # We also use dispatchEvent because some single-page apps ignore a basic .click()
                # To avoid clicking the global "Notes" menu, we specifically look for the "notes" tab 
                # that comes right after the "edit personal data" tab in the DOM.
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
                
                print("[PLAYBISON] Waiting 6 seconds for notes data to load...")
                time.sleep(6.0)
                
                js_trans_macro = load_macro("ds_check_transactions.js")
                pyperclip.copy(js_trans_macro)
                pyautogui.hotkey('ctrl', 'l')
                time.sleep(0.3)
                pyautogui.write('javascript:')
                time.sleep(0.2)
                pyautogui.hotkey('ctrl', 'v')
                time.sleep(0.3)
                pyautogui.press('enter')
                print("[PLAYBISON] Checked notes & transactions with 'Redeem the bonuses'. Validated note column for 'automatic'.")
                
                print("[PLAYBISON] Waiting 35 seconds for transactions check & multi-page stack pagination...")
                time.sleep(35.0)
                
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
                dep_res = pyperclip.paste().strip()
                last_deposit_id = ""
                if dep_res.startswith("DEP_ID:"):
                    last_deposit_id = dep_res.replace("DEP_ID:", "").strip()
                    if last_deposit_id != "NOT_FOUND":
                        print(f"[PLAYBISON] Extracted Last Deposit ID: {last_deposit_id}")
                    else:
                        print(f"[PLAYBISON] Could not find a DEPOSIT row in the Payment Log.")
                
                # Use the true player_id extracted from the wallet page
                extracted_id = true_player_id
                
                if extracted_id and extracted_id.isdigit():
                    print(f"[PLAYBISON] Using Player ID for PaymentIQ search: {extracted_id}")
                    
                    target_url = "https://backoffice.paymentiq.io/#/user-accounts"
                    print(f"[PAYMENTIQ] Opening {target_url} in a new tab...")
                    pyperclip.copy(target_url)
                    pyautogui.hotkey('ctrl', 't')
                    time.sleep(0.5)
                    pyautogui.hotkey('ctrl', 'v')
                    time.sleep(0.3)
                    pyautogui.press('enter')
                    
                    print("[PAYMENTIQ] Waiting 8 seconds for page to load...")
                    time.sleep(8.0)
                    
                    # Verify we aren't on the login page to avoid locking the account
                    js_check_login = load_macro("piq_check_login.js")
                    
                    pyperclip.copy('WAITING')
                    pyperclip.copy(js_check_login)
                    pyautogui.hotkey('ctrl', 'l')
                    time.sleep(0.3)
                    pyautogui.write('javascript:')
                    time.sleep(0.2)
                    pyautogui.hotkey('ctrl', 'v')
                    time.sleep(0.3)
                    pyautogui.press('enter')
                    
                    time.sleep(1.0)
                    login_status = pyperclip.paste().strip()
                    if login_status == "LOGGED_OUT:YES":
                        print("\n[ERROR] PaymentIQ is logged out (auth portal detected)!")
                        print("[ERROR] Stopping workflow to prevent account lockout.")
                        print("[MAIN] Please log into PaymentIQ manually and restart the script.")
                        return
                    
                    js_piq_macro = load_macro("piq_search_user.js", PLAYER_ID=extracted_id)
                    
                    pyperclip.copy(js_piq_macro)
                    pyautogui.hotkey('ctrl', 'l')
                    time.sleep(0.3)
                    pyautogui.write('javascript:')
                    time.sleep(0.2)
                    pyautogui.hotkey('ctrl', 'v')
                    time.sleep(0.3)
                    pyautogui.press('enter')
                    print(f"[PAYMENTIQ] Searched for user{extracted_id}")
                    
                    print("[PAYMENTIQ] Waiting 8 seconds for search results to load...")
                    time.sleep(8.0)
                    
                    js_piq_check = load_macro("piq_check_results.js")
                    
                    pyperclip.copy('')
                    pyperclip.copy(js_piq_check)
                    pyautogui.hotkey('ctrl', 'l')
                    time.sleep(0.3)
                    pyautogui.write('javascript:')
                    time.sleep(0.2)
                    pyautogui.hotkey('ctrl', 'v')
                    time.sleep(0.3)
                    pyautogui.press('enter')
                    
                    time.sleep(1.5)
                    piq_res = pyperclip.paste().strip()
                    
                    if "HOLDER:" in piq_res and "|SUCCESS:" in piq_res:
                        parts1 = piq_res.replace("HOLDER:", "").split("|SUCCESS:")
                        piq_holder = parts1[0].strip()
                        rest = parts1[1].strip()
                        
                        piq_account = ""
                        if "|ACCOUNT:" in rest:
                            parts2 = rest.split("|ACCOUNT:")
                            piq_success = parts2[0].strip()
                            piq_account = parts2[1].strip()
                        else:
                            piq_success = rest
                        
                        print(f"\n[PAYMENTIQ] Extraction Result - Holder: '{piq_holder}', Last Success: '{piq_success}', Account: '{piq_account}'")
                        
                        import unicodedata
                        def normalize(s):
                            return unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode('utf-8').lower().strip()
                        
                        if normalize(true_player_name) == normalize(piq_holder) and piq_holder:
                            print(f"[CHECK] ✅ Name Match: '{true_player_name}' matches PaymentIQ '{piq_holder}'")
                        else:
                            print(f"[CHECK] ❌ Name MISMATCH! Playbison: '{true_player_name}' vs PaymentIQ: '{piq_holder}'")
                            
                        if piq_success:
                            from datetime import datetime, timedelta
                            try:
                                date_str = piq_success[:10]
                                success_date = datetime.strptime(date_str, "%Y-%m-%d")
                                ninety_days_ago = datetime.now() - timedelta(days=90)
                                if success_date >= ninety_days_ago:
                                    print(f"[CHECK] ✅ Last Success ({date_str}) is within the last 3 months!")
                                else:
                                    print(f"[CHECK] ❌ Last Success ({date_str}) is OLDER than 3 months!")
                            except Exception as e:
                                print(f"[CHECK] ⚠️ Could not parse date '{piq_success}': {e}")
                        else:
                            print("[CHECK] ❌ No Last Success date found in PaymentIQ table (User has no successful deposits/withdrawals here?)")
                            
                        import unicodedata
                        def normalize(s):
                            return unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode('utf-8').lower().strip()
                            
                        is_cc = piq_account and ("*" in piq_account or "x" in piq_account.lower())
                        names_match = (normalize(true_player_name) == normalize(piq_holder))
                        
                        note_text = ""
                        if not names_match and not is_cc:
                            # Condition 1
                            note_text = f"wd {extracted_id} cancelled, 3rd party \"{piq_holder}\" / Req last dep {last_deposit_id}"
                        elif not names_match and is_cc:
                            # Condition 2
                            note_text = f"wd {extracted_id} cancelled, req confirmation of card ownership {piq_account}"
                        elif ratio_val is not None and ratio_val >= 25.0:
                            # Condition 3
                            note_text = f"wd {extracted_id} cancelled, req dep {last_deposit_id}, w/d ratio is {ratio_val}%"
                        elif is_cc:
                            # Condition 4
                            op_upper = playbison_op.upper()
                            if "APPLE PAY" in op_upper or "APPLE" in op_upper:
                                if "BITEXPRO" in op_upper:
                                    note_text = f"wd {extracted_id} cancelled, Req WEBREDIRECT BITEXPRO APPLE PAY"
                                elif "BANK" in op_upper:
                                    note_text = f"wd {extracted_id} cancelled, Req APPLE PAY BANK"
                                elif "ARI10" in op_upper:
                                    note_text = f"wd {extracted_id} cancelled, Req ARI10 APPLE"
                                else:
                                    note_text = f"wd {extracted_id} cancelled, Req WEBREDIRECT APPLE PAY"
                            elif "GOOGLE PAY" in op_upper or "GOOGLE" in op_upper:
                                if "BITEXPRO" in op_upper:
                                    note_text = f"wd {extracted_id} cancelled, Req WEBREDIRECT BITEXPRO GOOGLE PAY"
                                elif "ARI10" in op_upper:
                                    note_text = f"wd {extracted_id} cancelled, Req WEBREDIRECT ARI10 GOOGLE"
                                else:
                                    note_text = f"wd {extracted_id} cancelled, Req WEBREDIRECT GOOGLE PAY"
                            else:
                                note_text = f"wd {extracted_id} cancelled, Req CC {piq_account}"
                                
                        if note_text:
                            print(f"\n[CANCELLATION NOTE] Generated: '{note_text}'")
                            print("[PLAYBISON] Switching back to Playbison to inject note...")
                            # Switch back to Playbison Wallet tab
                            pyautogui.hotkey('ctrl', 'shift', 'tab')
                            time.sleep(1.0)
                            
                            js_add_note = load_macro("ds_add_note.js", NOTE_TEXT=note_text)
                            pyperclip.copy(js_add_note)
                            pyautogui.hotkey('ctrl', 'l')
                            time.sleep(0.3)
                            pyautogui.write('javascript:')
                            time.sleep(0.2)
                            pyautogui.hotkey('ctrl', 'v')
                            time.sleep(0.3)
                            pyautogui.press('enter')
                            
                            time.sleep(1.5)
                            print("[PLAYBISON] Note injected! Set to IMPORTANT. Waiting for manual submit.")
                        else:
                            print("[PHASE 6] No conditions met for cancellation note.")
                    else:
                        print(f"[PAYMENTIQ] Could not extract table data. Raw: {piq_res}")
                else:
                    print(f"[PLAYBISON] Failed to extract ID from table. Clipboard contained: '{extracted_id}'")
            else:
                print("[PLAYBISON] Could not extract wallet_id from modal.")
                print(f"\n[PLAYBISON] Result: {verify_raw}")
        # 'else' block for ratio >= 25% removed because we now proceed for all ratios
    else:
        print("[DATASTUDIO] Could not determine W/D ratio automatically.")
        
    print("\n[MAIN] Script complete! Workflow finished.")

if __name__ == "__main__":
    main()

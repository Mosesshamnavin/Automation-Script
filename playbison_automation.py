import time
import subprocess
import sys
from macro_loader import load_macro

# Auto-install required packages
def install_requirements():
    try:
        import pyautogui
        import pyperclip
    except ImportError:
        print("Installing required packages (pyautogui, pyperclip)...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyautogui", "pyperclip"])
        print("Packages installed!\n")

install_requirements()

import pyautogui
import pyperclip

pyautogui.FAILSAFE = False
pyautogui.PAUSE = 0.05

def main():
    print("\nSwitch to Chrome NOW! (You have 5 seconds...)")
    for i in range(5, 0, -1):
        print(f"{i}...")
        time.sleep(1)
        
    scan_only = "--scan-only" in sys.argv
    
    if scan_only:
        print("\n[LOOP MODE] Refreshing table (clicking Generate) to fetch latest withdrawals...")
        pyautogui.hotkey('ctrl', '1')
        time.sleep(0.4)
        
        # Click Generate to refresh table with any new incoming withdrawals
        js_refresh = load_macro("playbison_refresh.js")
        pyperclip.copy(js_refresh)
        pyautogui.hotkey('ctrl', 'l')
        time.sleep(0.3)
        pyautogui.write('javascript:')
        time.sleep(0.2)
        pyautogui.hotkey('ctrl', 'v')
        time.sleep(0.3)
        pyautogui.press('enter')
        
        print("Waiting 3.5 seconds for fresh table records to load...")
        time.sleep(3.5)
    else:
        print("Executing Phase 1: Navigating...")
        
        # Macro 1: Click the menus
        js_macro_1 = load_macro("playbison_navigate.js")
        pyperclip.copy(js_macro_1)
        
        pyautogui.hotkey('ctrl', 'l')
        time.sleep(0.5)
        pyautogui.write('javascript:')
        time.sleep(0.2)
        pyautogui.hotkey('ctrl', 'v')
        time.sleep(0.5)
        pyautogui.press('enter')
        
        print("\nWaiting 6 seconds for the 'Withdrawals To Confirm' page to fully load...")
        time.sleep(6)
        
        print("Executing Phase 2: Filtering...")
        
        # Macro 2: Click the dropdowns using simulated mouse events to force complex UI components to react
        js_macro_2 = load_macro("playbison_filter.js")
        pyperclip.copy(js_macro_2)
        
        pyautogui.hotkey('ctrl', 'l')
        time.sleep(0.5)
        pyautogui.write('javascript:')
        time.sleep(0.2)
        pyautogui.hotkey('ctrl', 'v')
        time.sleep(0.5)
        pyautogui.press('enter')
        
        print("\nWaiting 4 seconds for the table to filter...")
        time.sleep(4)
        
        print("Executing Phase 3: Navigating to the last page...")
        
        # Macro 3: Extract last page number (using robust regex), scroll to view, and click Go
        js_macro_3 = load_macro("playbison_goto_last_page.js")
        pyperclip.copy(js_macro_3)
        
        pyautogui.hotkey('ctrl', 'l')
        time.sleep(0.5)
        pyautogui.write('javascript:')
        time.sleep(0.2)
        pyautogui.hotkey('ctrl', 'v')
        time.sleep(0.5)
        pyautogui.press('enter')
        
        print("\nWaiting 6 seconds for the last page to load...")
        time.sleep(6)
    
    print("Executing Phase 4: Auto-scanning backwards for non-VIP roles...")
    
    # Ensure Chrome is focused on Tab 1 (Playbison BO)
    pyautogui.hotkey('ctrl', '1')
    time.sleep(0.5)
    
    import json
    import os
    import datetime
    
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    completed_ids = []
    if os.path.exists("completed_ids.json"):
        try:
            with open("completed_ids.json", "r") as f:
                data = json.load(f)
            if isinstance(data, dict):
                if data.get("date") == today_str:
                    completed_ids = data.get("ids", [])
                else:
                    print(f"[STATE] New day detected ({today_str}). Resetting completed_ids.json...")
                    with open("completed_ids.json", "w") as f:
                        json.dump({"date": today_str, "ids": []}, f, indent=2)
                    completed_ids = []
            elif isinstance(data, list):
                completed_ids = data
        except Exception:
            completed_ids = []
            
    # Macro 4: Scan table for non-VIP roles, extract email and ID, and loop via Previous button
    js_macro_4 = load_macro("playbison_scan_nonvip.js")
    js_macro_4 = js_macro_4.replace("/*###COMPLETED_IDS###*/ []", json.dumps(completed_ids))
    pyperclip.copy(js_macro_4)
    
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.5)
    pyautogui.write('javascript:')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)
    pyautogui.press('enter')
    
    print("\n[PLAYBISON] Extraction macro executed successfully.")

if __name__ == "__main__":
    main()
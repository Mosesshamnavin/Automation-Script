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

def main():
    print("\nSwitch to Chrome NOW! (You have 5 seconds...)")
    for i in range(5, 0, -1):
        print(f"{i}...")
        time.sleep(1)
        
    scan_only = "--scan-only" in sys.argv
    
    if scan_only:
        print("\n[LOOP MODE] Skipping Navigation and Filtering. Proceeding directly to Scan...")
        time.sleep(1)
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
    
    # Macro 4: Scan table for non-VIP roles, extract email and ID, and loop via Previous button
    js_macro_4 = load_macro("playbison_scan_nonvip.js")
    pyperclip.copy(js_macro_4)
    
    pyautogui.hotkey('ctrl', 'l')
    time.sleep(0.5)
    pyautogui.write('javascript:')
    time.sleep(0.2)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(0.5)
    pyautogui.press('enter')
    
    # Crucial: Clear the clipboard again so main.py doesn't accidentally read the javascript code!
    time.sleep(0.5)
    pyperclip.copy("WAITING_FOR_EMAIL")
    
    print("\n[PLAYBISON] Extraction macro executed successfully.")

if __name__ == "__main__":
    main()
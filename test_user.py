import webbrowser
import pyperclip
import pyautogui
import time
from macro_loader import load_macro

pyautogui.FAILSAFE = False

wallet_id = "fc355f0f7c3310a65da8b451"
url = f"https://api-acnt.playbison.com/platform-admin/#action:admin.user:{wallet_id}"

print("============================================================")
print("TESTING USER: lschilling@wp.pl (ID: 252078)")
print("============================================================")
print(f"[TEST] Opening wallet page: {url}...")
webbrowser.open(url)

print("\nSwitch to Chrome NOW! (Starting in 5 seconds...)")
for i in range(5, 0, -1):
    print(f"{i}...")
    time.sleep(1)

print("\nExecuting Transactions & Stack Check Macro...")
js_trans_macro = load_macro("ds_check_transactions.js")
pyperclip.copy(js_trans_macro)
pyautogui.hotkey('ctrl', 'l')
time.sleep(0.3)
pyautogui.write('javascript:')
time.sleep(0.2)
pyautogui.hotkey('ctrl', 'v')
time.sleep(0.3)
pyautogui.press('enter')

print("[PLAYBISON] Injected ds_check_transactions.js!")
print("[PLAYBISON] Waiting 35 seconds for multi-page stack calculation...")
time.sleep(35.0)
print("\n[TEST] Test script complete!")

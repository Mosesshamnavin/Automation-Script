# Automation Workflow Guide

This document outlines the step-by-step process for running the full Playbison and Data Studio automation.

## Master Script (Full Automated Workflow)

Run both steps automatically in sequence:
```bash
python main.py
```

---

## Part 1: Playbison Data Extraction (`playbison_automation.py`)

1. **Prepare your Browser:**
   - Open Google Chrome.
   - Navigate to the **Playbison Admin Dashboard**.
   - Make sure you are on the `Withdrawals To Confirm` page.

2. **Start the Script:**
   - Open your terminal in VS Code (or command prompt).
   - Run the command: `python playbison_automation.py`
   - Press **ENTER** when prompted.

3. **Hands-Off Execution:**
   - You have **5 seconds** to click on your Chrome window to bring it to the front.
   - **DO NOT touch your mouse or keyboard!** The script will now take over.
   - **Phase 1 & 2:** It will automatically select `Verified` in the Player Status dropdown and click `Generate`.
   - **Phase 3:** It will automatically read the total number of pages and jump straight to the last page.
   - **Phase 4:** It will automatically scan the `roles` column. If the role field does not contain `VIP`, it selects that user. Otherwise, it clicks `<- Previous` and scans the next page.

4. **Copy the Email:**
   - Once it finds a non-VIP role, execution will pause and a browser popup will appear with the user's email already highlighted.
   - Press `Ctrl + C` on your keyboard to copy the email.
   - Press `Enter` (or click OK) to close the popup.

---

## Part 2: Google Data Studio Input (`datastudio_automation.py`)

1. **Start the Second Script:**
   - Go back to your terminal in VS Code.
   - Run the command: `python datastudio_automation.py`
   - Press **ENTER** when prompted.

2. **Hands-Off Execution:**
   - You have 5 seconds to click on your Chrome window to bring it to the front.
   - The script will automatically open a new tab to your Google Data Studio report.
   - It will wait **15 seconds** for the heavy dashboard to fully load.
   - **Phase 1:** It will automatically click the `Bison BO` tab at the top.
   - **Phase 2:** It will locate the `Email (lowercase)` input box and automatically **paste** the email you copied.
   - **Phase 3:** It will open the Date Picker calendar and filter by the last 2 months.
   - **Phase 4 (W/D Ratio Check & Modal Verification):** It inspects the `W/D ratio (volumes)` cell in Data Studio. If the ratio is **below 25%**, it automatically:
     1. Switches your Chrome window back to the **Playbison Admin** tab (`Withdrawals To Confirm`).
     2. Highlights the matching row on Playbison and **clicks the Player ID** to open the `Payments Details` modal.
     3. Reads `first name` and `last name` from `Account details` and verifies they match the `request data` (handling Polish diacritics / accents).
     4. If matched, extracts and **copies the full `maskedAccount` value** directly to your clipboard!
     5. Automatically **opens the `wallet_id` link in a new tab** and switches Chrome focus to that page!

## Troubleshooting

- **"Could not find Go button" / "Could not find Player Status":** This usually happens if the page took too long to load or your Chrome window wasn't in focus. Just refresh the page and run `python playbison_automation.py` again.
- **Data Studio doesn't paste the email:** Data Studio can take time to load; ensure internet connection is stable.
- **Modal Verification & Wallet Navigation:** If the name matches `request data`, the script copies `maskedAccount` to your clipboard and opens the `wallet_id` page in a new tab automatically.

# Automation Workflow Guide

This document outlines the step-by-step process for running the full Playbison and Data Studio automation.

## Part 1: Playbison Data Extraction

1. **Prepare your Browser:**
   - Open Google Chrome.
   - Navigate to the **Playbison Admin Dashboard**.
   - Make sure you are on the `Withdrawals To Confirm` page.

2. **Start the Script:**
   - Open your terminal in VS Code (or command prompt).
   - Run the command: `python automate.py`
   - Press **ENTER** when prompted.

3. **Hands-Off Execution:**
   - You have **5 seconds** to click on your Chrome window to bring it to the front.
   - **DO NOT touch your mouse or keyboard!** The script will now take over.
   - **Phase 1 & 2:** It will automatically select `Verified` in the Player Status dropdown and click `Generate`.
   - **Phase 3:** It will automatically read the total number of pages and jump straight to the last page.
   - **Phase 4:** It will automatically scan the `roles` column. If it finds no empty roles, it clicks `<- Previous` and scans the next page until it finds one.

4. **Copy the Email:**
   - Once it finds an empty role, execution will pause and a browser popup will appear with the user's email already highlighted.
   - Press `Ctrl + C` on your keyboard to copy the email.
   - Press `Enter` (or click OK) to close the popup.

---

## Part 2: Google Data Studio Input

1. **Start the Second Script:**
   - Go back to your terminal in VS Code.
   - Run the command: `python datastudio.py`
   - Press **ENTER** when prompted.

2. **Hands-Off Execution:**
   - You have 5 seconds to click on your Chrome window to bring it to the front.
   - The script will automatically open a new tab to your Google Data Studio report.
   - It will wait **15 seconds** for the heavy dashboard to fully load.
   - **Phase 1:** It will automatically click the `Bison BO` tab at the top.
   - **Phase 2:** It will locate the `Email (lowercase)` input box and automatically **paste** the email you copied.
   - **Phase 3:** It will open the Date Picker calendar so we can filter the data by the last 2 months (this logic is currently being fine-tuned).

## Troubleshooting

- **"Could not find Go button" / "Could not find Player Status":** This usually happens if the page took too long to load or your Chrome window wasn't in focus. Just refresh the page and run `python automate.py` again.
- **Data Studio doesn't paste the email:** Ensure you actually pressed `Ctrl+C` when the prompt appeared in Part 1. Data Studio can also take a very long time to load; if your internet is slow, the 15-second timer might run out before the page is fully rendered.

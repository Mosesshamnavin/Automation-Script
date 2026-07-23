# Automation Workflow Guide

This document outlines the step-by-step process for running the full Playbison and Data Studio automation master script.

---

## Master Script (Full Automated Workflow)

Run all steps automatically in sequence:
```bash
python main.py
```

---

## Complete Workflow Overview

### Part 1: Playbison Data Extraction (`playbison_automation.py`)
1. **Prepare Browser:** Open Google Chrome and navigate to the **Playbison Admin Dashboard** (`Withdrawals To Confirm` page).
2. **Start Script:** Run `python main.py` (or `python playbison_automation.py`).
3. **Execution:**
   - **Phase 1 & 2:** Automatically filters `Verified` in Player Status and generates the table.
   - **Phase 3:** Jumps directly to the last page.
   - **Phase 4:** Scans backwards for non-VIP roles (`roles` column does not contain `VIP`).
   - Automatically extracts the matching player's email & Player ID and saves it to `last_user.json` (also copied to clipboard).

---

### Part 2: Google Data Studio Input & W/D Ratio Check (`datastudio_automation.py`)
1. Automatically opens Google Data Studio in a new Chrome tab.
2. Focuses `Email (lowercase)` input field and types the extracted email.
3. Sets the Date Picker filter to the last 2 months.
4. Reads the **W/D ratio (volumes)** cell:
   - If ratio is **>= 25%**: No action needed, workflow finishes.
   - If ratio is **< 25%**: Proceed to Part 3 (Payment Details & Wallet Verification).

---

### Part 3: Payment Details, Notes & Transactions Verification
If W/D ratio is **< 25%**:

1. **Payment Details Modal:**
   - Returns to Playbison and clicks the matching Player ID to open the `Payments Details` modal.
   - **Operator Rules:**
     - **BANK WITHDRAWAL PIQ**: Validates first & last name against request data (handling accents/diacritics). If matched, copies `maskedAccount`.
     - **PAYSAFECARD / SKRILL**: Skips name check (`accountHolder` is null) and copies email from `maskedAccount`.
     - **COINSPAID**: Skips copy operation (`maskedAccount` and `accountHolder` are null).

2. **Wallet Navigation & Notes Tab:**
   - Extracts the `wallet_id` and opens `https://api-acnt.playbison.com/platform-admin/#action:admin.user:<wallet_id>` in a new tab.
   - Waits for wallet profile to load, then automatically clicks the user profile **`notes`** tab (specifically the tab next to `edit personal data`).

3. **Notes Inspection & Transactions Tab:**
   - Waits for Notes table to load and inspects the **top row** of the Results table.
   - If the `type` column contains **`normal`** or **`payment`**:
     - Automatically clicks the user profile **`transactions`** tab (located next to `freespins`).

4. **Transactions Filtering & Validation:**
   - **Stage 1 (Initial Filter):**
     - Clears the pre-populated `Wallet ID` field.
     - Selects **`Redeem the bonuses`** in the `Type` dropdown.
     - Computes the date **1 month ago** from today and sets `Date From` (`YYYY-MM-DD 00:00`).
     - Clicks **`Search`**.
   - **Stage 2 (Automatic Note Check & Fallback Search):**
     - Waits for results to load and inspects the `note` column across all result rows (calculating true column index via header `colspan` attributes).
     - **If EVERY row contains `"automatic"` in the note field:** Search complete! No further action taken.
     - **If ANY row lacks `"automatic"` (or note is blank):**
       - Resets `Type` dropdown to the blank option.
       - Sets `Amount Range In (To)` to **`-8.01`**.
       - Clicks **`Search`** again.

---

## File Structure

- `main.py` - Master controller script that executes Part 1 and Part 2 in order.
- `playbison_automation.py` - Handles Playbison withdrawal table filtering & non-VIP email extraction.
- `datastudio_automation.py` - Handles Data Studio W/D ratio check, Playbison modal check, Wallet profile navigation, Notes inspection, and Transactions filtering.
- `last_user.json` - Temporary data bridge used automatically between Part 1 and Part 2.
- `.gitignore` - Ignores `__pycache__` and temporary system files.

---

## Troubleshooting

- **Chrome popup blocker:** All URL navigations are handled via native browser commands or address bar macros to bypass popup blockers.
- **Chrome address bar security (`javascript:` prefix):** Macros type `javascript:` character-by-character to prevent Chrome from searching Google.
- **React state updates:** Input fields (like Wallet ID, Date From, and Amount Range) use React-compatible native setters to guarantee state updates trigger properly.

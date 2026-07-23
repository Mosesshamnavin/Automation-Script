# Complete Workflow Overview

This document details the exact sequence of actions performed by the Playbison to Data Studio Automation Script.

## Part 1: Playbison Data Extraction (`playbison_automation.py`)
1. **Prepare Browser:** Open Google Chrome and navigate to the **Playbison Admin Dashboard** (`Withdrawals To Confirm` page).
2. **Start Script:** Run `python main.py`.
3. **Execution:**
   - **Phase 1 & 2:** Automatically filters `Verified` in Player Status and generates the table.
   - **Phase 3:** Jumps directly to the last page.
   - **Phase 4:** Scans backwards for non-VIP roles (`roles` column does not contain `VIP`).
   - Automatically extracts the matching player's email & Player ID and saves it to `last_user.json` (also copied to clipboard).

## Part 2: Google Data Studio Input & W/D Ratio Check (`datastudio_automation.py`)
1. Automatically opens Google Data Studio in a new Chrome tab.
2. Focuses `Email (lowercase)` input field and types the extracted email.
3. Sets the Date Picker filter to the last 2 months.
4. Reads the **W/D ratio (volumes)** cell:
   - If ratio is **>= 25%**: No action needed, workflow finishes.
   - If ratio is **< 25%**: Proceed to Part 3 (Payment Details & Wallet Verification).

## Part 3: Payment Details, Notes & Transactions Verification
If W/D ratio is **< 25%**:

1. **Payment Details Modal:**
   - Returns to Playbison and clicks the matching Player ID to open the `Payments Details` modal.
   - **Operator Rules:**
     - **BANK WITHDRAWAL PIQ**: Validates first & last name against request data. If matched, copies `maskedAccount`.
     - **PAYSAFECARD / SKRILL**: Skips name check and copies email from `maskedAccount`.
     - **COINSPAID**: Skips copy operation.

2. **Wallet Navigation & Notes Tab:**
   - Extracts the `wallet_id` and opens the user's wallet profile in a new tab.
   - Waits for wallet profile to load, then automatically clicks the **`notes`** tab.

3. **Notes Inspection & Transactions Tab:**
   - Inspects the **top row** of the Results table.
   - If the `type` column contains **`normal`** or **`payment`**, it clicks the **`transactions`** tab.

4. **Transactions Filtering & Validation:**
   - **Stage 1 (Initial Filter):**
     - Selects **`Redeem the bonuses`** in the `Type` dropdown.
     - Sets `Date From` to **1 month ago**.
     - Clicks **`Search`**.
   - **Stage 2 (Automatic Note Check & Fallback Search):**
     - Inspects the `note` column across all result rows.
     - **If EVERY row contains `"automatic"` in the note field:** Search complete! No further action taken in this tab.
     - **If ANY row lacks `"automatic"`:** Resets `Type` dropdown to blank, sets `Amount Range In (To)` to **`-8.01`**, and clicks **`Search`** again.

5. **Payment Log Validation:**
   - Switches to the **`payment log`** tab.
   - Locates the Status filter inside the modal.
   - Automatically selects both **`Pending`** and **`Completed`** options.
   - Clicks **`Search`** and waits for the results table to generate.

## Part 4: PaymentIQ Search Integration
1. Extracts the **ID** from the very first row of the newly generated Payment Log results table.
2. Opens a new tab directed to `https://backoffice.paymentiq.io/#/user-accounts`.
3. Automatically locates the PaymentIQ search bar.
4. Inputs `user` followed by the extracted ID (e.g., `user5958366`) and submits the search to pull up the user's payment records.

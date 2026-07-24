# Complete Workflow Overview

This document details the exact sequence of actions performed by the Playbison to Data Studio Automation Script.

## Part 1: Initial Playbison Data Extraction (`playbison_automation.py`)
1. **Prepare Browser:** Open Google Chrome and navigate to the **Playbison Admin Dashboard** (`Withdrawals To Confirm` page).
2. **Start Script:** Run `python main.py`.
3. **Execution:**
   - **Phase 1 & 2:** Automatically filters `Verified` in Player Status and generates the table.
   - **Phase 3:** Jumps directly to the last page.
   - **Phase 4:** Scans backwards for non-VIP roles (`roles` column does not contain `VIP`).
   - Automatically extracts the matching player's email & Player ID and saves it to `last_user.json`.

## Part 2: Payment Details & Duplicate Checking (`datastudio_automation.py`)
1. **Payment Details Modal:**
   - Instantly opens the `Payments Details` modal for the extracted Player ID.
   - Extracts the player's First Name, Last Name, City, and `maskedAccount`.
   - Also extracts the internal `wallet_id`.
   - **Operator Rules:**
     - **BANK WITHDRAWAL PIQ**: Validates first & last name against request data.
     - **PAYSAFECARD / SKRILL**: Skips name check.
     - **COINSPAID**: Skips copy operation.
2. **Duplicate Search:**
   - Opens the Playbison `Users` list in a new tab.
   - Automatically injects the First Name and Last Name into the search filters.
   - If multiple results appear, it adds the City to the search filter.
   - If multiple results still appear, it flags a massive `[WARNING]` in the terminal for duplicate accounts.

## Part 3: Google Data Studio Input & W/D Ratio Check
1. Automatically opens Google Data Studio in a new Chrome tab.
2. Focuses `Email (lowercase)` input field and types the extracted email.
3. Sets the Date Picker filter to the last 2 months.
4. Reads the **W/D ratio (volumes)** cell.

## Part 4: Wallet Verification, Notes & Transactions
1. **Wallet Navigation & Notes Tab:**
   - Directly opens the user's wallet profile in a new tab using the `wallet_id` extracted earlier (bypassing the need to switch back to the original table tab).
   - Waits for wallet profile to load, then automatically clicks the **`notes`** tab.
2. **Notes Inspection & Transactions Tab:**
   - Inspects the top row of the Results table.
   - If the `type` column contains **`normal`** or **`payment`**, it clicks the **`transactions`** tab.
3. **Transactions Filtering & Validation:**
   - Selects **`Redeem the bonuses`** in the `Type` dropdown and sets `Date From` to **1 month ago**.
   - Inspects the `note` column across all result rows.
   - If any row lacks `"automatic"`, it sets `Amount Range In (To)` to **`-8.01`** and clicks Search again.
4. **Payment Log Validation:**
   - Switches to the **`payment log`** tab.
   - Automatically selects both **`Pending`** and **`Completed`** options and searches.

## Part 5: PaymentIQ Search & CC Note Injection
1. Opens a new tab directed to `https://backoffice.paymentiq.io/#/user-accounts`.
2. Automatically inputs `user<ID>` and submits the search.
3. **Credit Card Check:**
   - Extracts the `Holder`, `Last Success`, and `Account` columns from the results table.
   - Checks if the `Account` value contains asterisks (`*`) or `x` (indicating a credit card).
   - If a credit card is detected, the script automatically switches back to the Playbison Wallet tab, types `<cc_value> required cc` into the Notes textarea, and clicks **Add Note**.

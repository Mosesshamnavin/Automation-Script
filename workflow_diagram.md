# Automation Workflow Diagram

Here is the complete sequence of actions that the automation scripts currently perform, mapped out as a flowchart.

```mermaid
graph TD
    %% Main Script Entry
    A[Start: main.py] --> B[Run playbison_automation.py]
    
    %% Playbison Extraction
    subgraph Phase 1: Playbison Initial Extraction
        B --> C[Navigate to 'Withdrawals To Confirm']
        C --> D[Filter by 'Verified' Player Status]
        D --> E[Navigate to the last page of results]
        E --> F[Scan for Non-VIP roles backwards]
        F --> G[Extract Email and Player ID]
    end
    
    %% Passing Data
    G --> H[main.py captures clipboard data]
    H --> I[Save to last_user.json]
    I --> J[Run datastudio_automation.py]

    %% Payment Details & Duplicate Check
    subgraph Phase 2: Payment Details & Duplicate Check
        J --> K[Open Player ID modal]
        K --> L{Extract maskedAccount & wallet_id}
        L -- COINSPAID --> M[Skip Copy]
        L -- Name Mismatch / Error --> N[Print Error]
        L -- Check passed --> O[Open Users List in New Tab]
        M --> O
        N --> O
        
        O --> P[Inject First Name & Last Name to Search]
        P --> Q{Multiple Results?}
        Q -- Yes --> R[Inject City to Search]
        Q -- No --> S[Duplicate Check Passed]
        R --> T{Multiple Results?}
        T -- Yes --> U[Log Duplicate Warning]
        T -- No --> S
        U --> V[Proceed to Data Studio]
        S --> V
    end

    %% Data Studio Phase
    subgraph Phase 3: Data Studio W/D Check
        V --> W[Open Google Data Studio]
        W --> X[Focus Email input and paste Email]
        X --> Y[Set Date Range to past 2 months]
        Y --> Z[Extract W/D Ratio from table]
    end
    
    %% Ratio Decision Logic
    Z --> AA{W/D Ratio Check}
    AA -- "Ratio < 25%" --> AB[Log Ratio & Proceed]
    AA -- "Ratio >= 25%" --> AC[Log Ratio & Proceed for Manual Cancellation]
    AC --> AB
    
    %% Playbison Deep Check
    subgraph Phase 4: Playbison Wallet & Transactions
        AB --> AD[Open wallet_id directly in new tab]
        AD --> AE[Open Notes Tab]
        AE --> AF[Open Transactions Tab]
        AF --> AG[Check 'Redeem the bonuses' & Note 'automatic']
        AG --> AH[Set Amount range in to -8.01]
        AH --> AI[Open Payment Log Tab]
        AI --> AJ[Select 'Pending' & 'Completed' Status]
    end
    
    %% PaymentIQ
    subgraph Phase 5: PaymentIQ Search & CC Note
        AJ --> AK[Load original Player ID from last_user.json]
        AK --> AL[Open PaymentIQ in new tab]
        AL --> AM[Search for user+ID]
        AM --> AN[Extract Holder, Last Success, Account]
        AN --> AO{Account is CC?}
        AO -- Yes --> AP[Switch to Playbison Wallet Tab]
        AP --> AQ[Inject 'required cc' Note]
        AQ --> AR([Workflow Complete])
        AO -- No --> AR
    end
    
    %% Styling
    classDef startEnd fill:#f9f,stroke:#333,stroke-width:2px;
    classDef phase1 fill:#e1f5fe,stroke:#03a9f4,stroke-width:2px;
    classDef phase2 fill:#fff3e0,stroke:#ff9800,stroke-width:2px;
    classDef phase3 fill:#e8f5e9,stroke:#4caf50,stroke-width:2px;
    classDef phase4 fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px;
    classDef phase5 fill:#ffcdd2,stroke:#f44336,stroke-width:2px;
    classDef decision fill:#fff9c4,stroke:#fbc02d,stroke-width:2px;
    
    class A,AR startEnd;
    class B,C,D,E,F,G phase1;
    class K,L,M,N,O,P,Q,R,S,T,U phase2;
    class V,W,X,Y,Z phase3;
    class AD,AE,AF,AG,AH,AI,AJ phase4;
    class AK,AL,AM,AN,AO,AP,AQ phase5;
    class Q,T,AA,AO,L decision;
```

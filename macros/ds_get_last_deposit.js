(function () {
  function getFrames() {
    let docs = [document];
    let frames = document.querySelectorAll("iframe, frame");
    for (let f of frames) {
      try {
        if (f.contentDocument || f.contentWindow.document)
          docs.push(f.contentDocument || f.contentWindow.document);
      } catch (e) {}
    }
    return docs;
  }

  let depositInfo = null;

  for (let doc of getFrames()) {
    let tables = Array.from(doc.querySelectorAll("table"));
    for (let tbl of tables) {
      let allTrs = Array.from(tbl.querySelectorAll("tr"));
      if (allTrs.length === 0) continue;

      let headerCells = Array.from(allTrs[0].children);
      let typeIdx = headerCells.findIndex(
        (c) => c.textContent.trim().toLowerCase() === "type",
      );
      let idIdx = headerCells.findIndex(
        (c) => c.textContent.trim().toLowerCase() === "id",
      );
      let statusIdx = headerCells.findIndex(
        (c) => c.textContent.trim().toLowerCase() === "status",
      );
      let opIdx = headerCells.findIndex(
        (c) => c.textContent.trim().toLowerCase() === "operator name",
      );
      let notesIdx = headerCells.findIndex(
        (c) => c.textContent.trim().toLowerCase() === "notes",
      );

      if (typeIdx !== -1 && idIdx !== -1 && statusIdx !== -1) {
        let dataRows = allTrs.slice(1);

        // --- Find first completed DEPOSIT row ---
        let depositRow = dataRows.find((tr) => {
          if (tr.children.length > Math.max(typeIdx, statusIdx)) {
            let typeVal = tr.children[typeIdx].textContent.trim().toUpperCase();
            let statusVal = tr.children[statusIdx].textContent
              .trim()
              .toUpperCase();
            return (
              (typeVal === "DEPOSIT" ||
                typeVal.startsWith("DEP") ||
                typeVal === "D") &&
              (statusVal.includes("COMPLETED") ||
                statusVal.includes("APPROVED") ||
                statusVal.includes("SUCCESS") ||
                statusVal === "C")
            );
          }
          return false;
        });

        // --- Count ALL completed CC / PAYMENTIQ deposits (first-time vs repeat) ---
        let ccDepCount = 0;
        dataRows.forEach((tr) => {
          if (tr.children.length > Math.max(typeIdx, statusIdx, opIdx)) {
            let typeVal = tr.children[typeIdx].textContent.trim().toUpperCase();
            let statusVal = tr.children[statusIdx].textContent
              .trim()
              .toUpperCase();
            if (
              (typeVal === "DEPOSIT" ||
                typeVal.startsWith("DEP") ||
                typeVal === "D") &&
              (statusVal.includes("COMPLETED") ||
                statusVal.includes("APPROVED") ||
                statusVal.includes("SUCCESS") ||
                statusVal === "C") &&
              opIdx !== -1
            ) {
              let opRaw = tr.children[opIdx].textContent
                .trim()
                .toUpperCase()
                .replace(/[\s_\-]/g, "");
              if (
                opRaw.includes("CREDITCARD") ||
                opRaw.includes("PAYMENTIQCREDIT") ||
                opRaw.includes("PAYMENTIQ")
              ) {
                ccDepCount++;
              }
            }
          }
        });

        // --- Check top Payment Log note for 'req' ---
        let hasReq = "NO";
        if (notesIdx !== -1 && allTrs.length > 1) {
          if (allTrs[1].children.length > notesIdx) {
            let topNotes =
              allTrs[1].children[notesIdx].textContent.toLowerCase();
            if (topNotes.includes("req")) {
              hasReq = "YES";
            }
          }
        }

        // --- Scan ALL notes cells for 'cc ver' (CC already verified) ---
        let ccVerInLog = "NO";
        if (notesIdx !== -1) {
          for (let tr of dataRows) {
            if (tr.children.length > notesIdx) {
              let cellTxt = tr.children[notesIdx].textContent
                .toLowerCase()
                .replace(/[\s_\-]/g, "");
              if (
                cellTxt.includes("ccver") ||
                cellTxt.includes("ccverified") ||
                cellTxt.includes("cardver")
              ) {
                ccVerInLog = "YES";
                break;
              }
            }
          }
        }

        // --- Find withdrawal row (prefer Pending, else first withdraw) ---
        let withdrawRow = dataRows.find((tr) => {
          if (tr.children.length > Math.max(typeIdx, statusIdx)) {
            let typeVal = tr.children[typeIdx].textContent.trim().toUpperCase();
            let statusVal = tr.children[statusIdx].textContent
              .trim()
              .toUpperCase();
            return (
              (typeVal.startsWith("WITHDRAW") ||
                typeVal === "W" ||
                typeVal.includes("PAYOUT")) &&
              statusVal.includes("PENDING")
            );
          }
          return false;
        });
        if (!withdrawRow) {
          withdrawRow = dataRows.find((tr) => {
            if (tr.children.length > typeIdx) {
              let typeVal = tr.children[typeIdx].textContent
                .trim()
                .toUpperCase();
              return (
                typeVal.startsWith("WITHDRAW") ||
                typeVal === "W" ||
                typeVal.includes("PAYOUT")
              );
            }
            return false;
          });
        }

        let depOpName = "NOT_FOUND";
        if (depositRow && opIdx !== -1 && depositRow.children.length > opIdx) {
          depOpName = depositRow.children[opIdx].textContent.trim();
        }

        let withOpName = "NOT_FOUND";
        if (
          withdrawRow &&
          opIdx !== -1 &&
          withdrawRow.children.length > opIdx
        ) {
          withOpName = withdrawRow.children[opIdx].textContent.trim();
        }

        let dateIdx = headerCells.findIndex((c) => {
          let t = c.textContent.trim().toLowerCase();
          return (
            t === "created" ||
            t === "date" ||
            t === "created at" ||
            t === "created date" ||
            t === "time"
          );
        });
        let amountIdx = headerCells.findIndex((c) => {
          let t = c.textContent.trim().toLowerCase();
          return (
            t === "amount" ||
            t === "value" ||
            t === "w value" ||
            t === "t value" ||
            t.includes("amount") ||
            t.includes("value")
          );
        });
        let currIdx = headerCells.findIndex((c) => {
          let t = c.textContent.trim().toLowerCase();
          return (
            t === "currency" ||
            t === "w currency" ||
            t === "t currency" ||
            t.includes("curr")
          );
        });

        let depDate = "";
        if (
          depositRow &&
          dateIdx !== -1 &&
          depositRow.children.length > dateIdx
        ) {
          depDate = depositRow.children[dateIdx].textContent.trim();
        }

        let depVal = "";
        let depCurr = "";
        if (depositRow) {
          if (amountIdx !== -1 && depositRow.children.length > amountIdx) {
            depVal = depositRow.children[amountIdx].textContent.trim();
          }
          if (currIdx !== -1 && depositRow.children.length > currIdx) {
            depCurr = depositRow.children[currIdx].textContent.trim();
          }
        }

        // --- Find previous completed withdrawal row (prior to current) ---
        let prevWithRow = dataRows.find((tr) => {
          if (
            tr !== withdrawRow &&
            tr.children.length > Math.max(typeIdx, statusIdx)
          ) {
            let typeVal = tr.children[typeIdx].textContent.trim().toUpperCase();
            let statusVal = tr.children[statusIdx].textContent
              .trim()
              .toUpperCase();
            return (
              (typeVal.startsWith("WITHDRAW") ||
                typeVal === "W" ||
                typeVal.includes("PAYOUT")) &&
              (statusVal.includes("COMPLETED") ||
                statusVal.includes("APPROVED") ||
                statusVal.includes("SUCCESS") ||
                statusVal === "C" ||
                statusVal.includes("SENT"))
            );
          }
          return false;
        });

        let prevWithDate = "";
        let prevWithVal = "";
        let prevWithCurr = "";
        if (prevWithRow) {
          if (dateIdx !== -1 && prevWithRow.children.length > dateIdx) {
            prevWithDate = prevWithRow.children[dateIdx].textContent.trim();
          }
          if (amountIdx !== -1 && prevWithRow.children.length > amountIdx) {
            prevWithVal = prevWithRow.children[amountIdx].textContent.trim();
          }
          if (currIdx !== -1 && prevWithRow.children.length > currIdx) {
            prevWithCurr = prevWithRow.children[currIdx].textContent.trim();
          }
        }

        let withId = "";
        let withVal = "";
        let withCurr = "";
        let withDate = "";

        if (withdrawRow) {
          if (idIdx !== -1 && withdrawRow.children.length > idIdx) {
            withId = withdrawRow.children[idIdx].textContent.trim();
          }
          if (amountIdx !== -1 && withdrawRow.children.length > amountIdx) {
            withVal = withdrawRow.children[amountIdx].textContent.trim();
          }
          if (currIdx !== -1 && withdrawRow.children.length > currIdx) {
            withCurr = withdrawRow.children[currIdx].textContent.trim();
          }
          if (dateIdx !== -1 && withdrawRow.children.length > dateIdx) {
            withDate = withdrawRow.children[dateIdx].textContent.trim();
          }
        }

        // --- Same-day OTHER withdrawals: Pending + Completed ONLY (exclude Cancelled) ---
        function ymdOf(s) {
          let m = String(s || "").match(/(20\d\d-\d\d-\d\d)/);
          return m ? m[1] : "";
        }
        function parseAmt(s) {
          let n = parseFloat(
            String(s || "")
              .replace(/[^\d.\-]/g, "")
              .replace(",", "."),
          );
          return isNaN(n) ? 0 : Math.abs(n);
        }
        function isPendingOrCompleted(statusVal) {
          let s = (statusVal || "").toUpperCase();
          if (s.includes("CANCEL")) return false;
          return (
            s.includes("PENDING") ||
            s.includes("COMPLETED") ||
            s.includes("APPROVED") ||
            s.includes("SUCCESS") ||
            s === "C" ||
            s.includes("SENT") ||
            s.includes("CONFIRM")
          );
        }
        let curYmd = ymdOf(withDate);
        let sameDayOtherVal = 0;
        let sameDayOtherCurr = withCurr || "PLN";
        let sameDayCount = 0;
        if (curYmd && dateIdx !== -1 && statusIdx !== -1) {
          // Count current if it is Pending/Completed
          let curStatus =
            withdrawRow && withdrawRow.children.length > statusIdx
              ? withdrawRow.children[statusIdx].textContent.trim()
              : "";
          if (isPendingOrCompleted(curStatus)) sameDayCount = 1;

          for (let tr of dataRows) {
            if (tr === withdrawRow) continue;
            if (tr.children.length <= Math.max(typeIdx, dateIdx, statusIdx))
              continue;
            let typeVal = tr.children[typeIdx].textContent.trim().toUpperCase();
            if (
              !(
                typeVal.startsWith("WITHDRAW") ||
                typeVal === "W" ||
                typeVal.includes("PAYOUT")
              )
            )
              continue;
            let statusVal = tr.children[statusIdx].textContent.trim();
            if (!isPendingOrCompleted(statusVal)) continue;
            let rowDate = tr.children[dateIdx].textContent.trim();
            if (ymdOf(rowDate) !== curYmd) continue;
            sameDayCount++;
            let rowAmt = 0;
            if (amountIdx !== -1 && tr.children.length > amountIdx) {
              rowAmt = parseAmt(tr.children[amountIdx].textContent.trim());
            }
            sameDayOtherVal += rowAmt;
            if (
              !sameDayOtherCurr &&
              currIdx !== -1 &&
              tr.children.length > currIdx
            ) {
              sameDayOtherCurr =
                tr.children[currIdx].textContent.trim() || sameDayOtherCurr;
            }
          }
        }

        depositInfo = {
          depOp: depOpName,
          withOp: withOpName,
          req: hasReq,
          ccDepCount: ccDepCount,
          ccVerInLog: ccVerInLog,
          depDate: depDate,
          depVal: depVal,
          depCurr: depCurr,
          prevWithDate: prevWithDate,
          prevWithVal: prevWithVal,
          prevWithCurr: prevWithCurr,
          withId: withId,
          withVal: withVal,
          withCurr: withCurr,
          withDate: withDate,
          sameDayOtherVal: sameDayOtherVal ? String(sameDayOtherVal) : "",
          sameDayOtherCurr: sameDayOtherCurr || "",
          sameDayCount: String(sameDayCount || 0),
        };
        break;
      }
    }
    if (depositInfo) break;
  }

  if (depositInfo) {
    let input = document.createElement("input");
    input.value =
      "DEP_OP:" +
      depositInfo.depOp +
      "|WITH_OP:" +
      depositInfo.withOp +
      "|DOC:" +
      depositInfo.req +
      "|CC_DEP_COUNT:" +
      depositInfo.ccDepCount +
      "|CC_VER:" +
      depositInfo.ccVerInLog +
      "|DEP_DATE:" +
      depositInfo.depDate +
      "|DEP_VAL:" +
      (depositInfo.depVal || "") +
      "|DEP_CURR:" +
      (depositInfo.depCurr || "") +
      "|PREV_WITH_DATE:" +
      depositInfo.prevWithDate +
      "|PREV_WITH_VAL:" +
      (depositInfo.prevWithVal || "") +
      "|PREV_WITH_CURR:" +
      (depositInfo.prevWithCurr || "") +
      "|SAME_DAY_OTHER_VAL:" +
      (depositInfo.sameDayOtherVal || "") +
      "|SAME_DAY_OTHER_CURR:" +
      (depositInfo.sameDayOtherCurr || "") +
      "|SAME_DAY_COUNT:" +
      (depositInfo.sameDayCount || "0") +
      "|WITH_ID:" +
      (depositInfo.withId || "") +
      "|WITH_VAL:" +
      (depositInfo.withVal || "") +
      "|WITH_CURR:" +
      (depositInfo.withCurr || "") +
      "|WITH_DATE:" +
      (depositInfo.withDate || "");
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
    return;
  }

  let input = document.createElement("input");
  input.value =
    "DEP_OP:NOT_FOUND|WITH_OP:NOT_FOUND|DOC:NO|CC_DEP_COUNT:0|CC_VER:NO|DEP_DATE:|PREV_WITH_DATE:";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
})();

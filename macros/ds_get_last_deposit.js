(function () {
  function getFrames() {
    let docs = [document];
    let frames = document.querySelectorAll('iframe, frame');
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
    let tables = Array.from(doc.querySelectorAll('table'));
    for (let tbl of tables) {
      let allTrs = Array.from(tbl.querySelectorAll('tr'));
      if (allTrs.length === 0) continue;
      
      let headerCells = Array.from(allTrs[0].children);
      let typeIdx = headerCells.findIndex(c => c.textContent.trim().toLowerCase() === 'type');
      let idIdx = headerCells.findIndex(c => c.textContent.trim().toLowerCase() === 'id');
      let statusIdx = headerCells.findIndex(c => c.textContent.trim().toLowerCase() === 'status');
      let opIdx = headerCells.findIndex(c => c.textContent.trim().toLowerCase() === 'operator name');
      let notesIdx = headerCells.findIndex(c => c.textContent.trim().toLowerCase() === 'notes');

      if (typeIdx !== -1 && idIdx !== -1 && statusIdx !== -1) {
        let dataRows = allTrs.slice(1);

        // --- Find first completed DEPOSIT row ---
        let depositRow = dataRows.find(tr => {
          if (tr.children.length > Math.max(typeIdx, statusIdx)) {
            let typeVal = tr.children[typeIdx].textContent.trim().toUpperCase();
            let statusVal = tr.children[statusIdx].textContent.trim().toUpperCase();
            return typeVal === 'DEPOSIT' && statusVal.includes('COMPLETED');
          }
          return false;
        });

        // --- Count ALL completed CC / PAYMENTIQ deposits (first-time vs repeat) ---
        let ccDepCount = 0;
        dataRows.forEach(tr => {
          if (tr.children.length > Math.max(typeIdx, statusIdx, opIdx)) {
            let typeVal = tr.children[typeIdx].textContent.trim().toUpperCase();
            let statusVal = tr.children[statusIdx].textContent.trim().toUpperCase();
            if (typeVal === 'DEPOSIT' && statusVal.includes('COMPLETED') && opIdx !== -1) {
              let opRaw = tr.children[opIdx].textContent.trim().toUpperCase().replace(/[\s_\-]/g, '');
              if (opRaw.includes('CREDITCARD') || opRaw.includes('PAYMENTIQCREDIT') || opRaw.includes('PAYMENTIQ')) {
                ccDepCount++;
              }
            }
          }
        });

        // --- Check top Payment Log note for 'req' ---
        let hasReq = "NO";
        if (notesIdx !== -1 && allTrs.length > 1) {
          if (allTrs[1].children.length > notesIdx) {
            let topNotes = allTrs[1].children[notesIdx].textContent.toLowerCase();
            if (topNotes.includes('req')) {
              hasReq = "YES";
            }
          }
        }

        // --- Scan ALL notes cells for 'cc ver' (CC already verified) ---
        let ccVerInLog = "NO";
        if (notesIdx !== -1) {
          for (let tr of dataRows) {
            if (tr.children.length > notesIdx) {
              let cellTxt = tr.children[notesIdx].textContent.toLowerCase().replace(/[\s_\-]/g, '');
              if (cellTxt.includes('ccver') || cellTxt.includes('ccverified') || cellTxt.includes('cardver')) {
                ccVerInLog = "YES";
                break;
              }
            }
          }
        }

        // --- Find withdrawal row ---
        let withdrawRow = dataRows.find(tr => {
          if (tr.children.length > typeIdx) {
            let typeVal = tr.children[typeIdx].textContent.trim().toUpperCase();
            return typeVal === 'WITHDRAW';
          }
          return false;
        });

        let depOpName = "NOT_FOUND";
        if (depositRow && opIdx !== -1 && depositRow.children.length > opIdx) {
          depOpName = depositRow.children[opIdx].textContent.trim();
        }

        let withOpName = "NOT_FOUND";
        if (withdrawRow && opIdx !== -1 && withdrawRow.children.length > opIdx) {
          withOpName = withdrawRow.children[opIdx].textContent.trim();
        }

        depositInfo = { depOp: depOpName, withOp: withOpName, req: hasReq, ccDepCount: ccDepCount, ccVerInLog: ccVerInLog };
        break;
      }
    }
    if (depositInfo) break;
  }

  if (depositInfo) {
    let input = document.createElement('input');
    input.value = "DEP_OP:" + depositInfo.depOp
      + "|WITH_OP:" + depositInfo.withOp
      + "|DOC:" + depositInfo.req
      + "|CC_DEP_COUNT:" + depositInfo.ccDepCount
      + "|CC_VER:" + depositInfo.ccVerInLog;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    return;
  }

  let input = document.createElement('input');
  input.value = "DEP_OP:NOT_FOUND|WITH_OP:NOT_FOUND|DOC:NO|CC_DEP_COUNT:0|CC_VER:NO";
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
})();

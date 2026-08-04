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
      let headers = Array.from(tbl.querySelectorAll('th, td'));
      let typeIdx = -1, idIdx = -1, statusIdx = -1, opIdx = -1;
      
      let allTrs = Array.from(tbl.querySelectorAll('tr'));
      if (allTrs.length === 0) continue;
      
      let headerCells = Array.from(allTrs[0].children);
      typeIdx = headerCells.findIndex(c => c.textContent.trim().toLowerCase() === 'type');
      idIdx = headerCells.findIndex(c => c.textContent.trim().toLowerCase() === 'id');
      statusIdx = headerCells.findIndex(c => c.textContent.trim().toLowerCase() === 'status');
      opIdx = headerCells.findIndex(c => c.textContent.trim().toLowerCase() === 'operator name');
      let notesIdx = headerCells.findIndex(c => c.textContent.trim().toLowerCase() === 'notes');

      if (typeIdx !== -1 && idIdx !== -1 && statusIdx !== -1) {
        let dataRows = allTrs.slice(1);
        let depositRow = dataRows.find(tr => {
          if (tr.children.length > Math.max(typeIdx, statusIdx)) {
            let typeVal = tr.children[typeIdx].textContent.trim().toUpperCase();
            let statusVal = tr.children[statusIdx].textContent.trim().toUpperCase();
            return typeVal === 'DEPOSIT' && statusVal.includes('COMPLETED');
          }
          return false;
        });
        
        let hasReq = "NO";
        if (notesIdx !== -1 && allTrs.length > 1) {
          if (allTrs[1].children.length > notesIdx) {
            let topNotes = allTrs[1].children[notesIdx].textContent.toLowerCase();
            if (topNotes.includes('req')) {
              hasReq = "YES";
            }
          }
        }

        if (depositRow && depositRow.children.length > idIdx) {
          let depId = depositRow.children[idIdx].textContent.trim();
          let opName = "NO_MATCH";
          if (opIdx !== -1 && depositRow.children.length > opIdx) {
            opName = depositRow.children[opIdx].textContent.trim();
          }
          depositInfo = { id: depId, op: opName, req: hasReq };
          break;
        }
      }
    }
    if (depositInfo) break;
  }

  if (depositInfo) {
    let input = document.createElement('input');
    input.value = "DEP_ID:" + depositInfo.id + "|OP:" + depositInfo.op + "|DOC:" + depositInfo.req;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    return;
  }

  let input = document.createElement('input');
  input.value = "DEP_ID:NOT_FOUND";
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
})();

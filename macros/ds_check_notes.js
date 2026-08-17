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

  function checkNotes() {
    let noteText = "";
    
    // Search all frames for the notes table
    for (let doc of getFrames()) {
      let tables = Array.from(doc.querySelectorAll('table'));
      for (let tbl of tables) {
        let rows = Array.from(tbl.querySelectorAll('tr'));
        if (rows.length === 0) continue;
        
        let headerCells = Array.from(rows[0].querySelectorAll('th, td'));
        let noteIdx = headerCells.findIndex(c => {
          let txt = c.textContent.trim().toLowerCase();
          return txt === 'note' || txt === 'notes' || txt === 'comment' || txt === 'text';
        });

        if (noteIdx !== -1) {
          let dataRows = rows.filter(tr => tr.querySelector('td') && tr !== rows[0]);
          if (dataRows.length > 0) {
            let topRow = dataRows[0];
            if (topRow.children.length > noteIdx) {
              noteText = topRow.children[noteIdx].textContent.trim();
              break;
            }
          }
        }
      }
      if (noteText) break;
    }

    if (!noteText) {
      for (let doc of getFrames()) {
        let tables = Array.from(doc.querySelectorAll('table'));
        for (let tbl of tables) {
          let rows = Array.from(tbl.querySelectorAll('tr'));
          if (rows.length > 1) {
            let tblText = tbl.textContent.toLowerCase();
            if ((tblText.includes('note') || tblText.includes('comment')) && 
                (tblText.includes('creator') || tblText.includes('author') || tblText.includes('created') || tblText.includes('date'))) {
              let dataRows = rows.filter(tr => tr.querySelector('td') && tr !== rows[0]);
              if (dataRows.length > 0) {
                let cells = Array.from(dataRows[0].querySelectorAll('td'));
                if (cells.length > 0) {
                  noteText = cells[cells.length - 1].textContent.trim();
                  break;
                }
              }
            }
          }
        }
        if (noteText) break;
      }
    }
    
    return noteText;
  }

  let text = checkNotes();
  let lower = (text || '').toLowerCase();
  // Trigger Verify docs for:
  // - 'req' / 'rem' keywords
  // - 'waiting for cc' or 'cc ' (credit card doc pending)
  // - 'waiting for doc' / 'send doc'
  let needsVerifyDocs = /\breq\b/.test(lower)
    || /\brem\b/.test(lower)
    || lower.includes('waiting for cc')
    || /\bcc\s+\d/.test(lower)
    || lower.includes('waiting for doc')
    || lower.includes('send doc')
    || lower.includes('verify cc')
    || lower.includes('verify card');
  let hasReq = needsVerifyDocs ? "YES" : "NO";
  let input = document.createElement('input');
  input.value = "REQ_FOUND:" + hasReq + "|TEXT:" + (text ? text.replace(/[\r\n]+/g, ' ') : "NOTES_NOT_FOUND");
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
})();

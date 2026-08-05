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

  let noteText = "";

  // Search all frames for the notes table
  for (let doc of getFrames()) {
    let tables = Array.from(doc.querySelectorAll('table'));
    for (let tbl of tables) {
      let rows = Array.from(tbl.querySelectorAll('tr'));
      if (rows.length === 0) continue;
      
      // Look at header row to identify if this is a notes table
      let headerCells = Array.from(rows[0].querySelectorAll('th, td'));
      let noteIdx = headerCells.findIndex(c => {
        let txt = c.textContent.trim().toLowerCase();
        return txt === 'note' || txt === 'notes' || txt === 'comment' || txt === 'text';
      });

      if (noteIdx !== -1) {
        // Found the notes table! The first data row is the top row
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

  // Fallback 1: Search for any table where headers imply notes/comments and check top row
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
              let topRow = dataRows[0];
              let cells = Array.from(topRow.querySelectorAll('td'));
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

  // Fallback 2: Search for timeline/comments/notes containers or items
  if (!noteText) {
    for (let doc of getFrames()) {
      let possibleNotes = Array.from(doc.querySelectorAll('.note, .comment, [class*="note"], [class*="comment"]'));
      let visibleNotes = possibleNotes.filter(el => el.getBoundingClientRect().width > 0 && el.textContent.trim().length > 0);
      if (visibleNotes.length > 0) {
        noteText = visibleNotes[0].textContent.trim();
        break;
      }
    }
  }

  console.log("Top note found: " + noteText);

  let hasReq = "NO";
  if (noteText && noteText.toLowerCase().includes('req')) {
    hasReq = "YES";
  }

  let input = document.createElement('input');
  input.value = "REQ_FOUND:" + hasReq + "|TEXT:" + noteText.replace(/[\r\n]+/g, ' ');
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
})();

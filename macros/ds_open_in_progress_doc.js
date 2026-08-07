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

  function simClick(el) {
    if (!el) return;
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    if (typeof el.click === 'function') el.click();
  }

  function findInProgressDoc() {
    for (let doc of getFrames()) {
      let tables = Array.from(doc.querySelectorAll('table'));
      for (let tbl of tables) {
        let rows = Array.from(tbl.querySelectorAll('tr'));
        if (rows.length <= 1) continue;
        
        let headerCells = Array.from(rows[0].querySelectorAll('th, td'));
        let statusIdx = headerCells.findIndex(c => c.textContent.trim().toLowerCase() === 'status');
        let fileIdx = headerCells.findIndex(c => c.textContent.trim().toLowerCase().includes('file name'));
        
        // If we can't find headers by name, fallback to hardcoded indices (Playbison: File Name is 2, Status is 9)
        if (statusIdx === -1) statusIdx = 9;
        if (fileIdx === -1) fileIdx = 2;

        let dataRows = rows.filter(tr => tr.querySelector('td') && tr !== rows[0]);
        for (let tr of dataRows) {
          if (tr.children.length > Math.max(statusIdx, fileIdx)) {
            let statusText = tr.children[statusIdx].textContent.trim().toLowerCase();
            if (statusText.includes('in progress') || statusText.includes('inprogress')) {
              let fileCell = tr.children[fileIdx];
              let fileLink = fileCell.querySelector('a');
              if (fileLink) {
                simClick(fileLink);
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }

  let opened = findInProgressDoc();
  let resultStr = "DOC_OPENED:" + (opened ? "YES" : "NO");

  let input = document.createElement('input');
  input.value = resultStr;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
})();

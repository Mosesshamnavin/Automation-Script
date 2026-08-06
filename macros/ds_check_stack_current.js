// ds_check_stack_current.js
// Runs the stack check on whatever results are currently visible in the Playbison transaction table.
(function () {
  function getFrames() {
    let frames = [document];
    let iframes = document.querySelectorAll('iframe');
    for (let i of iframes) {
      try { if (i.contentDocument) frames.push(i.contentDocument); } catch(e){}
    }
    return frames;
  }

  function simClick(el) {
    el.dispatchEvent(new MouseEvent('mousedown', {bubbles: true, cancelable: true, view: window}));
    el.dispatchEvent(new MouseEvent('mouseup', {bubbles: true, cancelable: true, view: window}));
    el.click();
  }

  function copyToClipboard(text) {
    try {
      let ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      setTimeout(() => {
        try { document.body.removeChild(ta); } catch(e){}
      }, 30000);
    } catch(err) {}
  }

  function parseCurrentPage(cont, globalCounts, seenIds) {
    let tables = Array.from(cont.querySelectorAll('table'));
    let dataTbl = tables.find(t => (t.offsetWidth > 0 || t.offsetHeight > 0) && Array.from(t.querySelectorAll('th,td')).some(c => c.textContent.toLowerCase().trim() === 'out val' || c.textContent.toLowerCase().trim() === 'in val'));
    if (!dataTbl) return;

    let allTrs = Array.from(dataTbl.querySelectorAll('tr'));
    let valIdx = -1, currIdx = -1, bonusBeforeIdx = -1, bonusAfterIdx = -1, noteIdx = -1;

    for (let tr of allTrs) {
      let cells = Array.from(tr.children);
      for (let i = 0; i < cells.length; i++) {
        let txt = cells[i].textContent.toLowerCase().trim();
        if (txt === 'in val' || txt === 'val') valIdx = i;
        if (txt === 'curr val' || txt === 'currval') currIdx = i;
        if (txt === 'before' && i > 8) { bonusBeforeIdx = i; if (i+1 < cells.length) bonusAfterIdx = i+1; }
        if (txt === 'note') noteIdx = i;
      }
      if (valIdx !== -1) break;
    }

    if (valIdx === -1) { valIdx = 5; currIdx = 7; }
    if (bonusBeforeIdx === -1) { bonusBeforeIdx = 11; bonusAfterIdx = 12; }
    if (noteIdx === -1) noteIdx = 14;

    let dataRows = allTrs.filter(tr => tr.querySelector('td') && tr.children.length > Math.max(currIdx, bonusAfterIdx));

    for (let tr of dataRows) {
      let idStr = tr.children[0] ? tr.children[0].textContent.trim() : '';
      if (!/^\d{6,15}$/.test(idStr)) continue;
      if (seenIds.has(idStr)) continue;
      seenIds.add(idStr);

      // Stack = row where the 'note' cell is empty
      let noteCell = tr.children[noteIdx];
      let noteText = noteCell ? (noteCell.textContent || '').trim() : '';
      if (noteText !== '') continue;

      let valStr = tr.children[valIdx].textContent.trim();
      let currStr = tr.children[currIdx].textContent.trim();
      if (!valStr) continue;

      let num = parseFloat(valStr.replace(',', '.'));
      if (isNaN(num)) continue;

      let currCode = currStr ? currStr.split(' ')[0] : '';
      let currFormatted = currCode ? currCode.charAt(0).toUpperCase() + currCode.slice(1).toLowerCase() : '';
      let absVal = Math.abs(num);
      let valFormatted = `-${absVal}`;
      if (valFormatted.endsWith('.00')) valFormatted = valFormatted.slice(0, -3);

      let key = `${valFormatted}${currFormatted}`;
      globalCounts[key] = (globalCounts[key] || 0) + 1;
    }
  }

  function findNextButton(cont) {
    let btns = Array.from(cont.querySelectorAll('button, a, input, div[role="button"], li'));
    return btns.find(b => {
      let txt = (b.textContent || b.value || '').toLowerCase().trim();
      let isNext = txt === 'next' || txt.includes('next') || txt === 'next→' || txt === 'next →' || txt === '→';
      let isDisabled = b.disabled || b.classList.contains('disabled') || (b.parentElement && b.parentElement.classList.contains('disabled'));
      return isNext && !isDisabled && (b.offsetWidth > 0 || b.getBoundingClientRect().width > 0);
    });
  }

  let globalCounts = {};
  let seenIds = new Set();

  function step() {
    let doc = getFrames()[0];
    parseCurrentPage(doc, globalCounts, seenIds);

    let nextBtn = findNextButton(doc);
    if (nextBtn) {
      simClick(nextBtn);
      setTimeout(() => { step(); }, 3000);
    } else {
      let keys = Object.keys(globalCounts).sort((a, b) => {
        let numA = Math.abs(parseFloat(a) || 0);
        let numB = Math.abs(parseFloat(b) || 0);
        return numB - numA;
      });

      if (keys.length === 0) {
        copyToClipboard("STACK_CHECK:NO_STACK");
      } else {
        let resultLines = keys.map(k => `${k}*${globalCounts[k]}`);
        copyToClipboard("STACK_CHECK:" + resultLines.join('\n'));
      }
    }
  }

  step();
})();

// ds_analytics_scrape.js
(function () {
  try {
    let headers = Array.from(document.querySelectorAll('th, td'));
    let dateIdx = -1;
    let headerRow = null;
    
    // Find the header row and Date column index
    for (let h of headers) {
      if ((h.textContent || '').toLowerCase().trim() === 'date') {
        headerRow = h.parentElement;
        let siblings = Array.from(headerRow.children);
        dateIdx = siblings.indexOf(h);
        break;
      }
    }
    
    if (dateIdx === -1) {
      // Fallback: Just scrape anything that looks like a date format YYYY-MM-DDTHH:MM:SS
      let allText = document.body.innerText;
      let matches = allText.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g);
      if (matches && matches.length > 0) {
        copyToClipboard("ANALYTICS_DATES:" + matches.join(','));
        return;
      }
      copyToClipboard("ANALYTICS_DATES:NO_DATES_FOUND");
      return;
    }
    
    // Find all rows in the same table body
    let tbody = headerRow.parentElement.tagName === 'THEAD' ? headerRow.parentElement.nextElementSibling : headerRow.parentElement;
    if (!tbody || tbody.tagName !== 'TBODY') {
        // Fallback to searching all trs
        tbody = document;
    }
    
    let allTrs = Array.from(tbody.querySelectorAll('tr'));
    let dates = [];
    
    for (let tr of allTrs) {
      if (tr === headerRow) continue;
      let cells = Array.from(tr.children);
      if (cells.length > dateIdx) {
        let txt = (cells[dateIdx].textContent || '').trim();
        if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(txt)) {
          dates.push(txt);
        }
      }
    }
    
    if (dates.length === 0) {
      // Final Fallback
      let allText = document.body.innerText;
      let matches = allText.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g);
      if (matches && matches.length > 0) {
        dates = matches;
      }
    }
    
    if (dates.length > 0) {
      copyToClipboard("ANALYTICS_DATES:" + dates.join(','));
    } else {
      copyToClipboard("ANALYTICS_DATES:NO_DATES_FOUND");
    }

  } catch (e) {
    copyToClipboard("ANALYTICS_DATES:ERROR|" + e.message);
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
})();

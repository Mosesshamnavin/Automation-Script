(function () {
  try {
    let allEls = Array.from(document.querySelectorAll('*'));
    let isMulti = false;

    // Check for multiple email rows (multibrand)
    let emailHeader = allEls.find(e => {
      let t = e.textContent.trim().toLowerCase();
      return t === 'email' && e.children.length === 0 && e.getBoundingClientRect().width > 0;
    });
    if (emailHeader) {
      let rHeader = emailHeader.getBoundingClientRect();
      let headerMidX = rHeader.left + rHeader.width / 2;
      let emailCells = allEls.filter(e => {
        if (e.children.length > 0) return false;
        let r = e.getBoundingClientRect();
        if (r.width <= 0 || r.top <= rHeader.bottom) return false;
        return Math.abs((r.left + r.width / 2) - headerMidX) < 100 && e.textContent.includes('@');
      });
      if (emailCells.length > 1) isMulti = true;
    }

    if (isMulti) { prompt('WD_RATIO:', 'MULTIBRAND'); return; }

    // Try to find a percentage element
    let percentEls = allEls.filter(e => {
      if (e.children.length > 0) return false;
      let r = e.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || r.top < 150) return false;
      let txt = e.textContent.trim();
      return /\d+\s*%/.test(txt);
    });
    if (percentEls.length > 0) {
      percentEls.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      prompt('WD_RATIO:', percentEls[0].textContent.trim());
      return;
    }

    // Fallback: look for ratio column header
    let ratioHeader = allEls.find(e => {
      let t = e.textContent.trim().toLowerCase();
      return (t.includes('w/d ratio') || t.includes('ratio (volumes)') || t.includes('ratio')) &&
        e.children.length === 0 && e.getBoundingClientRect().width > 0;
    });
    if (ratioHeader) {
      let rHeader = ratioHeader.getBoundingClientRect();
      let headerMidX = rHeader.left + rHeader.width / 2;
      let candidateCells = allEls.filter(e => {
        if (e.children.length > 0) return false;
        let r = e.getBoundingClientRect();
        if (r.width <= 0 || r.top <= rHeader.bottom) return false;
        return Math.abs((r.left + r.width / 2) - headerMidX) < 100;
      });
      candidateCells.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      if (candidateCells.length > 0) {
        prompt('WD_RATIO:', candidateCells[0].textContent.trim());
        return;
      }
    }

    prompt('WD_RATIO:', 'NO_DATA');
  } catch (e) {
    prompt('WD_RATIO:', 'ERROR: ' + e.message);
  }
})();

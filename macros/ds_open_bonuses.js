(function () {
  function getFrames() {
    let docs = [document];
    let frames = document.querySelectorAll('iframe, frame');
    for (let f of frames) {
      try { docs.push(f.contentDocument || f.contentWindow.document); } catch (e) {}
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

  for (let doc of getFrames()) {
    let links = Array.from(doc.querySelectorAll('a.nav-link, a, button, [role="tab"]'));
    let bonusTab = links.find(e => {
      let txt = (e.textContent || '').toLowerCase().trim();
      if (txt !== 'bonuses' && !txt.startsWith('bonuses')) return false;
      let idx = links.indexOf(e);
      let start = Math.max(0, idx - 6);
      let end = Math.min(links.length, idx + 6);
      for (let i = start; i < end; i++) {
        let t = (links[i].textContent || '').toLowerCase().trim();
        if (t.includes('personal') || t.includes('notes') || t.includes('account activity') || t.includes('transactions') || t.includes('freespins')) return true;
      }
      return false;
    });

    if (!bonusTab) {
      bonusTab = links.find(e => (e.textContent || '').toLowerCase().trim() === 'bonuses' && (e.offsetWidth > 0 || e.getBoundingClientRect().width > 0));
    }

    if (bonusTab) {
      simClick(bonusTab);
      return;
    }
  }
})();

(function () {
  let links = Array.from(document.querySelectorAll('a.nav-link, a'));
  let docs = links.find(e => {
    let txt = (e.textContent || '').toLowerCase().trim();
    if (!txt.startsWith('documents') || txt.length >= 15) return false;
    
    // Ensure this is the user tab by checking if "history" is right before it
    let idx = links.indexOf(e);
    let start = Math.max(0, idx - 5);
    for (let i = start; i < idx; i++) {
      if ((links[i].textContent || '').toLowerCase().trim().includes('history')) {
        return true;
      }
    }
    return false;
  });
  
  if (!docs) {
    // Fallback if structure changed
    docs = links.find(e => {
      let txt = (e.textContent || '').toLowerCase().trim();
      return txt.startsWith('documents') && txt.length < 15;
    });
  }

  if (docs) {
    docs.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    docs.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
    docs.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    docs.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
    docs.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    if (typeof docs.click === 'function') docs.click();
  }
})();

(function () {
  let links = Array.from(document.querySelectorAll('a.nav-link, a'));
  let notes = links.find(e => {
    let txt = (e.textContent || '').toLowerCase().trim();
    if (!txt.startsWith('notes') || txt.length >= 15) return false;
    
    // Ensure this is the user tab by checking if "account activity" is right next to it
    let idx = links.indexOf(e);
    let end = Math.min(links.length, idx + 5);
    for (let i = idx + 1; i < end; i++) {
      if ((links[i].textContent || '').toLowerCase().trim().includes('account activity')) {
        return true;
      }
    }
    return false;
  });
  
  if (!notes) {
    // Fallback if structure changed
    notes = links.find(e => {
      let txt = (e.textContent || '').toLowerCase().trim();
      return txt.startsWith('notes') && txt.length < 15;
    });
  }

  if (notes) {
    notes.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    notes.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
    notes.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    notes.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
    notes.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    if (typeof notes.click === 'function') notes.click();
  }
})();

(function () {
  // Click the Bonuses tab in the player's profile tab bar.
  // Same proven pattern as ds_open_notes.js.
  let links = Array.from(document.querySelectorAll('a.nav-link, a'));
  let bonusTab = links.find(e => {
    let txt = (e.textContent || '').toLowerCase().trim();
    if (!txt.startsWith('bonuses')) return false;

    // Confirm it's the player tab row (not top-nav "Bonuses" dropdown)
    // by checking that "account activity" or "messages" appears within 6 links.
    // We can't use "freespins" because the top nav ALSO has Bonuses next to Free Spins!
    let idx = links.indexOf(e);
    let start = Math.max(0, idx - 6);
    let end = Math.min(links.length, idx + 6);
    for (let i = start; i < end; i++) {
      let t = (links[i].textContent || '').toLowerCase().trim();
      if (t.includes('account activity') || t.includes('messages')) return true;
    }
    return false;
  });

  if (!bonusTab) {
    bonusTab = links.find(e => (e.textContent || '').toLowerCase().trim().startsWith('bonuses'));
  }

  if (bonusTab) {
    bonusTab.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    bonusTab.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
    bonusTab.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    bonusTab.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
    bonusTab.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    if (typeof bonusTab.click === 'function') bonusTab.click();
  }
})();

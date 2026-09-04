// Dynamic placeholders replaced at runtime:
//   ###PLAYER_ID###   -> the player's hex/numeric ID
//   ###PLAYER_EMAIL###-> the player's email address

(function () {
  let id = '###PLAYER_ID###';
  let email = '###PLAYER_EMAIL###';

  function getFrames() {
    let docs = [document];
    let frames = document.querySelectorAll('iframe, frame');
    for (let f of frames) {
      try { docs.push(f.contentDocument || f.contentWindow.document); } catch (e) {}
    }
    return docs;
  }

  // 1. Close any existing open modal/dialog in any frame
  for (let doc of getFrames()) {
    if (!doc || !doc.body) continue;
    let closeBtns = doc.querySelectorAll('.modal .close, .x-tool-close, button[aria-label="Close"], button[title="Close"], .close, [data-dismiss="modal"], a.close, [class*="modal-close"], [class*="dialog-close"]');
    for (let btn of closeBtns) {
      if (btn.offsetWidth > 0 || btn.offsetHeight > 0) {
        try { btn.click(); } catch (e) {}
      }
    }

    // If currently on Users list page, click Payment & Frauds -> Withdraw to confirm
    let bText = (doc.body.textContent || '').toLowerCase();
    if (window.location.hash.includes('users') || bText.includes('users list')) {
      if (window.Ext && Ext.ComponentQuery) {
        try {
          let btn = Ext.ComponentQuery.query('button').find(b => (b.text || '').toLowerCase().includes('payment'));
          if (btn && btn.menu) {
            btn.showMenu();
            let item = btn.menu.items && btn.menu.items.items ? btn.menu.items.items.find(i => (i.text || '').toLowerCase().includes('withdraw to confirm')) : null;
            if (item) {
              try { item.onClick(); } catch(e){}
              try { item.fireEvent('click', item); } catch(e){}
            }
          }
        } catch(e){}
      }
      let p = doc.evaluate(
        "//*[not(self::script) and not(self::style) and text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'payment&frauds')]]",
        doc, null, 9, null
      ).singleNodeValue;
      if (p) {
        let pTarget = p.closest('.x-btn') || p;
        pTarget.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        pTarget.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        pTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        try { pTarget.click(); } catch(e){}
        setTimeout(() => {
          let w = doc.evaluate(
            "//*[not(self::script) and not(self::style) and text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'withdraw to confirm')]]",
            doc, null, 9, null
          ).singleNodeValue;
          if (w) {
            let wTarget = w.closest('.x-menu-item') || w;
            wTarget.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            wTarget.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            wTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            try { wTarget.click(); } catch(e){}
          }
        }, 300);
      }
    }
  }

  // 2. Set the window hash to trigger details modal
  if (id && !id.startsWith('###')) {
    if (window.location.hash === '#action:admin.payment.details:' + id) {
      window.location.hash = '#action:admin.payment.details:' + id + '_toggle';
    }
    setTimeout(() => {
      window.location.hash = '#action:admin.payment.details:' + id;
      try { window.dispatchEvent(new HashChangeEvent('hashchange')); } catch(e){}
    }, 100);
  }

  // 3. Find and click the specific row or link for this ID or Email
  for (let doc of getFrames()) {
    if (!doc || !doc.body) continue;
    let els = Array.from(doc.querySelectorAll('td, a, span, div'));
    let target = els.find(
      e => e.children.length === 0 &&
        ((id && e.textContent.trim() === id) ||
          (email && e.textContent.trim().toLowerCase() === email.toLowerCase()))
    );

    if (target) {
      let clickEl = target.closest('a') || target.closest('tr') || target;
      try {
        clickEl.click();
        clickEl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      } catch (e) {}
      break;
    }
  }
})();

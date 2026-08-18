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
  }

  // 2. Set the window hash to trigger details modal
  if (id) {
    window.location.hash = '#action:admin.payment.details:' + id;
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

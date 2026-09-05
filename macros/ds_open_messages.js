(function () {
  let links = Array.from(document.querySelectorAll('a.nav-link, a'));
  let messages = links.find(function (e) {
    let txt = (e.textContent || '').toLowerCase().trim();
    if (!txt.startsWith('messages') || txt.length >= 20) return false;

    let idx = links.indexOf(e);
    let end = Math.min(links.length, idx + 6);
    for (let i = idx + 1; i < end; i++) {
      if ((links[i].textContent || '').toLowerCase().trim().includes('account activity')) {
        return true;
      }
    }
    return false;
  });

  if (!messages) {
    messages = links.find(function (e) {
      let txt = (e.textContent || '').toLowerCase().trim();
      return txt.startsWith('messages') && txt.length < 20;
    });
  }

  function copyVal(val) {
    try {
      let ta = document.createElement('textarea');
      ta.value = val;
      ta.style.position = 'fixed';
      ta.style.opacity = '0.01';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      ta.remove();
    } catch (e) {}
  }

  if (messages) {
    messages.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    messages.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
    messages.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    messages.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
    messages.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    if (typeof messages.click === 'function') messages.click();
    copyVal('MESSAGES_TAB_OK');
  } else {
    copyVal('MESSAGES_TAB_FAIL');
  }
})();

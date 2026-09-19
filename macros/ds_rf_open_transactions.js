(function () {
  function simClick(el) {
    if (!el) return;
    try { el.focus(); } catch (e) {}
    try {
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    } catch (e) {}
    try { if (typeof el.click === 'function') el.click(); } catch (e) {}
  }
  function copy(t) {
    try {
      var ta = document.getElementById('__rf_clip__');
      if (!ta) {
        ta = document.createElement('textarea');
        ta.id = '__rf_clip__';
        ta.setAttribute('readonly', 'readonly');
        ta.style.cssText = 'position:fixed;top:0;left:0;width:2px;height:2px;opacity:0.01;z-index:2147483647;';
        document.body.appendChild(ta);
      }
      ta.value = t;
      window.__RF_STATUS__ = t;
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      document.execCommand('copy');
    } catch (e) {}
  }
  var links = Array.from(document.querySelectorAll('a.nav-link, a, button, [role="tab"]'));
  var tab = links.find(function (e) {
    var t = (e.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (t !== 'transactions') return false;
    var i = links.indexOf(e);
    for (var j = Math.max(0, i - 5); j < Math.min(links.length, i + 8); j++) {
      var n = (links[j].textContent || '').toLowerCase();
      if (n.indexOf('notes') >= 0 || n.indexOf('bonuses') >= 0 || n.indexOf('payment') >= 0) return true;
    }
    return e.offsetWidth > 0;
  }) || links.find(function (e) {
    return (e.textContent || '').toLowerCase().trim() === 'transactions' && e.offsetWidth > 0;
  });
  if (!tab) { copy('REAL_FUND:FAIL:NO_TRANSACTIONS_TAB'); return; }
  // Copy FIRST — tab click can tear down this document context
  copy('REAL_FUND:TAB_OK');
  simClick(tab);
})();

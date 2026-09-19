(function () {
  // SYNC: open Payment Log tab only, then ACK. Status/Search is a separate inject.
  function copy(t) {
    try {
      var ta = document.getElementById('__paylog_clip__');
      if (!ta) {
        ta = document.createElement('textarea');
        ta.id = '__paylog_clip__';
        ta.setAttribute('readonly', 'readonly');
        ta.style.cssText = 'position:fixed;top:0;left:0;width:2px;height:2px;opacity:0.01;z-index:1;';
        document.body.appendChild(ta);
      }
      ta.value = t;
      window.__PAYLOG_STATUS__ = t;
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      document.execCommand('copy');
    } catch (e) {}
  }
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
  function findPaymentLogTab(doc) {
    var links = Array.from(doc.querySelectorAll('a.nav-link, a, button, [role="tab"], li'));
    return links.find(function (e) {
      var t = (e.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
      return (t === 'payment log' || t.indexOf('payment log') === 0) &&
        (e.offsetWidth > 0 || e.getBoundingClientRect().width > 0);
    });
  }

  var docs = [document];
  var frames = document.querySelectorAll('iframe, frame');
  for (var i = 0; i < frames.length; i++) {
    try { if (frames[i].contentDocument) docs.push(frames[i].contentDocument); } catch (e) {}
  }
  var pTab = null;
  for (var d = 0; d < docs.length; d++) {
    pTab = findPaymentLogTab(docs[d]);
    if (pTab) break;
  }
  if (!pTab) {
    copy('PAYLOG:FAIL:NO_TAB');
    return;
  }
  copy('PAYLOG:TAB_OK');
  simClick(pTab);
})();

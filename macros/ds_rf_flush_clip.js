(function () {
  // Tiny SYNC clipboard flush — re-copy window.__RF_STATUS__ / textarea under user gesture.
  try {
    var t = '';
    try { t = window.__RF_STATUS__ || ''; } catch (e) {}
    if (!t) {
      try { t = window.name || ''; } catch (e2) {}
    }
    var ta = document.getElementById('__rf_clip__');
    if (ta && ta.value && String(ta.value).indexOf('REAL_FUND:') === 0) t = ta.value;
    if (!t || String(t).indexOf('REAL_FUND:') !== 0) {
      // leave clipboard alone
      return;
    }
    if (!ta) {
      ta = document.createElement('textarea');
      ta.id = '__rf_clip__';
      ta.style.cssText = 'position:fixed;top:0;left:0;width:2px;height:2px;opacity:0.01;z-index:2147483647;';
      document.body.appendChild(ta);
    }
    ta.value = t;
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    document.execCommand('copy');
  } catch (e) {}
})();

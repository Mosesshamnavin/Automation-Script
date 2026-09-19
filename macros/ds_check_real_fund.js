(function () {
  // DEPRECATED — Real Fund now uses ds_rf_open_transactions / ds_rf_find_win / ds_rf_find_stake.
  // A single long macro dies when the Transactions tab tear-down kills pending timers.
  try {
    var ta = document.getElementById('__rf_clip__');
    if (!ta) {
      ta = document.createElement('textarea');
      ta.id = '__rf_clip__';
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0.01;z-index:2147483647;';
      document.body.appendChild(ta);
    }
    ta.value = 'REAL_FUND:FAIL:USE_STEP_MACROS';
    ta.focus(); ta.select();
    document.execCommand('copy');
  } catch (e) {}
})();

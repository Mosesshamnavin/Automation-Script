(function () {
  // SYNC probe: real wallet profile vs Users list (even if hash was faked).
  function copy(t) {
    try {
      var ta = document.getElementById('__wallet_probe__');
      if (!ta) {
        ta = document.createElement('textarea');
        ta.id = '__wallet_probe__';
        ta.setAttribute('readonly', 'readonly');
        ta.style.cssText = 'position:fixed;top:0;left:0;width:2px;height:2px;opacity:0.01;z-index:1;';
        document.body.appendChild(ta);
      }
      ta.value = t;
      window.__WALLET_PROBE__ = t;
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      document.execCommand('copy');
    } catch (e) {}
  }
  function norm(s) {
    return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }
  function hasTab(name) {
    var want = norm(name);
    var links = Array.from(document.querySelectorAll('a, button, [role="tab"], .nav-link, li'));
    for (var i = 0; i < links.length; i++) {
      var el = links[i];
      // Prefer direct text, not huge nested blocks
      var t = norm(el.childNodes && el.childNodes.length === 1 ? el.textContent : (el.innerText || el.textContent || ''));
      if (t.length > 40) continue;
      if (t === want || t.indexOf(want) === 0) return true;
    }
    return false;
  }

  var hash = norm(location.hash || '');
  var hashWallet = hash.indexOf('admin.user:') >= 0 && hash.indexOf('admin.users') < 0;

  var pay = hasTab('payment log');
  var trans = hasTab('transactions');
  var notes = hasTab('notes');
  var personal = hasTab('personal data');
  var bonuses = hasTab('bonuses');

  // Users list page title / heading
  var headingUsersList = false;
  try {
    var hs = Array.from(document.querySelectorAll('h1, h2, h3, .page-title, .breadcrumb'));
    headingUsersList = hs.some(function (h) { return norm(h.textContent) === 'users list'; });
  } catch (e) {}

  var walletTabs = (pay ? 1 : 0) + (trans ? 1 : 0) + (notes ? 1 : 0) + (personal ? 1 : 0);
  if (walletTabs >= 2 || (hashWallet && walletTabs >= 1) || (hashWallet && bonuses && notes)) {
    copy('WALLET:OK|PAY:' + (pay ? '1' : '0') + '|TX:' + (trans ? '1' : '0') + '|NOTES:' + (notes ? '1' : '0') + '|HASH:' + (hashWallet ? '1' : '0'));
    return;
  }
  copy('WALLET:BAD|USERS_HEADING:' + (headingUsersList ? '1' : '0') + '|PAY:' + (pay ? '1' : '0') + '|TX:' + (trans ? '1' : '0') + '|NOTES:' + (notes ? '1' : '0') + '|HASH:' + (hashWallet ? '1' : '0'));
})();

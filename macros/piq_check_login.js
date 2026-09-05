// Detect whether PaymentIQ Backoffice is logged in.
// Copies LOGGED_OUT:YES | LOGGED_OUT:NO | LOGGED_OUT:UNKNOWN to clipboard.

(function () {
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

  try {
    let url = (location.href || '').toLowerCase();
    let bodyText = (document.body && document.body.innerText || '').toLowerCase();

    let loggedOut = false;
    if (url.includes('/login') || url.includes('/auth') || url.includes('sso') || url.includes('openid')) {
      loggedOut = true;
    }
    if (document.querySelector('input[type="password"]')) {
      loggedOut = true;
    }
    if ((bodyText.includes('sign in') || bodyText.includes('log in')) && bodyText.includes('password')) {
      loggedOut = true;
    }

    let loggedIn = false;
    if (url.includes('backoffice.paymentiq.io')) {
      let navTexts = ['Approve', 'Home', 'Transactions', 'User Accounts'];
      for (let label of navTexts) {
        let hit = Array.from(document.querySelectorAll('*')).some(function (e) {
          return e.children.length === 0 &&
            e.textContent.trim() === label &&
            e.getBoundingClientRect().width > 0;
        });
        if (hit) {
          loggedIn = true;
          break;
        }
      }
    }

    if (loggedIn && !loggedOut) {
      copyVal('LOGGED_OUT:NO');
    } else if (loggedOut) {
      copyVal('LOGGED_OUT:YES');
    } else {
      copyVal('LOGGED_OUT:UNKNOWN');
    }
  } catch (e) {
    copyVal('LOGGED_OUT:UNKNOWN');
  }
})();

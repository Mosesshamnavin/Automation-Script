(function () {
  try {
    // 1. Direct hash navigation
    if (window.location.hash !== '#action:admin.users') {
      window.location.hash = '#action:admin.users';
      try { window.dispatchEvent(new HashChangeEvent('hashchange')); } catch(e){}
    }

    // 2. Click Users -> Users list menu in case hashchange isn't caught
    let allLinks = Array.from(document.querySelectorAll('a, span, div, li, button'));
    let usersMenu = allLinks.find(e => {
      let t = (e.textContent || '').trim().toLowerCase();
      return (t === 'users' || t.startsWith('users')) && e.children.length === 0 && (e.offsetWidth > 0 || e.offsetHeight > 0);
    });

    if (usersMenu) {
      try { usersMenu.click(); } catch(e){}
      setTimeout(() => {
        let allLinks2 = Array.from(document.querySelectorAll('a, span, div, li'));
        let usersListLink = allLinks2.find(e => {
          let t = (e.textContent || '').trim().toLowerCase();
          return t === 'users list' && (e.offsetWidth > 0 || e.offsetHeight > 0);
        });
        if (usersListLink) {
          try { usersListLink.click(); } catch(e){}
        }
      }, 300);
    }
  } catch(e) {}
})();

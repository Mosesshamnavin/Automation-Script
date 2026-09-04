(function () {
  try {
    // 1. Direct ExtJS navigation via ComponentQuery
    if (window.Ext && Ext.ComponentQuery) {
      try {
        let btn = Ext.ComponentQuery.query('button').find(b => {
          let t = (b.text || '').toLowerCase().trim();
          return t === 'users' || t.startsWith('users');
        });
        if (btn && btn.menu) {
          btn.showMenu();
          let item = btn.menu.items && btn.menu.items.items ? btn.menu.items.items.find(i => (i.text || '').toLowerCase().includes('users list')) : null;
          if (item) {
            try { item.onClick(); } catch(e){}
            try { item.fireEvent('click', item); } catch(e){}
          }
        }
      } catch(e){}
    }

    // 2. DOM Mouse events on top Users button
    let allBtns = Array.from(document.querySelectorAll('.x-btn, .x-btn-inner, a, button, span'));
    let usersBtn = allBtns.find(e => {
      let t = (e.textContent || '').trim().toLowerCase();
      return (t === 'users' || t.startsWith('users')) && (e.offsetWidth > 0 || e.offsetHeight > 0);
    });
    if (usersBtn) {
      let target = usersBtn.closest('.x-btn') || usersBtn;
      target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      try { target.click(); } catch(e){}

      setTimeout(() => {
        let menuItems = Array.from(document.querySelectorAll('.x-menu-item, .x-menu-item-text, a, span'));
        let usersList = menuItems.find(e => {
          let t = (e.textContent || '').trim().toLowerCase();
          return t === 'users list' && (e.offsetWidth > 0 || e.offsetHeight > 0);
        });
        if (usersList) {
          let itemTarget = usersList.closest('.x-menu-item') || usersList;
          itemTarget.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          itemTarget.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
          itemTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          try { itemTarget.click(); } catch(e){}
        }
      }, 300);
    }

    // 3. Set hash and reload fallback if view not updated
    if (!window.location.hash.includes('admin.users')) {
      window.location.hash = '#action:admin.users';
      try { window.dispatchEvent(new HashChangeEvent('hashchange')); } catch(e){}
      setTimeout(() => {
        let bodyText = (document.body.textContent || '').toLowerCase();
        if (!bodyText.includes('users list') && !bodyText.includes('add new')) {
          window.location.reload();
        }
      }, 500);
    }
  } catch(e) {}
})();

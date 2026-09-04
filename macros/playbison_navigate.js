(function () {
  try {
    // 1. ExtJS Menu trigger
    if (window.Ext && Ext.ComponentQuery) {
      try {
        let btn = Ext.ComponentQuery.query('button').find(b => {
          let t = (b.text || '').toLowerCase().trim();
          return t.includes('payment') || t.includes('frauds');
        });
        if (btn && btn.menu) {
          btn.showMenu();
          let item = btn.menu.items && btn.menu.items.items ? btn.menu.items.items.find(i => (i.text || '').toLowerCase().includes('withdraw to confirm')) : null;
          if (item) {
            try { item.onClick(); } catch(e){}
            try { item.fireEvent('click', item); } catch(e){}
          }
        }
      } catch(e){}
    }

    // 2. DOM Mouse events
    let p = document.evaluate(
      "//*[not(self::script) and not(self::style) and text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'payment&frauds')]]",
      document, null, 9, null
    ).singleNodeValue;

    if (p) {
      let target = p.closest('.x-btn') || p;
      target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      try { target.click(); } catch(e){}

      setTimeout(() => {
        let w = document.evaluate(
          "//*[not(self::script) and not(self::style) and text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'withdraw to confirm')]]",
          document, null, 9, null
        ).singleNodeValue;
        if (w) {
          let itemTarget = w.closest('.x-menu-item') || w;
          itemTarget.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          itemTarget.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
          itemTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          try { itemTarget.click(); } catch(e){}
        }
      }, 400);
    }
  } catch(e) {}
})();

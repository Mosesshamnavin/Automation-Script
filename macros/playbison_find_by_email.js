// Dynamic placeholder:
//   ###TARGET_EMAIL### -> the target email to find in the table
//   ###TARGET_BRAND### -> optional target brand (e.g. fireball, meteoro, bison casino)

(function () {
  let targetEmail = '###TARGET_EMAIL###'.toLowerCase().trim();
  let targetBrand = '###TARGET_BRAND###'.toLowerCase().trim();

  function copyToClipboard(payload) {
    try {
      let ta = document.createElement('textarea');
      ta.value = payload;
      ta.style.position = 'fixed';
      ta.style.top = '10px';
      ta.style.left = '10px';
      ta.style.width = '10px';
      ta.style.height = '10px';
      ta.style.opacity = '0.01';
      ta.style.zIndex = '999999';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, 999999);
      document.execCommand('copy');
      setTimeout(() => { try { ta.remove(); } catch(e){} }, 500);
    } catch(e){}
  }

  function extractRows() {
    let rows = Array.from(document.querySelectorAll('tr.x-grid-row, tbody tr, tr')).filter(r => {
      return r.children.length >= 4 && (r.offsetWidth > 0 || r.offsetHeight > 0 || r.getClientRects().length > 0);
    });

    let matches = [];
    for (let tr of rows) {
      let txt = tr.textContent.toLowerCase();
      if (txt.includes(targetEmail)) {
        let brandText = '';
        if (txt.includes('fireball')) brandText = 'fireball';
        else if (txt.includes('meteoro')) brandText = 'meteoro';
        else if (txt.includes('bison')) brandText = 'bison casino';

        if (tr.children.length > 4) {
          let c4 = tr.children[4].textContent.trim().toLowerCase();
          if (c4.includes('fireball') || c4.includes('meteoro') || c4.includes('bison')) {
            brandText = c4;
          }
        }

        let idVal = tr.children[0] ? tr.children[0].textContent.trim() : '';
        let loginVal = tr.children[1] ? tr.children[1].textContent.trim() : '';
        let nameVal = tr.children[2] ? tr.children[2].textContent.trim() : '';
        let emailVal = tr.children[3] ? tr.children[3].textContent.trim() : targetEmail;
        let cityVal = tr.children[5] ? tr.children[5].textContent.trim() : '';

        // Clean city from postal code if in format "City (postal)"
        if (cityVal && cityVal.includes('(')) {
          cityVal = cityVal.split('(')[0].trim();
        }

        // Check for wallet id in link href
        let walletVal = '';
        let aTags = Array.from(tr.querySelectorAll('a'));
        for (let a of aTags) {
          let href = a.getAttribute('href') || a.href || '';
          let m = href.match(/admin\.user:([a-zA-Z0-9_-]+)/i);
          if (m) {
            walletVal = m[1].trim();
            break;
          }
        }
        if (!walletVal) {
          let m = tr.innerHTML.match(/admin\.user:([a-zA-Z0-9_-]+)/i);
          if (m) walletVal = m[1].trim();
        }
        if (!walletVal) {
          let m = tr.innerHTML.match(/\b([a-f0-9]{24})\b/i);
          if (m) walletVal = m[1].trim();
        }

        matches.push({
          tr: tr,
          id: idVal,
          login: loginVal,
          name: nameVal,
          email: emailVal,
          brand: brandText,
          city: cityVal,
          walletId: walletVal
        });
      }
    }

    if (matches.length === 0) return null;

    // Pick best match by brand
    let chosen = null;
    if (targetBrand && !targetBrand.startsWith('###')) {
      let tb = targetBrand.replace('casino', '').trim();
      chosen = matches.find(m => m.brand.includes(targetBrand) || (tb && m.brand.includes(tb)) || (tb && targetBrand.includes(m.brand)));
    }
    if (!chosen) {
      chosen = matches.find(m => m.brand.includes('bison')) || matches[0];
    }

    chosen.tr.style.backgroundColor = '#d4edda';
    return chosen;
  }

  // 1. Try extracting from currently loaded table
  let found = extractRows();
  if (found) {
    let payload = 'FOUND_USERS_LIST|' + found.email + '|' + found.id + '|' + found.brand + '|' + found.city + '|' + found.walletId + '|' + found.name;
    copyToClipboard(payload);
    return;
  }

  // 2. If not yet in table, fill email in filter and click Search
  let emailInput = null;

  // Method A: ExtJS ComponentQuery
  if (window.Ext && Ext.ComponentQuery) {
    try {
      let textfields = Ext.ComponentQuery.query('textfield');
      let ef = textfields.find(f => {
        let lbl = ((f.fieldLabel || '') + ' ' + (f.emptyText || '') + ' ' + (f.name || '')).toLowerCase();
        return lbl.includes('email');
      });
      if (ef) {
        ef.setValue(targetEmail);
        if (ef.inputEl && ef.inputEl.dom) emailInput = ef.inputEl.dom;
      }
    } catch(e){}
  }

  // Method B: DOM Label lookup
  if (!emailInput) {
    let allLabels = Array.from(document.querySelectorAll('.x-form-item-label, label, span, td, div'));
    let emailLbl = allLabels.find(l => {
      let t = (l.textContent || '').trim().toLowerCase();
      return (t === 'email:' || t === 'email') && (l.offsetWidth > 0 || l.offsetHeight > 0);
    });
    if (emailLbl) {
      let container = emailLbl.closest('.x-form-item, .x-field, tr, td, div');
      if (container) emailInput = container.querySelector('input');
    }
  }

  // Method C: Placeholder "search nick, or name" (index 1 is Email)
  if (!emailInput) {
    let nickInputs = Array.from(document.querySelectorAll('input')).filter(i => {
      let ph = (i.placeholder || '').toLowerCase();
      return (ph.includes('search nick') || ph.includes('nick')) && (i.offsetWidth > 0 || i.offsetHeight > 0);
    });
    if (nickInputs.length >= 2) emailInput = nickInputs[1];
    else if (nickInputs.length === 1) emailInput = nickInputs[0];
  }

  // Method D: Visible inputs fallback
  if (!emailInput) {
    let visibleInputs = Array.from(document.querySelectorAll('input')).filter(i => (i.offsetWidth > 0 || i.offsetHeight > 0) && i.type !== 'button' && i.type !== 'submit' && i.type !== 'hidden');
    if (visibleInputs.length >= 2) emailInput = visibleInputs[1];
  }

  if (emailInput) {
    let s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    if (s) s.call(emailInput, targetEmail); else emailInput.value = targetEmail;
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    emailInput.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  // Click Search
  let searchBtns = Array.from(document.querySelectorAll('button, input[type="button"], a, div[role="button"], .x-btn')).filter(b => {
    let t = (b.textContent || b.value || '').trim().toLowerCase();
    return t === 'search' && (b.offsetWidth > 0 || b.offsetHeight > 0 || b.getBoundingClientRect().width > 0);
  });
  for (let btn of searchBtns) {
    btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    try { btn.click(); } catch(e){}
  }
  if (window.Ext && Ext.ComponentQuery) {
    try {
      let btn = Ext.ComponentQuery.query('button[text=Search]')[0];
      if (btn) {
        btn.fireEvent('click', btn);
        if (btn.handler) btn.handler.call(btn.scope || btn, btn);
      }
    } catch(e){}
  }

  copyToClipboard('FILTER_APPLIED');
})();

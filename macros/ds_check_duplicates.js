
(function () {
  function copyVal(val) {
    try {
      let ta = document.createElement('textarea');
      ta.value = val;
      ta.style.position = 'fixed';
      ta.style.opacity = '0.01';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    } catch(e){}
  }

  function simClick(el) {
    if (!el) return;
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }

  let fn = '###FN###';
  let ln = '###LN###';
  let city = '###CITY###';
  let targetBrand = '###BRAND###'.toLowerCase().trim();

  let inputs = Array.from(document.querySelectorAll('input'));
  let fnInput = inputs.find(i => (i.placeholder || '').toLowerCase().includes('search by firstname'));
  let lnInput = inputs.find(i => (i.placeholder || '').toLowerCase().includes('search by lastname'));

  if (fnInput) {
    let s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    if (s) s.call(fnInput, fn); else fnInput.value = fn;
    fnInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  if (lnInput) {
    let s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    if (s) s.call(lnInput, ln); else lnInput.value = ln;
    lnInput.dispatchEvent(new Event('input', { bubbles: true }));
  }

  let searchBtns = Array.from(document.querySelectorAll('button, a')).filter(
    b => b.textContent.trim().toLowerCase() === 'search' && b.getBoundingClientRect().width > 0
  );
  if (searchBtns.length > 0) simClick(searchBtns[0]);

  function checkBrandDups(rows) {
    if (!targetBrand) return rows.length > 1;
    let ths = Array.from(document.querySelectorAll('th'));
    let brandTh = ths.find(th => th.textContent.toLowerCase().includes('brand'));
    if (!brandTh) return rows.length > 1;
    let idx = ths.indexOf(brandTh);
    let matchCount = 0;
    for (let r of rows) {
      if (r.children.length > idx) {
        let b = r.children[idx].textContent.toLowerCase().trim();
        if (b === targetBrand || b.includes(targetBrand) || targetBrand.includes(b)) {
          matchCount++;
        }
      }
    }
    return matchCount > 1;
  }

  setTimeout(() => {
    let trs = Array.from(document.querySelectorAll('tbody tr')).filter(r => r.children.length > 3);

    if (trs.length > 1) {
      let inputs2 = Array.from(document.querySelectorAll('input'));
      let cityInput = inputs2.find(i => (i.placeholder || '').toLowerCase().includes('search by city'));
      let fnInput2 = inputs2.find(i => (i.placeholder || '').toLowerCase().includes('search by firstname'));
      
      if (cityInput && city) {
        // Clear First Name using the fresh reference
        if (fnInput2) {
          let s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          if (s) s.call(fnInput2, ''); else fnInput2.value = '';
          fnInput2.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Set City
        let s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        if (s) s.call(cityInput, city); else cityInput.value = city;
        cityInput.dispatchEvent(new Event('input', { bubbles: true }));

        // Search again
        let searchBtns2 = Array.from(document.querySelectorAll('button, a')).filter(
          b => b.textContent.trim().toLowerCase() === 'search' && b.getBoundingClientRect().width > 0
        );
        if (searchBtns2.length > 0) simClick(searchBtns2[0]);

        setTimeout(() => {
          let trs2 = Array.from(document.querySelectorAll('tbody tr')).filter(r => r.children.length > 3);
          if (checkBrandDups(trs2)) {
            copyVal('YES');
          } else {
            copyVal('NO');
          }
        }, 4000);
      } else {
        // If no city input or city value, fallback to checking brand on current results
        if (checkBrandDups(trs)) {
          copyVal('YES');
        } else {
          copyVal('NO');
        }
      }
    } else {
      copyVal('NO');
    }
  }, 4000);
})();

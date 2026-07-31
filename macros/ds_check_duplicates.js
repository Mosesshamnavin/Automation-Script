// Dynamic placeholders replaced at runtime:
//   ###FN###   -> first name
//   ###LN###   -> last name
//   ###CITY### -> city

(function () {
  function simClick(el) {
    if (!el) return;
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }

  let fn = '###FN###';
  let ln = '###LN###';
  let city = '###CITY###';

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

  setTimeout(() => {
    let trs = Array.from(document.querySelectorAll('tbody tr')).filter(r => r.children.length > 3);

    if (trs.length > 1) {
      let inputs2 = Array.from(document.querySelectorAll('input'));
      let cityInput = inputs2.find(i => (i.placeholder || '').toLowerCase().includes('search by city'));
      if (cityInput && city) {
        let s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        if (s) s.call(cityInput, city); else cityInput.value = city;
        cityInput.dispatchEvent(new Event('input', { bubbles: true }));
        let clrBtns = Array.from(document.querySelectorAll('button, a')).filter(
          b => b.textContent.trim().toLowerCase() === 'search' && b.getBoundingClientRect().width > 0
        );
        if (clrBtns.length > 0) simClick(clrBtns[0]);
        setTimeout(() => {
          let trs2 = Array.from(document.querySelectorAll('tbody tr')).filter(r => r.children.length > 3);
          if (trs2.length > 1) { prompt('DUPLICATE', 'YES'); } else { prompt('DUPLICATE', 'NO'); }
        }, 4000);
      } else {
        prompt('DUPLICATE', 'YES');
      }
    } else {
      prompt('DUPLICATE', 'NO');
    }
  }, 4000);
})();

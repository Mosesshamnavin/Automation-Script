// Dynamic placeholder:
//   ###TARGET_EMAIL### -> player email to search on Approve page

(function () {
  let targetEmail = '###TARGET_EMAIL###'.trim().toLowerCase();

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

  function simClick(el) {
    if (!el) return;
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }

  function setInputValue(inp, val) {
    inp.focus();
    let s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    if (s) s.call(inp, val);
    else inp.value = val;
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function findSearchInput() {
    let inputs = Array.from(document.querySelectorAll('input'));
    let candidates = inputs.filter(function (inp) {
      let r = inp.getBoundingClientRect();
      if (r.width < 80 || r.height < 10) return false;
      let type = (inp.type || 'text').toLowerCase();
      if (type === 'password' || type === 'checkbox' || type === 'hidden') return false;
      let ph = (inp.placeholder || '').toLowerCase();
      let name = (inp.name || '').toLowerCase();
      let aria = (inp.getAttribute('aria-label') || '').toLowerCase();
      return ph.includes('search') || ph.includes('keyword') || ph.includes('email') ||
        ph.includes('user') || name.includes('search') || aria.includes('search') ||
        aria.includes('keyword');
    });
    if (candidates.length) return candidates[0];

    return inputs.find(function (inp) {
      let r = inp.getBoundingClientRect();
      let type = (inp.type || 'text').toLowerCase();
      return r.width > 120 && r.top < 220 && type !== 'password' && type !== 'hidden';
    }) || null;
  }

  function clickSearchButton() {
    let btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
    let searchBtn = btns.find(function (b) {
      let t = (b.textContent || '').trim().toLowerCase();
      let title = (b.getAttribute('title') || '').toLowerCase();
      let aria = (b.getAttribute('aria-label') || '').toLowerCase();
      return t === 'search' || title.includes('search') || aria.includes('search');
    });
    if (searchBtn) {
      simClick(searchBtn);
      return true;
    }
    return false;
  }

  function clickApproveNav() {
    let els = Array.from(document.querySelectorAll('a, button, li, span, div'));
    let approve = els.find(function (e) {
      let txt = (e.textContent || '').trim();
      let r = e.getBoundingClientRect();
      return txt === 'Approve' && r.width > 0 && r.height > 0;
    });
    if (approve) {
      simClick(approve);
      return true;
    }
    return false;
  }

  try {
    if (!targetEmail || targetEmail.startsWith('###')) {
      copyVal('PIQ_SEARCH_FAIL:NO_EMAIL');
      return;
    }

    if (!location.hash.includes('/approve')) {
      location.hash = '#/approve';
    }

    setTimeout(function () {
      clickApproveNav();

      setTimeout(function () {
        let searchInp = findSearchInput();
        if (!searchInp) {
          copyVal('PIQ_SEARCH_FAIL:NO_INPUT');
          return;
        }

        setInputValue(searchInp, targetEmail);

        setTimeout(function () {
          searchInp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
          searchInp.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
          clickSearchButton();
          copyVal('PIQ_SEARCH_OK:' + targetEmail);
        }, 600);
      }, 1800);
    }, 1200);
  } catch (e) {
    copyVal('PIQ_SEARCH_FAIL:' + e.message);
  }
})();

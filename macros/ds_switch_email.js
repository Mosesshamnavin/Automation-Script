// Dynamic placeholder:
//   ###TARGET_EMAIL### -> optional email to enter

(function () {
  let targetEmail = '###TARGET_EMAIL###';
  if (targetEmail.startsWith('###')) targetEmail = '';

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
    } catch(e){}
  }

  function simClick(el) {
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }

  try {
    let els = Array.from(document.querySelectorAll('*'));
    let bison = els.find(
      e => e.children.length === 0 &&
        e.textContent.trim() === 'Bison BO' &&
        e.getBoundingClientRect().width > 0
    );

    if (bison) {
      simClick(bison);
      setTimeout(() => {
        let els2 = Array.from(document.querySelectorAll('*'));
        let emailLabel = els2.find(
          e => e.children.length === 0 &&
            e.textContent.trim() === 'Email (lowercase)' &&
            e.getBoundingClientRect().width > 0
        );
        if (emailLabel) {
          let r = emailLabel.getBoundingClientRect();
          let inputs = Array.from(document.querySelectorAll('input'));
          let target = null;
          let minDist = Infinity;
          for (let inp of inputs) {
            let ir = inp.getBoundingClientRect();
            if (ir.width > 0 && ir.top >= r.bottom) {
              let dx = (ir.left + ir.width / 2) - (r.left + r.width / 2);
              let dy = ir.top - r.bottom;
              let d = dx * dx + dy * dy;
              if (d < minDist) { minDist = d; target = inp; }
            }
          }
          if (target) {
            target.focus();
            if (target.style) target.style.border = '3px solid blue';
            simClick(target);
            if (targetEmail) {
              let s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
              if (s) s.call(target, targetEmail); else target.value = targetEmail;
              target.dispatchEvent(new Event('input', { bubbles: true }));
              target.dispatchEvent(new Event('change', { bubbles: true }));
            }
            copyVal('EMAIL_FOCUSED_OK');
          } else {
            copyVal('EMAIL_INPUT_NOT_FOUND');
          }
        }
      }, 1500);
    }
  } catch (e) {
    copyVal('ERROR: ' + e.message);
  }
})();

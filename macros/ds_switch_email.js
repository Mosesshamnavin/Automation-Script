(function () {
  try {
    function simClick(el) {
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }

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
          } else {
            alert('Could not find the email input box!');
          }
        }
      }, 1500);
    }
  } catch (e) {
    alert('Macro 1 Error: ' + e.message);
  }
})();

(function () {
  try {
    function simClick(el) {
      if (!el) return;
      el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      if (el.style) el.style.border = '2px solid red';
    }

    let allEls = Array.from(document.querySelectorAll('*'));

    // Check/enable "Include Today"
    let includeText = allEls.find(
      e => e.children.length === 0 &&
        e.textContent.trim().toLowerCase() === 'include today' &&
        e.getBoundingClientRect().width > 0
    );
    if (includeText) {
      let cbNode = includeText.closest('label, mat-checkbox') || includeText.parentElement;
      let input = cbNode.querySelector('input[type="checkbox"]');
      let isChecked = false;
      if (input) {
        isChecked = input.checked;
      } else {
        let ariaNode = cbNode.querySelector('[aria-checked]') || cbNode;
        isChecked = ariaNode.getAttribute('aria-checked') === 'true';
      }
      if (!isChecked) { simClick(input || cbNode); }
    }

    // Click Apply
    setTimeout(() => {
      let applyBtn = Array.from(document.querySelectorAll('*')).find(
        e => e.children.length === 0 &&
          e.textContent.trim().toLowerCase() === 'apply' &&
          e.getBoundingClientRect().width > 0
      );
      if (applyBtn) { simClick(applyBtn); }
      else { alert('Could not find Apply button!'); }
    }, 1000);
  } catch (e) {
    alert('Macro 3 Error: ' + e.message);
  }
})();

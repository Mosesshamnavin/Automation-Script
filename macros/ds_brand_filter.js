(function () {
  try {
    function simClick(el) {
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    }

    let targetBrand = '###TARGET_BRAND###'.toLowerCase().trim();
    if (!targetBrand) targetBrand = 'bison casino';

    let allEls = Array.from(document.querySelectorAll('*'));
    let brandLabel = allEls.find(
      e => e.children.length === 0 &&
        e.textContent.trim().toLowerCase() === 'brand' &&
        e.getBoundingClientRect().width > 0
    );
    if (!brandLabel) { prompt('WD_FILTER:', 'BRAND_LABEL_NOT_FOUND'); return; }

    simClick(brandLabel);

    setTimeout(() => {
      let popupEls = Array.from(document.querySelectorAll('*'));
      let brandOpt = popupEls.find(
        e => e.children.length === 0 &&
          e.textContent.trim().toLowerCase() === targetBrand &&
          e.getBoundingClientRect().width > 0
      );
      
      if (brandOpt) {
        let row = brandOpt.closest('.row, [role="row"], [role="option"]') || brandOpt.parentElement.parentElement;
        if (row) {
          let onlyBtn = Array.from(row.querySelectorAll('*')).find(e => e.children.length === 0 && e.textContent.trim().toLowerCase() === 'only');
          if (onlyBtn) {
            simClick(onlyBtn);
          } else {
            simClick(row);
          }
          setTimeout(() => {
            simClick(document.body);
            prompt('WD_FILTER:', 'SUCCESS');
          }, 500);
        } else {
          prompt('WD_FILTER:', 'ROW_NOT_FOUND');
        }
      } else {
        prompt('WD_FILTER:', 'BRAND_NOT_FOUND');
      }
    }, 1500);
  } catch (e) {
    prompt('WD_FILTER:', 'ERROR: ' + e.message);
  }
})();

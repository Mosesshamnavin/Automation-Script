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
          row.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true, view: window }));
          row.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true, view: window }));
          
          setTimeout(() => {
            let onlyBtn = Array.from(document.querySelectorAll('*')).find(e => e.children.length === 0 && e.textContent.trim().toLowerCase() === 'only' && e.getBoundingClientRect().width > 0);
            
            if (onlyBtn) {
              simClick(onlyBtn);
            } else {
              // Fallback: uncheck the other brand(s) by clicking them
              let allBrandOpts = Array.from(document.querySelectorAll('*')).filter(e => {
                 let t = e.textContent.trim().toLowerCase();
                 return e.children.length === 0 && (t === 'bison casino' || t === 'fireball' || t === 'lemon casino') && e.getBoundingClientRect().width > 0;
              });
              for (let opt of allBrandOpts) {
                 if (opt.textContent.trim().toLowerCase() !== targetBrand) {
                     simClick(opt);
                 }
              }
            }
            setTimeout(() => {
              simClick(document.body);
              prompt('WD_FILTER:', 'SUCCESS');
            }, 500);
          }, 400);
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

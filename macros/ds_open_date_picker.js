(function () {
  try {
    function simClick(el) {
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }

    let els = Array.from(document.querySelectorAll('*'));
    let dateLabel = els.find(
      e => e.children.length === 0 &&
        e.textContent.trim() === 'UTC Time' &&
        e.getBoundingClientRect().width > 0
    );

    if (dateLabel) {
      let r = dateLabel.getBoundingClientRect();
      let target = document.elementFromPoint(r.left + 10, r.bottom + 15);
      if (target) simClick(target);
    }
  } catch (e) {
    alert('Macro 2 Error: ' + e.message);
  }
})();

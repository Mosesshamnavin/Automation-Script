// Dynamic placeholders replaced at runtime:
//   ###PLAYER_ID### -> the numeric player ID (e.g. 743948)

(function () {
  let query = "user###PLAYER_ID###";

  let inputs = Array.from(document.querySelectorAll('input'));
  let visibleInputs = inputs.filter(
    i => i.getBoundingClientRect().width > 0 &&
      i.type !== 'hidden' && i.type !== 'checkbox' && i.type !== 'radio'
  );

  let searchInput =
    visibleInputs.find(i => (i.placeholder || '').toLowerCase().trim() === 'search...') ||
    visibleInputs.find(i => (i.placeholder || '').toLowerCase().trim().includes('search')) ||
    visibleInputs[0];

  if (searchInput) {
    searchInput.focus();
    let setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    if (setter) setter.call(searchInput, query); else searchInput.value = query;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    searchInput.dispatchEvent(new Event('change', { bubbles: true }));
    setTimeout(() => {
      searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
      searchInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
      searchInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
    }, 500);
  }
})();

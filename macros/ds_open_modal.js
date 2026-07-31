// Dynamic placeholders replaced at runtime:
//   ###PLAYER_ID###   -> the player's hex/numeric ID
//   ###PLAYER_EMAIL###-> the player's email address

(function () {
  let id = '###PLAYER_ID###';
  let email = '###PLAYER_EMAIL###';

  window.location.hash = '#action:admin.payment.details:' + id;

  let els = Array.from(document.querySelectorAll('*'));
  let target = els.find(
    e => e.children.length === 0 &&
      (e.textContent.trim() === id ||
        (email && e.textContent.trim().toLowerCase() === email.toLowerCase()))
  );

  if (target) {
    let clickEl = target.closest('a') || target;
    clickEl.click();
    clickEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }
})();

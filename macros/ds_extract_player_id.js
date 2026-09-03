(function () {
  let txt = document.body.innerText || document.body.textContent || '';

  // Extract true 5-7 digit User ID from the profile page
  let id = '';
  let all = Array.from(document.querySelectorAll('label, dt, th, td, span, strong, div, p, input'));
  
  // 1. Try finding 'User ID:' or 'Player ID:' label
  let idLabel = all.find(e => {
    let t = (e.textContent || '').trim().toLowerCase();
    return (t === 'user id:' || t === 'user id' || t === 'player id:' || t === 'player id' || t === 'id:' || t === 'id') && e.children.length === 0;
  });
  if (idLabel) {
    let next = idLabel.nextElementSibling || (idLabel.parentElement ? idLabel.parentElement.querySelector('strong, span, dd, td, a') : null);
    if (!next && idLabel.closest('tr')) {
      let tr = idLabel.closest('tr');
      if (tr.children.length >= 2) next = tr.children[1];
    }
    if (next) {
      let m = (next.textContent || next.value || '').trim().match(/\d{4,}/);
      if (m) id = m[0];
    }
  }

  // 2. Try regex for 5-7 digit User ID in text
  if (!id) {
    let matchId = txt.match(/\b(?:user\s*id|player\s*id)\s*[:=]?\s*(\d{5,7})\b/i);
    if (matchId) id = matchId[1];
  }

  // 3. Fallback: match (id: \d{5,7})
  if (!id) {
    let matchId = txt.match(/\(id:\s*(\d{5,7})/i);
    if (matchId) id = matchId[1];
  }

  // Extract true Name from profile label
  let nameLabel = all.find(e => {
    let t = (e.textContent || '').trim().toLowerCase();
    return (t === 'name:' || t === 'name' || t === 'player name:' || t === 'player name') && e.children.length === 0;
  });
  let name = '';
  if (nameLabel) {
    let next = nameLabel.nextElementSibling || (nameLabel.parentElement ? nameLabel.parentElement.querySelector('strong, span, dd') : null);
    if (next) {
      let cand = (next.textContent || next.value || '').trim();
      if (cand && !['email', 'name', 'login', 'id', 'status'].includes(cand.toLowerCase())) {
        name = cand;
      }
    }
  }

  // Extract true Login/Email from profile label (strictly NOT from notes)
  let emailLabel = all.find(e => {
    let t = (e.textContent || '').trim().toLowerCase();
    return (t === 'login:' || t === 'login' || t === 'email:' || t === 'email') && e.children.length === 0;
  });
  let email = '';
  if (emailLabel) {
    let next = emailLabel.nextElementSibling || (emailLabel.parentElement ? emailLabel.parentElement.querySelector('strong, span, a, dd') : null);
    if (next) {
      let emMatch = (next.textContent || next.value || '').trim().match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emMatch) email = emMatch[0].toLowerCase();
    }
  }

  // Extract Hex Wallet ID (24-character hexadecimal MongoDB ObjectId, e.g. 6191abb85d0fbec8ec110bf3)
  let walletId = '';
  let widLabel = all.find(e => {
    let t = (e.textContent || '').trim().toLowerCase();
    return (t === 'wallet id:' || t === 'wallet id' || t === 'wallet:' || t === 'wallet') && e.children.length === 0;
  });
  if (widLabel) {
    let next = widLabel.nextElementSibling || (widLabel.parentElement ? widLabel.parentElement.querySelector('strong, span, dd, td, input, a') : null);
    if (next) {
      let m = (next.textContent || next.value || '').trim().match(/[a-f0-9]{20,32}/i);
      if (m) walletId = m[0];
    }
  }
  if (!walletId) {
    let hexMatch = txt.match(/\b([a-f0-9]{24})\b/i);
    if (hexMatch) walletId = hexMatch[1];
  }

  // Extract City
  let city = '';
  let cityLabel = all.find(e => {
    let t = (e.textContent || '').trim().toLowerCase();
    return (t === 'city:' || t === 'city') && e.children.length === 0;
  });
  if (cityLabel) {
    let next = cityLabel.nextElementSibling || (cityLabel.parentElement ? cityLabel.parentElement.querySelector('strong, span, dd, td, input') : null);
    if (next) city = (next.textContent || next.value || '').trim();
  }

  let res = id + '|NAME:' + name + '|EMAIL:' + email + '|WALLET:' + walletId + '|CITY:' + city;
  let input = document.createElement('input');
  input.value = res;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
})();

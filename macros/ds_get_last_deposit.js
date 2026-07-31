(function () {
  let allRows = Array.from(document.querySelectorAll('tbody tr'));
  let headers = Array.from(document.querySelectorAll('th'));
  let typeIdx = headers.findIndex(th => th.textContent.trim().toLowerCase() === 'type');
  let idIdx = headers.findIndex(th => th.textContent.trim().toLowerCase() === 'id');

  if (typeIdx !== -1 && idIdx !== -1) {
    let depositRow = allRows.find(tr => {
      if (tr.children.length > typeIdx) {
        let typeVal = tr.children[typeIdx].textContent.trim().toUpperCase();
        return typeVal === 'DEPOSIT';
      }
      return false;
    });
    if (depositRow && depositRow.children.length > idIdx) {
      let depId = depositRow.children[idIdx].textContent.trim();
      let input = document.createElement('input');
      input.value = "DEP_ID:" + depId;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      return;
    }
  }

  let input = document.createElement('input');
  input.value = "DEP_ID:NOT_FOUND";
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
})();

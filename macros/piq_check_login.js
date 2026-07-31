(function () {
  let isLoggedOut = (
    window.location.hostname.includes("auth") ||
    window.location.href.includes("login")
  ) ? "YES" : "NO";

  let input = document.createElement('input');
  input.value = "LOGGED_OUT:" + isLoggedOut;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
})();

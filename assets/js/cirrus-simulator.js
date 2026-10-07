(() => {
  // Paste the deployed Google Apps Script Web App URL between the quotes.
  const RESERVATION_APP_URL = "";

  document.addEventListener("DOMContentLoaded", () => {
    const frame = document.getElementById("cirrusReservationFrame");
    const setup = document.getElementById("cirrusSetupMessage");
    if (!frame || !setup) return;

    if (RESERVATION_APP_URL && /^https:\/\/script\.google\.com\//.test(RESERVATION_APP_URL)) {
      frame.src = RESERVATION_APP_URL;
      frame.hidden = false;
      setup.hidden = true;
    }
  });
})();
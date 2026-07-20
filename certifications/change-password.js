(function () {
  "use strict";

  function setStatus(element, message, isError) {
    if (!element) return;
    element.hidden = false;
    element.textContent = message;
    element.classList.toggle("error", !!isError);
  }

  document.addEventListener("DOMContentLoaded", async function () {
    const auth = window.LockwoodCertAuth;
    const form = document.querySelector("[data-change-password-form]");
    const status = document.querySelector("[data-change-password-status]");
    if (!auth || !form) return;

    const session = auth.getSession();
    if (!session || !session.token) {
      window.location.href = "teacher-login.html?next=" + encodeURIComponent("change-password.html");
      return;
    }

    const validation = await auth.validateSession();
    if (!validation.ok) {
      window.location.href = "teacher-login.html?next=" + encodeURIComponent("change-password.html");
      return;
    }

    const user = validation.user || auth.getProfile() || {};
    const name = user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ") || "Account";
    const identity = document.querySelector("[data-change-password-user]");
    if (identity) identity.textContent = name;

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      if (data.newPassword !== data.confirmPassword) {
        setStatus(status, "New passwords do not match.", true);
        return;
      }
      setStatus(status, "Updating your password…", false);

      try {
        const result = await auth.request("changePassword", {
          token: session.token,
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        });
        if (result.user) {
          auth.saveSession({ token: session.token, expiresAt: session.expiresAt, user: result.user });
        }
        setStatus(status, "Password updated. Redirecting…", false);
        const next = new URLSearchParams(window.location.search).get("next");
        const role = String(result.user && result.user.role || user.role || "").toLowerCase();
        window.location.href = next || (["teacher", "teacher_admin"].includes(role) ? "teacher-dashboard.html" : "index.html");
      } catch (err) {
        setStatus(status, err.message, true);
      }
    });
  });
})();

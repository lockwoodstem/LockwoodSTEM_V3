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

    const params = new URLSearchParams(window.location.search);
    const teacherMode = params.get("mode") === "teacher";
    const getSession = teacherMode && auth.getTeacherSession ? auth.getTeacherSession : auth.getSession;
    const validate = teacherMode && auth.validateTeacherSession ? auth.validateTeacherSession : auth.validateSession;
    const getProfile = teacherMode && auth.getTeacherProfile ? auth.getTeacherProfile : auth.getProfile;
    const save = teacherMode && auth.saveTeacherSession ? auth.saveTeacherSession : auth.saveSession;
    const loginPage = teacherMode ? "teacher-login.html" : "login.html";

    const session = getSession();
    if (!session || !session.token) {
      window.location.href = loginPage + "?next=" + encodeURIComponent("change-password.html" + window.location.search);
      return;
    }

    const validation = await validate();
    if (!validation.ok) {
      window.location.href = loginPage + "?next=" + encodeURIComponent("change-password.html" + window.location.search);
      return;
    }

    const user = validation.user || getProfile() || {};
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
          save({ token: session.token, expiresAt: session.expiresAt, user: result.user });
          if (teacherMode) auth.saveSession({ token: session.token, expiresAt: session.expiresAt, user: result.user });
        }
        setStatus(status, "Password updated. Redirecting…", false);
        const next = params.get("next");
        const role = String(result.user && result.user.role || user.role || "").toLowerCase();
        window.location.href = next || (["teacher", "teacher_admin"].includes(role) ? "teacher-dashboard.html" : "index.html");
      } catch (err) {
        setStatus(status, err.message, true);
      }
    });
  });
})();

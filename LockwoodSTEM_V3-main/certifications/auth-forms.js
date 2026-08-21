document.addEventListener("DOMContentLoaded", () => {
  const auth = window.LockwoodCertAuth;
  const setupNotice = document.querySelector("[data-setup-notice]");
  const configError = auth ? auth.getConfigError() : "Account scripts did not load.";
  if (setupNotice && configError) { setupNotice.hidden = false; setupNotice.textContent = configError; }

  const loginForm = document.querySelector("[data-login-form]");
  if (loginForm) loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = document.querySelector("[data-login-status]");
    setStatus(status, "Signing in...", false);
    const data = Object.fromEntries(new FormData(loginForm).entries());
    try {
      const result = await auth.request("login", { identifier: data.identifier, password: data.password });
      auth.saveSession(result);
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next") || "index.html";
      if (result.user && result.user.mustChangePassword) {
        window.location.href = "change-password.html?next=" + encodeURIComponent(next);
        return;
      }
      window.location.href = next;
    } catch (err) { setStatus(status, err.message, true); }
  });

  const forgotPasswordForm = document.querySelector("[data-forgot-password-form]");
  if (forgotPasswordForm) forgotPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = document.querySelector("[data-forgot-password-status]");
    const data = Object.fromEntries(new FormData(forgotPasswordForm).entries());
    setStatus(status, "Requesting a reset link...", false);
    try {
      const result = await auth.request("forgotPassword", { identifier: data.identifier });
      setStatus(status, result.message || "If an active student account matches that information, a reset link has been sent to the school email on file.", false);
      forgotPasswordForm.reset();
    } catch (err) { setStatus(status, err.message, true); }
  });

  const resetPasswordForm = document.querySelector("[data-reset-password-form]");
  if (resetPasswordForm) {
    const token = new URLSearchParams(window.location.search).get("token") || "";
    const status = document.querySelector("[data-reset-password-status]");
    if (!token) {
      setStatus(status, "This password-reset link is missing its reset token. Request a new link from the login page.", true);
      resetPasswordForm.querySelectorAll("input,button").forEach((el) => { el.disabled = true; });
    }
    resetPasswordForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(resetPasswordForm).entries());
      if (data.newPassword !== data.confirmPassword) {
        setStatus(status, "Passwords do not match.", true);
        return;
      }
      if (String(data.newPassword || "").length < 10) {
        setStatus(status, "Your new password must be at least 10 characters.", true);
        return;
      }
      setStatus(status, "Resetting password...", false);
      try {
        await auth.request("resetPassword", { token, newPassword: data.newPassword });
        resetPasswordForm.hidden = true;
        const success = document.querySelector("[data-reset-password-success]");
        if (success) success.hidden = false;
        setStatus(status, "Password reset successfully. You can now sign in with your new password.", false);
      } catch (err) {
        setStatus(status, err.message, true);
      }
    });
  }

  const registerForm = document.querySelector("[data-register-form]");
  if (registerForm) registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = document.querySelector("[data-register-status]");
    const data = Object.fromEntries(new FormData(registerForm).entries());
    if (data.password !== data.confirmPassword) { setStatus(status, "Passwords do not match.", true); return; }
    setStatus(status, "Creating account...", false);
    try {
      const result = await auth.request("register", { firstName:data.firstName,lastName:data.lastName,email:data.email,studentId:data.studentId,period:data.period,password:data.password });
      auth.saveSession(result); window.location.href = "index.html";
    } catch (err) { setStatus(status, err.message, true); }
  });

  const accountBox = document.querySelector("[data-account-box]");
  if (accountBox && auth) {
    const profile = auth.getProfile();
    if (!profile) { window.location.href = "login.html"; return; }
    accountBox.innerHTML = `
      <div class="eyebrow">Student Account</div>
      <h2>${auth.escapeHtml(profile.fullName || [profile.firstName,profile.lastName].filter(Boolean).join(" ") || "Student")}</h2>
      <dl class="cert-profile-list">
        <div><dt>Email</dt><dd>${auth.escapeHtml(profile.email || "")}</dd></div>
        <div><dt>Student ID</dt><dd>${auth.escapeHtml(profile.studentId || "")}</dd></div>
        <div><dt>Class period</dt><dd>${auth.escapeHtml(profile.period || "")}</dd></div>
        <div><dt>Role</dt><dd>${auth.escapeHtml(profile.role || "student")}</dd></div>
      </dl>
      <div class="hero-actions"><a class="btn" href="index.html">Certification Hub</a><a class="btn secondary" href="badges.html">My Badges</a><button class="btn secondary" type="button" data-account-logout>Log out</button></div>`;
    accountBox.querySelector("[data-account-logout]").addEventListener("click",()=>{auth.clearSession();window.location.href="login.html";});
  }
});
function setStatus(el,message,isError){if(!el)return;el.hidden=false;el.textContent=message;el.classList.toggle("error",!!isError);}

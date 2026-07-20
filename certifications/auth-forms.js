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

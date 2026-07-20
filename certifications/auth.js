(function () {
  const fallbackWebAppUrl = "https://script.google.com/macros/s/AKfycbw0j9MBMdMG-QNi2IIbp1SE6htXwYgKVV65dV1gLMMTkyK6ujNBWYXtIl-1Jnjlyns/exec";
  const cfg = window.LOCKWOOD_CERT_AUTH || {};
  if (!cfg.WEB_APP_URL) cfg.WEB_APP_URL = fallbackWebAppUrl;

  const sessionKey = cfg.SESSION_KEY || "lockwoodstem_cert_session";
  const profileKey = cfg.PROFILE_KEY || "lockwoodstem_cert_profile";
  const teacherSessionKey = cfg.TEACHER_SESSION_KEY || "lockwoodstem_teacher_session";
  const teacherProfileKey = cfg.TEACHER_PROFILE_KEY || "lockwoodstem_teacher_profile";

  function readJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch (err) {
      return null;
    }
  }

  function writeSession(payload, targetSessionKey, targetProfileKey) {
    if (payload && payload.token) {
      localStorage.setItem(targetSessionKey, JSON.stringify({
        token: payload.token,
        expiresAt: payload.expiresAt || "",
        savedAt: new Date().toISOString()
      }));
    }
    if (payload && payload.user) {
      localStorage.setItem(targetProfileKey, JSON.stringify(payload.user));
    }
  }

  function clearStoredSession(targetSessionKey, targetProfileKey) {
    localStorage.removeItem(targetSessionKey);
    localStorage.removeItem(targetProfileKey);
  }

  function getConfigError() {
    if (!cfg.WEB_APP_URL || cfg.WEB_APP_URL.includes("PASTE")) {
      return "Certification accounts are not connected yet. Add your Google Apps Script Web App URL in certifications/auth-config.js.";
    }
    return "";
  }

  function getSession() {
    return readJson(sessionKey);
  }

  function getProfile() {
    return readJson(profileKey);
  }

  function saveSession(payload) {
    writeSession(payload, sessionKey, profileKey);
  }

  function clearSession() {
    clearStoredSession(sessionKey, profileKey);
  }

  function getTeacherSession() {
    return readJson(teacherSessionKey);
  }

  function getTeacherProfile() {
    return readJson(teacherProfileKey);
  }

  function saveTeacherSession(payload) {
    writeSession(payload, teacherSessionKey, teacherProfileKey);
  }

  function clearTeacherSession() {
    clearStoredSession(teacherSessionKey, teacherProfileKey);
  }

  async function request(action, data) {
    const configError = getConfigError();
    if (configError) throw new Error(configError);

    const body = Object.assign({}, data || {}, { action });
    const response = await fetch(cfg.WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
      redirect: "follow"
    });

    const text = await response.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (err) {
      throw new Error("The account server returned an unreadable response. Check deployment permissions and the Web App URL.");
    }

    if (!json.ok) throw new Error(json.error || "The account request could not be completed.");
    return json;
  }

  async function validateStoredSession(targetSessionKey, targetProfileKey, clearFn) {
    const session = readJson(targetSessionKey);
    if (!session || !session.token) return { ok: false, reason: "missing" };

    try {
      const result = await request("validate", { token: session.token });
      if (result.user) localStorage.setItem(targetProfileKey, JSON.stringify(result.user));
      return { ok: true, user: result.user || readJson(targetProfileKey) };
    } catch (err) {
      clearFn();
      return { ok: false, reason: err.message };
    }
  }

  function validateSession() {
    return validateStoredSession(sessionKey, profileKey, clearSession);
  }

  function validateTeacherSession() {
    return validateStoredSession(teacherSessionKey, teacherProfileKey, clearTeacherSession);
  }

  function redirectToLogin() {
    const current = window.location.pathname.split("/").pop() || "index.html";
    const query = encodeURIComponent(current + window.location.search + window.location.hash);
    window.location.href = "login.html?next=" + query;
  }

  function isTeacherRole(role) {
    const normalized = String(role || "").toLowerCase();
    return normalized === "teacher" || normalized === "teacher_admin";
  }

  function roleLabel(role) {
    const normalized = String(role || "").toLowerCase();
    if (normalized === "teacher_admin") return "Teacher Admin";
    if (normalized === "teacher") return "Teacher";
    return "Student";
  }

  function applyRoleVisibility(user) {
    const teacher = isTeacherRole(user && user.role);
    document.querySelectorAll("[data-teacher-only]").forEach((element) => {
      element.hidden = !teacher;
      element.setAttribute("aria-hidden", teacher ? "false" : "true");
    });
    document.documentElement.classList.toggle("cert-role-teacher", teacher);
    document.documentElement.classList.toggle("cert-role-student", !teacher);
  }

  function ensureAccountBarStyles() {
    if (document.getElementById("lockwood-account-bar-session-styles")) return;
    const style = document.createElement("style");
    style.id = "lockwood-account-bar-session-styles";
    style.textContent = `
      .cert-account-inner.no-microbadges{grid-template-columns:minmax(220px,1fr) auto;align-items:center;}
      @media(max-width:1100px){.cert-account-inner.no-microbadges{grid-template-columns:1fr;}.cert-account-inner.no-microbadges .cert-account-actions{justify-content:flex-start;}}
    `;
    document.head.appendChild(style);
  }

  function renderAccountBar(user, options) {
    const main = document.querySelector("main");
    if (!main || document.querySelector(".cert-account-bar")) return;

    ensureAccountBarStyles();
    const opts = options || {};
    const teacherMode = opts.sessionType === "teacher";
    const displayName = user && (user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ")) || "Student";
    const role = user && user.role ? user.role : "student";
    const readableRole = roleLabel(role);
    applyRoleVisibility(user);

    // Student badges belong on the Progress and My Badges pages, not in the top bar.
    const showBadgeStrip = opts.showBadges === true && isTeacherRole(role);
    const bar = document.createElement("section");
    bar.className = "cert-account-bar";
    bar.innerHTML = `
      <div class="container cert-account-inner${showBadgeStrip ? "" : " no-microbadges"}">
        <div class="cert-account-identity">
          <strong>Signed in:</strong> <span>${escapeHtml(displayName)}</span>
          <span class="cert-account-role">${escapeHtml(readableRole)}</span>
        </div>
        ${showBadgeStrip ? `
        <div class="micro-badge-strip" data-microbadge-strip aria-label="Certification microcredential badges">
          <span class="micro-badge-loading">Loading badges...</span>
        </div>` : ""}
        <div class="cert-account-actions">
          ${isTeacherRole(role) ? `<a class="btn small secondary cert-teacher-dashboard-btn" href="teacher-dashboard.html">Teacher Dashboard</a>` : ""}
          ${isTeacherRole(role) ? `<a class="btn small secondary cert-account-btn" href="change-password.html?mode=teacher&next=teacher-dashboard.html">Change Password</a>` : `<a class="btn small secondary cert-account-btn" href="change-password.html">Change Password</a>`}
          ${!isTeacherRole(role) ? `<a class="btn small secondary cert-account-btn" href="account.html">Progress</a><a class="btn small secondary cert-account-btn" href="badges.html">Badges</a>` : ""}
          <button class="btn small cert-logout-btn" type="button" data-cert-logout aria-label="Log out of certification account">Log out</button>
        </div>
      </div>
    `;
    main.prepend(bar);

    if (showBadgeStrip && window.LockwoodMicroBadges && window.LockwoodMicroBadges.refresh) {
      window.LockwoodMicroBadges.refresh();
    }

    bar.querySelectorAll("[data-cert-logout]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const activeSession = teacherMode ? getTeacherSession() : getSession();
        try {
          if (activeSession && activeSession.token && !getConfigError()) {
            await request("logout", { token: activeSession.token });
          }
        } catch (err) {
          // Always finish the local sign-out.
        }

        if (teacherMode) {
          const standardSession = getSession();
          if (standardSession && activeSession && standardSession.token === activeSession.token) clearSession();
          clearTeacherSession();
          window.location.href = "teacher-login.html";
        } else {
          clearSession();
          window.location.href = "login.html";
        }
      });
    });
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[ch];
    });
  }

  window.LockwoodCertAuth = {
    request,
    getSession,
    getProfile,
    saveSession,
    clearSession,
    validateSession,
    getTeacherSession,
    getTeacherProfile,
    saveTeacherSession,
    clearTeacherSession,
    validateTeacherSession,
    redirectToLogin,
    renderAccountBar,
    getConfigError,
    escapeHtml,
    isTeacherRole,
    roleLabel,
    applyRoleVisibility
  };
})();

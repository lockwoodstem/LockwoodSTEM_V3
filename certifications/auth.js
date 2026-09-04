(function () {
  "use strict";

  const fallbackWebAppUrl = "https://script.google.com/macros/s/AKfycbw0j9MBMdMG-QNi2IIbp1SE6htXwYgKVV65dV1gLMMTkyK6ujNBWYXtIl-1Jnjlyns/exec";
  const cfg = window.LOCKWOOD_CERT_AUTH || {};
  if (!cfg.WEB_APP_URL) cfg.WEB_APP_URL = fallbackWebAppUrl;

  const studentSessionKey = cfg.SESSION_KEY || "lockwoodstem_cert_session";
  const studentProfileKey = cfg.PROFILE_KEY || "lockwoodstem_cert_profile";
  const teacherSessionKey = cfg.TEACHER_SESSION_KEY || "lockwoodstem_teacher_session";
  const teacherProfileKey = cfg.TEACHER_PROFILE_KEY || "lockwoodstem_teacher_profile";

  function readJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch (err) {
      return null;
    }
  }

  function writeSession(payload, sessionKey, profileKey) {
    if (payload && payload.token) {
      localStorage.setItem(sessionKey, JSON.stringify({
        token: payload.token,
        expiresAt: payload.expiresAt || "",
        savedAt: new Date().toISOString()
      }));
    }
    if (payload && payload.user) {
      localStorage.setItem(profileKey, JSON.stringify(payload.user));
    }
  }

  function clearStoredSession(sessionKey, profileKey) {
    localStorage.removeItem(sessionKey);
    localStorage.removeItem(profileKey);
  }

  function getConfigError() {
    if (!cfg.WEB_APP_URL || cfg.WEB_APP_URL.includes("PASTE")) {
      return "Certification accounts are not connected yet. Add the Google Apps Script Web App URL in certifications/auth-config.js.";
    }
    return "";
  }

  function getSession() { return readJson(studentSessionKey); }
  function getProfile() { return readJson(studentProfileKey); }
  function saveSession(payload) { writeSession(payload, studentSessionKey, studentProfileKey); }
  function clearSession() { clearStoredSession(studentSessionKey, studentProfileKey); }

  function getTeacherSession() { return readJson(teacherSessionKey); }
  function getTeacherProfile() { return readJson(teacherProfileKey); }
  function saveTeacherSession(payload) { writeSession(payload, teacherSessionKey, teacherProfileKey); }
  function clearTeacherSession() { clearStoredSession(teacherSessionKey, teacherProfileKey); }

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

  async function validateStoredSession(sessionKey, profileKey, clearFn) {
    const session = readJson(sessionKey);
    if (!session || !session.token) return { ok: false, reason: "missing" };

    try {
      const result = await request("validate", { token: session.token });
      if (result.user) localStorage.setItem(profileKey, JSON.stringify(result.user));
      return { ok: true, user: result.user || readJson(profileKey) };
    } catch (err) {
      clearFn();
      return { ok: false, reason: err.message };
    }
  }

  function validateSession() {
    return validateStoredSession(studentSessionKey, studentProfileKey, clearSession);
  }

  function validateTeacherSession() {
    return validateStoredSession(teacherSessionKey, teacherProfileKey, clearTeacherSession);
  }

  function redirectToLogin() {
    const current = window.location.pathname.split("/").pop() || "index.html";
    const query = encodeURIComponent(current + window.location.search + window.location.hash);
    window.location.href = "login.html?next=" + query;
  }

  function normalizeRole(value) {
    return String(value || "student").trim().toLowerCase();
  }

  function isTeacherRole(value) {
    const role = normalizeRole(value);
    return role === "teacher" || role === "teacher_admin";
  }

  function isTeacherAdminRole(value) {
    return normalizeRole(value) === "teacher_admin";
  }

  function formatRoleLabel(value) {
    const role = normalizeRole(value);
    if (role === "teacher_admin") return "Teacher Admin";
    if (role === "teacher") return "Teacher";
    return "Student";
  }

  function syncTeacherHeroActions(role) {
    const actions = document.querySelector(".hero-actions.consistent-actions");
    if (!actions) return;
    const existing = actions.querySelector("[data-teacher-tools-link]");
    const show = isTeacherAdminRole(role);

    if (show && !existing) {
      const link = document.createElement("a");
      link.className = "btn secondary consistent-action-link";
      link.href = "teacher-dashboard.html";
      link.textContent = "Teacher Tools";
      link.setAttribute("data-teacher-tools-link", "");
      const logout = actions.querySelector("[data-cert-logout]");
      if (logout) actions.insertBefore(link, logout);
      else actions.appendChild(link);
    } else if (!show && existing) {
      existing.remove();
    }
  }

  function renderAccountBar(user, options) {
    const main = document.querySelector("main");
    if (!main || document.querySelector(".cert-account-bar")) return;

    const opts = options || {};
    const teacherMode = opts.sessionType === "teacher";
    const role = normalizeRole(user && user.role);
    const displayName = user && (user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ")) || "Student";
    const showTeacherDashboard = isTeacherAdminRole(role);

    const bar = document.createElement("section");
    bar.className = "cert-account-bar";
    bar.setAttribute("data-role", role);
    bar.innerHTML = `
      <div class="container cert-account-inner no-microbadges">
        <div class="cert-account-identity">
          <strong>Signed in:</strong> <span>${escapeHtml(displayName)}</span>
          <span class="cert-account-role">${escapeHtml(formatRoleLabel(role))}</span>
        </div>
        <div class="cert-account-actions">
          ${showTeacherDashboard ? `<a class="btn small secondary cert-teacher-dashboard-btn" href="teacher-dashboard.html">Teacher Dashboard</a>` : ""}
          ${isTeacherRole(role) ? `<a class="btn small secondary cert-account-btn" href="index.html">Certification Hub</a>` : `<a class="btn small secondary cert-account-btn" href="account.html">Progress</a><a class="btn small secondary cert-account-btn" href="badges.html">Badges</a>`}
          <button class="btn small cert-logout-btn" type="button" data-cert-logout aria-label="Log out of certification account">Log out</button>
        </div>
      </div>`;

    main.prepend(bar);
    if (!teacherMode) syncTeacherHeroActions(role);

    bar.querySelectorAll("[data-cert-logout]").forEach((button) => {
      button.addEventListener("click", async () => {
        const session = teacherMode ? getTeacherSession() : getSession();
        try {
          if (session && session.token && !getConfigError()) {
            await request("logout", { token: session.token });
          }
        } catch (err) {
          // Always complete local sign-out.
        }

        if (teacherMode) {
          clearTeacherSession();
          const studentSession = getSession();
          if (studentSession && session && studentSession.token === session.token) clearSession();
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
    normalizeRole,
    isTeacherRole,
    isTeacherAdminRole,
    formatRoleLabel
  };
})();

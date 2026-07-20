(function () {
  "use strict";

  const CERTS = [
    { certId: "3d-printing", label: "3D Printing", hasOnline: true },
    { certId: "laser-cutting", label: "Laser Cutting", hasOnline: true },
    { certId: "cnc", label: "CNC", hasOnline: true },
    { certId: "drill-press", label: "Drill Press", hasOnline: true },
    { certId: "soldering", label: "Soldering", hasOnline: true },
    { certId: "hand-cutting-tools", label: "Hand & Cutting Tools", hasOnline: true }
  ];

  let dashboardData = null;
  let teacherUser = null;

  function authApi() { return window.LockwoodCertAuth || null; }
  function isTeacher(user) { return !!(user && authApi() && authApi().isTeacherRole(user.role)); }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[ch];
    });
  }

  function setLoginStatus(message, error) {
    const status = document.querySelector("[data-teacher-login-status]");
    if (!status) return;
    status.hidden = false;
    status.className = error ? "form-status error" : "form-status";
    status.textContent = message;
  }

  async function setupTeacherLogin() {
    const form = document.querySelector("[data-teacher-login-form]");
    if (!form) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("role") === "required") {
      setLoginStatus("Teacher or Teacher Admin access is required for that page.", true);
    } else if (params.get("role") === "refresh") {
      setLoginStatus("Sign in again with your Teacher Admin account. The teacher dashboard now uses a separate secure session.", true);
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const auth = authApi();
      if (!auth) return setLoginStatus("Account scripts did not load.", true);
      const data = Object.fromEntries(new FormData(form).entries());
      setLoginStatus("Checking Teacher Admin account...", false);

      try {
        const result = await auth.request("login", {
          identifier: data.identifier,
          password: data.password
        });

        if (!result.user || !auth.isTeacherRole(result.user.role)) {
          setLoginStatus("This account is not marked as a teacher or Teacher Admin account.", true);
          return;
        }

        // Preserve an isolated teacher token. Also make the teacher profile current
        // so the Certification Hub can reveal Teacher Tools for Teacher Admin.
        auth.saveTeacherSession(result);
        auth.saveSession(result);
        window.location.href = "teacher-dashboard.html";
      } catch (err) {
        setLoginStatus(err.message, true);
      }
    });
  }

  async function initializeTeacherDashboard() {
    if (!document.querySelector("[data-teacher-dashboard]")) return;
    const auth = authApi();
    if (!auth) return;

    const session = auth.getTeacherSession();
    if (!session || !session.token) {
      window.location.href = "teacher-login.html?role=refresh";
      return;
    }

    const validation = await auth.validateTeacherSession();
    if (!validation.ok || !isTeacher(validation.user)) {
      auth.clearTeacherSession();
      window.location.href = "teacher-login.html?role=refresh";
      return;
    }

    teacherUser = validation.user;
    document.documentElement.classList.remove("cert-auth-checking");
    auth.renderAccountBar(teacherUser, { sessionType: "teacher" });
    await loadDashboard();
  }

  async function loadDashboard() {
    const auth = authApi();
    const session = auth && auth.getTeacherSession();
    const status = document.querySelector("[data-teacher-dashboard-status]");
    const target = document.querySelector("[data-teacher-dashboard]");
    if (!status || !target) return;

    if (!session || !session.token) {
      window.location.href = "teacher-login.html?role=refresh";
      return;
    }

    status.className = "teacher-dashboard-status";
    status.textContent = "Loading students and certification results...";
    target.innerHTML = "";

    try {
      dashboardData = await auth.request("getTeacherDashboard", { token: session.token });
      renderDashboard();
    } catch (err) {
      status.className = "teacher-dashboard-status error";
      if (/teacher access is required/i.test(err.message)) {
        status.textContent = "The account server rejected the Teacher Admin token. Replace Code.gs with the included version, deploy a new version of the existing Web App, then sign in again through Teacher Login.";
      } else {
        status.textContent = err.message;
      }
    }
  }

  function renderDashboard() {
    const status = document.querySelector("[data-teacher-dashboard-status]");
    const target = document.querySelector("[data-teacher-dashboard]");
    const filter = (document.querySelector("[data-teacher-filter]")?.value || "").toLowerCase();
    const certFilter = document.querySelector("[data-teacher-cert-filter]")?.value || "all";
    if (!dashboardData || !target || !status) return;

    const students = dashboardData.students || [];
    const rows = [];
    students.forEach((student) => {
      const search = [student.fullName, student.email, student.studentId, student.period].join(" ").toLowerCase();
      if (filter && !search.includes(filter)) return;

      CERTS.forEach((cert) => {
        if (certFilter !== "all" && cert.certId !== certFilter) return;
        const certStatus = (student.statuses && student.statuses[cert.certId]) || {};
        rows.push(rowMarkup(student, cert, certStatus));
      });
    });

    status.className = "teacher-dashboard-status";
    status.textContent = `${students.length} student account(s) loaded. ${rows.length} approval row(s) shown.`;
    target.innerHTML = `
      <table class="teacher-approval-table">
        <thead><tr><th>Student</th><th>Certification</th><th>Online Test</th><th>Hands-on</th><th>Badge</th><th>Teacher Action</th></tr></thead>
        <tbody>${rows.join("") || `<tr><td colspan="6">No matching students.</td></tr>`}</tbody>
      </table>`;
    bindApprovalButtons();
  }

  function rowMarkup(student, cert, status) {
    const onlinePassed = !!status.onlinePassed;
    const handsOnComplete = !!status.handsOnComplete;
    const badgeEarned = !!status.badgeEarned;
    const onlineLabel = onlinePassed ? `Passed${status.bestPercent ? " • " + status.bestPercent + "%" : ""}` : "Not passed yet";
    const handsOnLabel = handsOnComplete
      ? `Complete${status.handsOnAt ? " • " + new Date(status.handsOnAt).toLocaleDateString() : ""}`
      : "Not complete";
    const actionDisabled = cert.hasOnline && !onlinePassed ? "disabled" : "";
    const nextState = handsOnComplete ? "false" : "true";
    const actionText = handsOnComplete ? "Remove Hands-on" : "Mark Complete";

    return `
      <tr>
        <td><strong>${escapeHtml(student.fullName || "Student")}</strong><br><span class="muted">${escapeHtml(student.email || "")}</span><br><span class="muted">${escapeHtml(student.studentId || "")} ${student.period ? "• " + escapeHtml(student.period) : ""}</span></td>
        <td><strong>${escapeHtml(cert.label)}</strong></td>
        <td><span class="approval-pill ${onlinePassed ? "passed" : "locked"}">${escapeHtml(onlineLabel)}</span></td>
        <td><span class="approval-pill ${handsOnComplete ? "passed" : "locked"}">${escapeHtml(handsOnLabel)}</span></td>
        <td><span class="approval-pill ${badgeEarned ? "earned" : "locked"}">${badgeEarned ? "Earned" : "Locked"}</span></td>
        <td>
          <button class="btn small ${handsOnComplete ? "secondary" : "dark"}" type="button" data-mark-handson data-user-id="${escapeHtml(student.userId)}" data-cert-id="${escapeHtml(cert.certId)}" data-completed="${nextState}" ${actionDisabled}>${escapeHtml(actionText)}</button>
          ${actionDisabled ? `<p class="teacher-note">Online test must be passed first.</p>` : ""}
        </td>
      </tr>`;
  }

  function bindApprovalButtons() {
    document.querySelectorAll("[data-mark-handson]").forEach((button) => {
      button.addEventListener("click", async () => {
        const auth = authApi();
        const session = auth.getTeacherSession();
        const status = document.querySelector("[data-teacher-dashboard-status]");
        const completed = button.dataset.completed === "true";
        button.disabled = true;
        const oldText = button.textContent;
        button.textContent = "Saving...";

        try {
          await auth.request("setHandsOnCompletion", {
            token: session.token,
            studentUserId: button.dataset.userId,
            certId: button.dataset.certId,
            completed,
            notes: ""
          });
          status.className = "teacher-dashboard-status";
          status.textContent = "Hands-on status saved. Refreshing dashboard...";
          await loadDashboard();
        } catch (err) {
          status.className = "teacher-dashboard-status error";
          status.textContent = err.message;
          button.disabled = false;
          button.textContent = oldText;
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupTeacherLogin();
    if (document.querySelector("[data-teacher-dashboard]")) {
      initializeTeacherDashboard().catch((err) => {
        document.documentElement.classList.remove("cert-auth-checking");
        const status = document.querySelector("[data-teacher-dashboard-status]");
        if (status) {
          status.className = "teacher-dashboard-status error";
          status.textContent = err.message;
        }
      });
      document.querySelector("[data-refresh-teacher-dashboard]")?.addEventListener("click", loadDashboard);
      document.querySelector("[data-teacher-filter]")?.addEventListener("input", renderDashboard);
      document.querySelector("[data-teacher-cert-filter]")?.addEventListener("change", renderDashboard);
    }
  });
})();

(function () {
  "use strict";

  const CERTS = [
    { certId: "engineering-safety", label: "Engineering Safety", short: "Safety", category: "safety", image: "engineering-safety.png", requiresHandsOn: false },
    { certId: "technical-sketching", label: "Technical Sketching", short: "Sketching", category: "academic", image: "technical-sketching.png", requiresHandsOn: false },
    { certId: "engineering-documentation", label: "Engineering Documentation", short: "Documentation", category: "academic", image: "engineering-documentation.png", requiresHandsOn: false },
    { certId: "fusion-cad-level-1", label: "Fusion CAD Level 1", short: "CAD Level 1", category: "academic", image: "fusion-cad-level-1.png", requiresHandsOn: false },
    { certId: "engineering-drawings", label: "Engineering Drawings", short: "Drawings", category: "academic", image: "engineering-drawings.png", requiresHandsOn: false },
    { certId: "fusion-cad-level-2", label: "Fusion CAD Level 2", short: "CAD Level 2", category: "academic", image: "fusion-cad-level-2.png", requiresHandsOn: false },
    { certId: "design-review", label: "Design Review", short: "Design Review", category: "professional", image: "design-review.png", requiresHandsOn: false },
    { certId: "3d-printing", label: "3D Printing", short: "3D Printing", category: "equipment", image: "3d-printing.png", requiresHandsOn: true },
    { certId: "laser-cutting", label: "Laser Cutting", short: "Laser Cutting", category: "equipment", image: "laser-cutting.png", requiresHandsOn: true },
    { certId: "cnc", label: "CNC", short: "CNC", category: "equipment", image: "cnc.png", requiresHandsOn: true },
    { certId: "drill-press", label: "Drill Press", short: "Drill Press", category: "equipment", image: "drill-press.png", requiresHandsOn: true },
    { certId: "soldering", label: "Soldering", short: "Soldering", category: "equipment", image: "soldering.png", requiresHandsOn: true },
    { certId: "hand-cutting-tools", label: "Hand & Cutting Tools", short: "Hand Tools", category: "equipment", image: "hand-cutting-tools.png", requiresHandsOn: true }
  ];

  let dashboardData = null;
  let activeStudentId = "";

  function authApi() {
    return window.LockwoodCertAuth || null;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[ch];
    });
  }

  function currentUser() {
    const auth = authApi();
    if (!auth) return null;
    return (auth.getTeacherProfile && auth.getTeacherProfile()) || (auth.getProfile && auth.getProfile()) || null;
  }

  function isTeacher(user) {
    return ["teacher", "teacher_admin"].includes(String(user && user.role || "").toLowerCase());
  }

  function isTeacherAdmin(user) {
    return String(user && user.role || "").toLowerCase() === "teacher_admin";
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
  }

  function getStudentById(userId) {
    return (dashboardData && dashboardData.students || []).find((student) => String(student.userId) === String(userId));
  }

  function normalizedStatus(student, cert) {
    const raw = student && student.statuses && student.statuses[cert.certId] || {};
    const attempts = Number(raw.attempts || 0);
    const bestPercent = Number(raw.bestPercent || 0);
    const onlinePassed = !!raw.onlinePassed || bestPercent >= 80;
    const handsOnComplete = !!raw.handsOnComplete;
    const badgeEarned = !!raw.badgeEarned || (onlinePassed && (!cert.requiresHandsOn || handsOnComplete));
    let state = "not-started";
    let label = "Not Started";
    if (badgeEarned) {
      state = "earned";
      label = "Earned";
    } else if (cert.requiresHandsOn && onlinePassed) {
      state = "pending";
      label = "Pending Hands-on";
    } else if (attempts > 0) {
      state = "retake";
      label = "Retake Needed";
    }
    return Object.assign({}, raw, { attempts, bestPercent, onlinePassed, handsOnComplete, badgeEarned, state, label });
  }

  function studentSummary(student) {
    const statuses = CERTS.map((cert) => normalizedStatus(student, cert));
    return {
      earned: statuses.filter((status) => status.badgeEarned).length,
      onlinePassed: statuses.filter((status) => status.onlinePassed).length,
      pending: CERTS.filter((cert, index) => cert.requiresHandsOn && statuses[index].onlinePassed && !statuses[index].handsOnComplete).length,
      equipment: CERTS.filter((cert, index) => cert.requiresHandsOn && statuses[index].badgeEarned).length
    };
  }

  function requireTeacher() {
    const user = currentUser();
    if (isTeacher(user) && user.mustChangePassword) {
      window.location.href = "change-password.html?next=" + encodeURIComponent("teacher-dashboard.html");
      return false;
    }
    if (isTeacher(user)) return true;
    window.location.href = "teacher-login.html?role=required";
    return false;
  }

  async function setupTeacherLogin() {
    const form = document.querySelector("[data-teacher-login-form]");
    if (!form) return;

    const status = document.querySelector("[data-teacher-login-status]");
    const params = new URLSearchParams(window.location.search);
    if (params.get("role") === "required") {
      setStatus(status, "Teacher or Teacher Admin access is required for that page.", true);
    }
    if (params.get("role") === "refresh") {
      setStatus(status, "Sign in again with your teacher account. Teacher tools now use a separate secure session.", true);
    }
    if (params.get("created") === "1") {
      setStatus(status, "Teacher account created. Sign in to continue.", false);
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const auth = authApi();
      if (!auth) return setStatus(status, "Account scripts did not load.", true);
      const data = Object.fromEntries(new FormData(form).entries());
      setStatus(status, "Checking teacher account...", false);

      try {
        const result = await auth.request("login", {
          identifier: data.identifier,
          password: data.password
        });

        if (!result.user || !isTeacher(result.user)) {
          setStatus(status, "This account is not marked as a teacher or Teacher Admin account.", true);
          return;
        }

        auth.saveTeacherSession(result);
        // Also make the teacher profile current on the Certification Hub. A later
        // student login can replace this normal session without affecting the
        // isolated teacher dashboard session.
        auth.saveSession(result);
        const next = params.get("next") || "teacher-dashboard.html";
        if (result.user.mustChangePassword) {
          window.location.href = "change-password.html?teacher=1&next=" + encodeURIComponent(next);
          return;
        }
        window.location.href = next;
      } catch (err) {
        setStatus(status, err.message, true);
      }
    });
  }

  async function setupTeacherRegistration() {
    const form = document.querySelector("[data-teacher-register-form]");
    if (!form) return;

    const auth = authApi();
    const status = document.querySelector("[data-teacher-register-status]");
    const setupCodeRow = document.querySelector("[data-teacher-setup-code-row]");
    const modeText = document.querySelector("[data-teacher-register-mode]");
    let signedInTeacherAdmin = false;

    if (auth && auth.getTeacherSession && auth.getTeacherSession()) {
      const result = await auth.validateTeacherSession();
      signedInTeacherAdmin = !!(result.ok && isTeacherAdmin(result.user) && !result.user.mustChangePassword);
    }

    const setupCodeInput = form.querySelector('input[name="setupCode"]');
    if (signedInTeacherAdmin) {
      if (setupCodeRow) setupCodeRow.hidden = true;
      if (setupCodeInput) setupCodeInput.required = false;
      if (modeText) modeText.textContent = "You are signed in as a Teacher Admin. This form will create an additional teacher account.";
    } else {
      if (setupCodeInput) setupCodeInput.required = true;
      if (modeText) modeText.textContent = "For the first teacher account, enter the private setup code stored in Google Apps Script properties.";
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!auth) return setStatus(status, "Account scripts did not load.", true);
      const data = Object.fromEntries(new FormData(form).entries());
      if (data.password !== data.confirmPassword) {
        setStatus(status, "Passwords do not match.", true);
        return;
      }
      setStatus(status, "Creating teacher account...", false);

      try {
        const session = auth.getTeacherSession ? auth.getTeacherSession() : null;
        const result = await auth.request("registerTeacher", {
          token: signedInTeacherAdmin && session ? session.token : "",
          setupCode: data.setupCode || "",
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          teacherId: data.teacherId,
          password: data.password,
          role: data.role || "teacher"
        });

        if (result.token && result.user) {
          auth.saveTeacherSession(result);
          auth.saveSession(result);
          const next = result.user.mustChangePassword ? "change-password.html?teacher=1&next=teacher-dashboard.html" : "teacher-dashboard.html";
          window.location.href = next;
          return;
        }

        form.reset();
        setStatus(status, `${result.user && result.user.fullName || "Teacher account"} created successfully.`, false);
      } catch (err) {
        setStatus(status, err.message, true);
      }
    });
  }

  async function initializeTeacherDashboard() {
    if (!document.querySelector("[data-teacher-dashboard]")) return;
    const auth = authApi();
    if (!auth) return;

    const session = auth.getTeacherSession && auth.getTeacherSession();
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
    if (validation.user.mustChangePassword) {
      window.location.href = "change-password.html?teacher=1&next=" + encodeURIComponent("teacher-dashboard.html");
      return;
    }

    document.documentElement.classList.remove("cert-auth-checking");
    auth.renderAccountBar(validation.user, { sessionType: "teacher" });
    await loadDashboard();
  }

  async function loadDashboard() {
    if (!document.querySelector("[data-teacher-dashboard]")) return;
    const auth = authApi();
    const session = auth && auth.getTeacherSession ? auth.getTeacherSession() : null;
    const status = document.querySelector("[data-teacher-dashboard-status]");
    const target = document.querySelector("[data-teacher-dashboard]");
    if (!session || !session.token) {
      window.location.href = "teacher-login.html?role=refresh";
      return;
    }

    setStatus(status, "Loading students and certification results...", false);
    target.innerHTML = "";

    try {
      dashboardData = await auth.request("getTeacherDashboard", { token: session.token });
      renderDashboard();
      renderPendingApprovals();
      renderSummaryCards();
      if (activeStudentId) openStudentDialog(activeStudentId, false);
    } catch (err) {
      const message = /teacher access is required/i.test(err.message)
        ? "The server rejected the teacher session. Confirm the current Code.gs is deployed and sign in again through Teacher Login."
        : err.message;
      setStatus(status, message, true);
    }
  }

  function renderSummaryCards() {
    const students = dashboardData && dashboardData.students || [];
    const totals = students.reduce((summary, student) => {
      const item = studentSummary(student);
      summary.earned += item.earned;
      summary.onlinePassed += item.onlinePassed;
      summary.pending += item.pending;
      summary.equipment += item.equipment;
      return summary;
    }, { earned: 0, onlinePassed: 0, pending: 0, equipment: 0 });

    setText("[data-teacher-stat-students]", students.length);
    setText("[data-teacher-stat-badges]", totals.earned);
    setText("[data-teacher-stat-pending]", totals.pending);
    setText("[data-teacher-stat-equipment]", totals.equipment);
  }

  function filteredStudents() {
    const students = dashboardData && dashboardData.students || [];
    const query = String(document.querySelector("[data-teacher-filter]")?.value || "").toLowerCase().trim();
    const period = String(document.querySelector("[data-teacher-period-filter]")?.value || "all");
    const status = String(document.querySelector("[data-teacher-status-filter]")?.value || "all");

    return students.filter((student) => {
      const summary = studentSummary(student);
      const haystack = [student.fullName, student.email, student.studentId, student.period].join(" ").toLowerCase();
      if (query && !haystack.includes(query)) return false;
      if (period !== "all" && String(student.period || "") !== period) return false;
      if (status === "pending" && summary.pending === 0) return false;
      if (status === "earned" && summary.earned === 0) return false;
      if (status === "none" && summary.earned > 0) return false;
      return true;
    }).sort((a, b) => {
      const periodCompare = String(a.period || "").localeCompare(String(b.period || ""), undefined, { numeric: true });
      if (periodCompare) return periodCompare;
      return String(a.fullName || "").localeCompare(String(b.fullName || ""));
    });
  }

  function renderDashboard() {
    const status = document.querySelector("[data-teacher-dashboard-status]");
    const target = document.querySelector("[data-teacher-dashboard]");
    if (!dashboardData || !target) return;

    const students = filteredStudents();
    const rows = students.map((student) => {
      const summary = studentSummary(student);
      return `
        <tr>
          <td><strong>${escapeHtml(student.fullName || "Student")}</strong><span class="teacher-table-sub">${escapeHtml(student.email || "")}</span><span class="teacher-table-sub">ID ${escapeHtml(student.studentId || "—")}</span></td>
          <td>${escapeHtml(student.period || "—")}</td>
          <td><strong>${summary.earned} / ${CERTS.length}</strong><span class="teacher-table-sub">earned badges</span></td>
          <td><strong>${summary.onlinePassed}</strong><span class="teacher-table-sub">online tests passed</span></td>
          <td><span class="approval-pill ${summary.pending ? "pending" : "passed"}">${summary.pending ? `${summary.pending} pending` : "None pending"}</span></td>
          <td><strong>${summary.equipment} / 6</strong><span class="teacher-table-sub">equipment badges</span></td>
          <td><button class="btn small dark" type="button" data-view-student="${escapeHtml(student.userId)}">View Badges</button></td>
        </tr>`;
    }).join("");

    setStatus(status, `${students.length} of ${(dashboardData.students || []).length} student account(s) shown.`, false);
    target.innerHTML = `
      <table class="teacher-student-table">
        <thead><tr><th>Student</th><th>Period</th><th>Badges</th><th>Online</th><th>Approvals</th><th>Equipment</th><th></th></tr></thead>
        <tbody>${rows || '<tr><td colspan="7">No students match the selected filters.</td></tr>'}</tbody>
      </table>`;

    target.querySelectorAll("[data-view-student]").forEach((button) => {
      button.addEventListener("click", () => openStudentDialog(button.dataset.viewStudent));
    });
  }

  function pendingItems() {
    const items = [];
    (dashboardData && dashboardData.students || []).forEach((student) => {
      CERTS.filter((cert) => cert.requiresHandsOn).forEach((cert) => {
        const certStatus = normalizedStatus(student, cert);
        if (certStatus.onlinePassed && !certStatus.handsOnComplete) {
          items.push({ student, cert, status: certStatus });
        }
      });
    });
    return items;
  }

  function filteredPendingItems() {
    const certFilter = String(document.querySelector("[data-pending-cert-filter]")?.value || "all");
    const sortMode = String(document.querySelector("[data-pending-sort]")?.value || "certification");
    const items = pendingItems().filter((item) => certFilter === "all" || item.cert.certId === certFilter);

    return items.sort((a, b) => {
      if (sortMode === "certification") {
        const certCompare = String(a.cert.label || "").localeCompare(String(b.cert.label || ""));
        if (certCompare) return certCompare;
      } else if (sortMode === "period") {
        const periodCompare = String(a.student.period || "").localeCompare(String(b.student.period || ""), undefined, { numeric: true });
        if (periodCompare) return periodCompare;
      }
      const nameCompare = String(a.student.fullName || "").localeCompare(String(b.student.fullName || ""));
      if (nameCompare) return nameCompare;
      return String(a.cert.label || "").localeCompare(String(b.cert.label || ""));
    });
  }

  function pendingCardMarkup(item) {
    const { student, cert, status } = item;
    return `
      <article class="teacher-pending-card">
        <img src="../assets/img/certification-badges/${escapeHtml(cert.image)}" alt="">
        <div><span>Period ${escapeHtml(student.period || "—")}</span><strong>${escapeHtml(student.fullName || "Student")}</strong><p>${escapeHtml(cert.label)} • ${status.bestPercent}%</p></div>
        <button class="btn small" type="button" data-pending-approve data-user-id="${escapeHtml(student.userId)}" data-cert-id="${escapeHtml(cert.certId)}">Approve</button>
      </article>`;
  }

  function renderPendingApprovals() {
    const target = document.querySelector("[data-pending-approvals]");
    const countBox = document.querySelector("[data-pending-count]");
    if (!target) return;
    const items = filteredPendingItems();
    const total = pendingItems().length;
    const sortMode = String(document.querySelector("[data-pending-sort]")?.value || "certification");

    if (countBox) {
      countBox.textContent = items.length === total
        ? `${total} pending approval${total === 1 ? "" : "s"}`
        : `${items.length} shown • ${total} total pending`;
    }

    if (!items.length) {
      target.innerHTML = '<div class="teacher-empty-state"><strong>No hands-on approvals match this certification.</strong><p>Change the certification filter or refresh the dashboard.</p></div>';
    } else if (sortMode === "certification") {
      const groups = [];
      let lastCertId = "";
      items.forEach((item) => {
        if (item.cert.certId !== lastCertId) {
          const count = items.filter((candidate) => candidate.cert.certId === item.cert.certId).length;
          groups.push(`<div class="teacher-pending-group-heading">${escapeHtml(item.cert.label)}<small>${count} approval${count === 1 ? "" : "s"} waiting</small></div>`);
          lastCertId = item.cert.certId;
        }
        groups.push(pendingCardMarkup(item));
      });
      target.innerHTML = groups.join("");
    } else {
      target.innerHTML = items.map(pendingCardMarkup).join("");
    }

    target.querySelectorAll("[data-pending-approve]").forEach((button) => {
      button.addEventListener("click", () => saveHandsOn(button, true));
    });
  }

  function openStudentDialog(userId, showModal = true) {
    const student = getStudentById(userId);
    const dialog = document.querySelector("[data-student-cert-dialog]");
    if (!student || !dialog) return;
    activeStudentId = student.userId;
    const summary = studentSummary(student);

    dialog.querySelector("[data-dialog-student-name]").textContent = student.fullName || "Student";
    dialog.querySelector("[data-dialog-student-meta]").textContent = [student.email, student.studentId ? `ID ${student.studentId}` : "", student.period ? `Period ${student.period}` : ""].filter(Boolean).join(" • ");
    dialog.querySelector("[data-dialog-student-summary]").textContent = `${summary.earned} of ${CERTS.length} badges earned • ${summary.equipment} of 6 equipment certifications unlocked`;
    dialog.querySelector("[data-dialog-badge-grid]").innerHTML = CERTS.map((cert) => badgeMarkup(student, cert)).join("");

    dialog.querySelectorAll("[data-mark-handson]").forEach((button) => {
      button.addEventListener("click", () => saveHandsOn(button, button.dataset.completed === "true"));
    });

    if (showModal && typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
  }

  function badgeMarkup(student, cert) {
    const status = normalizedStatus(student, cert);
    const completedDate = status.certifiedAt || (status.badgeEarned ? status.handsOnAt || status.lastAttemptAt : "");
    const onlineText = status.attempts ? `${status.bestPercent}% • ${status.attempts} attempt${status.attempts === 1 ? "" : "s"}` : "No attempts";
    const action = cert.requiresHandsOn ? `
      <div class="teacher-badge-action">
        <button class="btn small ${status.handsOnComplete ? "secondary" : "dark"}" type="button" data-mark-handson data-user-id="${escapeHtml(student.userId)}" data-cert-id="${escapeHtml(cert.certId)}" data-completed="${status.handsOnComplete ? "false" : "true"}" ${!status.onlinePassed && !status.handsOnComplete ? "disabled" : ""}>${status.handsOnComplete ? "Remove Approval" : "Approve Hands-on"}</button>
        ${!status.onlinePassed && !status.handsOnComplete ? '<span>Online test must be passed first.</span>' : ""}
      </div>` : "";

    return `
      <article class="teacher-badge-card ${status.state}">
        <div class="teacher-badge-image"><img src="../assets/img/certification-badges/${escapeHtml(cert.image)}" alt="${escapeHtml(cert.label)} badge"></div>
        <div class="teacher-badge-copy">
          <span class="cert-state-chip ${escapeHtml(status.state)}">${escapeHtml(status.label)}</span>
          <h3>${escapeHtml(cert.label)}</h3>
          <dl>
            <div><dt>Online</dt><dd>${escapeHtml(onlineText)}</dd></div>
            <div><dt>Hands-on</dt><dd>${cert.requiresHandsOn ? (status.handsOnComplete ? "Approved" : "Required") : "Not required"}</dd></div>
            <div><dt>Completed</dt><dd>${escapeHtml(formatDate(completedDate))}</dd></div>
          </dl>
          ${action}
        </div>
      </article>`;
  }

  async function saveHandsOn(button, completed) {
    const auth = authApi();
    const session = auth && auth.getTeacherSession ? auth.getTeacherSession() : null;
    const statusBox = document.querySelector("[data-teacher-dashboard-status]");
    if (!session || !session.token) return;
    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = "Saving...";

    try {
      const result = await auth.request("setHandsOnCompletion", {
        token: session.token,
        studentUserId: button.dataset.userId,
        certId: button.dataset.certId,
        completed,
        notes: ""
      });
      const student = getStudentById(button.dataset.userId);
      if (student && result.status) student.statuses[button.dataset.certId] = result.status;
      renderDashboard();
      renderPendingApprovals();
      renderSummaryCards();
      if (activeStudentId === button.dataset.userId) openStudentDialog(activeStudentId, false);
      setStatus(statusBox, completed ? "Hands-on certification approved." : "Hands-on approval removed.", false);
    } catch (err) {
      button.disabled = false;
      button.textContent = oldText;
      setStatus(statusBox, err.message, true);
    }
  }

  function setupDialog() {
    const dialog = document.querySelector("[data-student-cert-dialog]");
    if (!dialog) return;
    dialog.querySelectorAll("[data-close-student-dialog]").forEach((button) => {
      button.addEventListener("click", () => dialog.close());
    });
    dialog.addEventListener("close", () => { activeStudentId = ""; });
  }

  function setupDashboardControls() {
    document.querySelector("[data-refresh-teacher-dashboard]")?.addEventListener("click", loadDashboard);
    document.querySelector("[data-teacher-filter]")?.addEventListener("input", renderDashboard);
    document.querySelector("[data-teacher-period-filter]")?.addEventListener("change", renderDashboard);
    document.querySelector("[data-teacher-status-filter]")?.addEventListener("change", renderDashboard);
    document.querySelector("[data-pending-cert-filter]")?.addEventListener("change", renderPendingApprovals);
    document.querySelector("[data-pending-sort]")?.addEventListener("change", renderPendingApprovals);
  }

  function setStatus(element, message, isError) {
    if (!element) return;
    element.hidden = false;
    element.textContent = message;
    element.classList.toggle("error", !!isError);
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupTeacherLogin();
    setupTeacherRegistration();
    setupDialog();
    setupDashboardControls();
    if (document.querySelector("[data-teacher-dashboard]")) {
      initializeTeacherDashboard().catch((err) => {
        document.documentElement.classList.remove("cert-auth-checking");
        setStatus(document.querySelector("[data-teacher-dashboard-status]"), err.message, true);
      });
    }
  });
})();

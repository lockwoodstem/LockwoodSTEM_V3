/* LockwoodSTEM agenda build 20260801-2 — upcoming due dates integration */
const config = window.LOCKWOOD_AGENDA_CONFIG || {};
const csvUrls = config.csvUrls || {};
const quotesCsvUrl = config.quotesCsvUrl || "";
const dueDatesCsvUrl = config.dueDatesCsvUrl || "https://docs.google.com/spreadsheets/d/13bF4m4GAGQMU1DJKQc_AQcor2i6OLFgPR5bdo0VNT9U/gviz/tq?tqx=out:csv&gid=1747059949";
const courseLabels = config.courseLabels || { IED: "IED", POE: "POE", ADM: "ADM" };
const legacyCourseAliases = config.legacyCourseAliases || { IED: ["IED"], POE: [], ADM: ["AM"] };

let rows = [];
let quoteRows = [];
let dueDateRows = [];
let currentCourse = config.defaultCourse || "IED";
let currentDate = "";
let viewMode = "day";

const els = {
  app: document.getElementById("agendaApp"),
  courseSelect: document.getElementById("courseSelect"),
  datePicker: document.getElementById("datePicker"),
  prevBtn: document.getElementById("prevBtn"),
  todayBtn: document.getElementById("todayBtn"),
  nextBtn: document.getElementById("nextBtn"),
  dayViewBtn: document.getElementById("dayViewBtn"),
  weekViewBtn: document.getElementById("weekViewBtn"),
  dateBadge: document.getElementById("dateBadge"),
  courseBadge: document.getElementById("courseBadge"),
  lessonBadge: document.getElementById("lessonBadge")
};

function courseName(course) {
  return courseLabels[course] || course;
}

function setTheme(course) {
  document.body.classList.remove("theme-ied", "theme-poe", "theme-adm", "theme-aed", "theme-ase", "theme-am");
  if (course === "POE") document.body.classList.add("theme-poe");
  else if (course === "ADM") document.body.classList.add("theme-adm");
  else document.body.classList.add("theme-ied");
}

function getCsvUrl(course) {
  if (csvUrls[course]) return csvUrls[course];
  const aliases = legacyCourseAliases[course] || [];
  for (const alias of aliases) {
    if (csvUrls[alias]) return csvUrls[alias];
  }
  return "";
}

function parseCSV(text) {
  const result = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (field || row.length) {
        row.push(field);
        result.push(row);
        row = [];
        field = "";
      }
      if (char === "\r" && next === "\n") i++;
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
  }
  if (row.length) result.push(row);

  return result;
}

function normalizeHeader(header) {
  return String(header || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function getField(row, names) {
  for (const name of names) {
    const key = normalizeHeader(name);
    if (Object.prototype.hasOwnProperty.call(row, key) && clean(row[key])) return row[key];
  }
  return "";
}

function normalizeDate(value) {
  if (!value) return "";
  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);

  const d = new Date(raw);
  if (!isNaN(d)) {
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  const parts = raw.split(/[\/\-]/);
  if (parts.length === 3) {
    let [m, day, y] = parts;
    if (y.length === 2) y = "20" + y;
    return `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return raw;
}

function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function addDaysISO(iso, days) {
  const d = new Date(iso + "T12:00:00");
  if (isNaN(d)) return iso;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function startOfSchoolWeekISO(iso) {
  const d = new Date(iso + "T12:00:00");
  if (isNaN(d)) return iso;
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function schoolWeekDates(iso) {
  const monday = startOfSchoolWeekISO(iso);
  return [0, 1, 2, 3, 4].map(offset => addDaysISO(monday, offset));
}

function displayDate(iso) {
  const d = new Date(iso + "T12:00:00");
  if (isNaN(d)) return iso || "No date selected";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function shortDisplayDate(iso) {
  const d = new Date(iso + "T12:00:00");
  if (isNaN(d)) return iso || "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function dayName(iso) {
  const d = new Date(iso + "T12:00:00");
  if (isNaN(d)) return iso || "Day";
  return d.toLocaleDateString(undefined, { weekday: "long" });
}

function clean(value) {
  return String(value || "").trim();
}

function escapeHTML(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function linkify(text) {
  const value = clean(text);
  if (!value) return "";
  const escaped = escapeHTML(value);
  return escaped.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
}



/* Built-in Today’s Lesson links: rendered directly by agenda.js so they remain
   visible in normal and full-screen agenda views. */
let agendaLessonIndexPromise = null;

function firstAgendaURL(value) {
  const match = clean(value).match(/https?:\/\/[^\s;,<]+/i);
  return match ? match[0] : "";
}

function normalizeLessonMatchTitle(value) {
  return clean(value)
    .toLowerCase()
    .replace(/^lesson\s*\d+\s*[.\-]\s*\d+\s*[:\-–—]?\s*/i, "")
    .replace(/^\d+\s*[.\-]\s*\d+\s*[:\-–—]?\s*/i, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function agendaLessonNumbers(unitText, lessonText) {
  const combined = `${clean(unitText)} ${clean(lessonText)}`;
  const explicit = combined.match(/\b(?:lesson\s*)?(\d+)\s*[.\-]\s*(\d+)\b/i);
  if (explicit) return { unit: Number(explicit[1]), lesson: Number(explicit[2]) };
  const unitMatch = clean(unitText).match(/\b(\d+)\b/) || clean(lessonText).match(/\bunit\s*(\d+)\b/i);
  return { unit: unitMatch ? Number(unitMatch[1]) : null, lesson: null };
}

function agendaTokenScore(a, b) {
  const aa = new Set(normalizeLessonMatchTitle(a).split(" ").filter(token => token.length > 2));
  const bb = new Set(normalizeLessonMatchTitle(b).split(" ").filter(token => token.length > 2));
  if (!aa.size || !bb.size) return 0;
  let shared = 0;
  aa.forEach(token => { if (bb.has(token)) shared++; });
  return shared / Math.max(aa.size, bb.size);
}

function loadAgendaLessonIndex() {
  if (!agendaLessonIndexPromise) {
    agendaLessonIndexPromise = fetch("assets/data/lesson-index.json", { cache: "no-store" })
      .then(response => {
        if (!response.ok) throw new Error("Lesson index could not load");
        return response.json();
      })
      .then(data => data.lessons || []);
  }
  return agendaLessonIndexPromise;
}

function resolveAgendaLesson(index, course, unitText, lessonText) {
  const numbers = agendaLessonNumbers(unitText, lessonText);
  let candidates = index.filter(item => item.course === course);
  if (numbers.unit !== null) candidates = candidates.filter(item => item.unit === numbers.unit);
  if (numbers.lesson !== null) {
    const exactNumber = candidates.find(item => item.lesson === numbers.lesson);
    if (exactNumber) return exactNumber;
  }
  const target = normalizeLessonMatchTitle(lessonText);
  if (!target) return null;
  const exactTitle = candidates.find(item => normalizeLessonMatchTitle(item.title) === target);
  if (exactTitle) return exactTitle;
  const containing = candidates.find(item => {
    const title = normalizeLessonMatchTitle(item.title);
    return title && (title.includes(target) || target.includes(title));
  });
  if (containing) return containing;
  const ranked = candidates
    .map(item => ({ item, score: agendaTokenScore(item.title, lessonText) }))
    .sort((a, b) => b.score - a.score);
  return ranked[0] && ranked[0].score >= 0.45 ? ranked[0].item : null;
}

function agendaFallbackURL(course, unitText, lessonText) {
  const courseSlug = course.toLowerCase();
  const numbers = agendaLessonNumbers(unitText, lessonText);
  if (numbers.unit !== null && numbers.lesson !== null && course !== "ADM") {
    return `courses/${courseSlug}/units/unit-${numbers.unit}/lesson-${numbers.unit}-${numbers.lesson}.html`;
  }
  if (numbers.unit !== null) return `courses/${courseSlug}/units/unit-${numbers.unit}.html`;
  return `courses/${courseSlug}/index.html`;
}

function renderAgendaLessonResourceBar(course, unitText, lessonText, linksText) {
  const fallback = agendaFallbackURL(course, unitText, lessonText);
  const classLink = firstAgendaURL(linksText);
  return `
    <section class="agenda-inline-lesson-bar" id="agendaLessonResourceBar" aria-label="Lesson resources"
         data-agenda-build="20260719-1"
         data-course="${escapeHTML(course)}"
         data-unit="${escapeHTML(unitText)}"
         data-lesson="${escapeHTML(lessonText)}"
         data-class-link="${escapeHTML(classLink)}">
      <div class="agenda-inline-lesson-copy">
        <span class="agenda-inline-lesson-label">Lesson Resources</span>
        <span class="agenda-inline-lesson-help">Open today’s lesson page, presentation, or class link.</span>
      </div>
      <div class="agenda-inline-lesson-buttons">
        <a class="agenda-inline-primary" data-agenda-lesson-link href="${escapeHTML(fallback)}">Open Lesson &amp; Resources</a>
        ${classLink ? `<a class="agenda-inline-secondary" href="${escapeHTML(classLink)}" target="_blank" rel="noopener">Class Link</a>` : ""}
      </div>
    </section>`;
}

async function enhanceAgendaLessonResourceBar(course, unitText, lessonText) {
  const bar = document.getElementById("agendaLessonResourceBar");
  if (!bar) return;
  bar.dataset.matchStatus = "fallback";
  try {
    const index = await loadAgendaLessonIndex();
    const lesson = resolveAgendaLesson(index, course, unitText, lessonText);
    if (!lesson) return;
    const primary = bar.querySelector("[data-agenda-lesson-link]");
    if (primary) primary.href = new URL(lesson.url, document.baseURI).href;
    bar.dataset.matchStatus = "matched";
    if (lesson.presentation && !bar.querySelector("[data-agenda-presentation-link]")) {
      const presentation = document.createElement("a");
      presentation.className = "agenda-inline-secondary";
      presentation.dataset.agendaPresentationLink = "true";
      const lessonPageURL = new URL(lesson.url, document.baseURI);
      presentation.href = new URL(lesson.presentation, lessonPageURL).href;
      presentation.textContent = "Presentation";
      presentation.setAttribute("download", "");
      bar.querySelector(".agenda-inline-lesson-buttons")?.appendChild(presentation);
    }
  } catch (error) {
    console.warn("Lesson resource matching unavailable; the unit or course link remains active.", error);
  }
}


function listify(text) {
  const value = clean(text);
  if (!value) return `<span class="empty">Nothing listed.</span>`;

  const parts = value
    .split(/\n|•|;|\u2022/)
    .map(x => x.trim())
    .filter(Boolean);

  if (parts.length <= 1) return `<div class="content-text">${linkify(value)}</div>`;

  return `<ul class="agenda-list">${parts.map(x => `<li>${linkify(x)}</li>`).join("")}</ul>`;
}

function safeText(value, fallback = "Nothing listed.") {
  return clean(value) ? linkify(value) : `<span class="empty">${fallback}</span>`;
}

function parseDueDateRows(text) {
  const parsed = parseCSV(text).filter(r => r.some(cell => clean(cell)));
  if (!parsed.length) return [];
  const headers = parsed[0].map(h => normalizeHeader(h));
  return parsed.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i] || "");
    obj._dueDate = normalizeDate(getField(obj, ["Due Date", "Date", "Day"]));
    obj._course = clean(getField(obj, ["Course"])).toUpperCase();
    return obj;
  }).filter(r => r._dueDate && r._course);
}

function upcomingDueDates(course, startDate) {
  const endDate = addDaysISO(startDate, 13);
  return dueDateRows
    .filter(row => {
      const status = clean(getField(row, ["Status"])).toLowerCase();
      const visible = !["draft", "hidden", "cancelled", "canceled"].includes(status);
      return visible && row._course === course && row._dueDate >= startDate && row._dueDate <= endDate;
    })
    .sort((a, b) => a._dueDate.localeCompare(b._dueDate) || clean(getField(a, ["Assignment", "Title"])).localeCompare(clean(getField(b, ["Assignment", "Title"]))));
}

function dueDateLabel(iso, referenceDate) {
  if (iso === referenceDate) return "Due Today";
  if (iso === addDaysISO(referenceDate, 1)) return "Due Tomorrow";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function renderDueDateItem(item, referenceDate) {
  const title = getField(item, ["Assignment", "Title"]) || "Assignment";
  const type = getField(item, ["Assignment Type", "Type"]);
  const points = getField(item, ["Points"]);
  const link = getField(item, ["Link", "URL"]);
  const notes = getField(item, ["Notes"]);
  const dueClass = item._dueDate === referenceDate ? "due-today" : (item._dueDate === addDaysISO(referenceDate, 1) ? "due-tomorrow" : "due-later");
  const titleHTML = link ? `<a class="due-date-title" href="${escapeHTML(link)}" target="_blank" rel="noopener">${escapeHTML(title)}</a>` : `<span class="due-date-title">${escapeHTML(title)}</span>`;
  const meta = [type, points ? `${points} points` : ""].filter(Boolean).map(escapeHTML).join(" • ");
  return `<article class="due-date-item ${dueClass}"><div class="due-date-topline"><span class="due-date-badge">${escapeHTML(dueDateLabel(item._dueDate, referenceDate))}</span>${meta ? `<span class="due-date-meta">${meta}</span>` : ""}</div>${titleHTML}${notes ? `<div class="due-date-note">${escapeHTML(notes)}</div>` : ""}</article>`;
}

function renderUpcomingDueDates(course, referenceDate) {
  const items = upcomingDueDates(course, referenceDate);
  if (!items.length) return `<p class="empty due-date-empty">No assignments are due within the next 14 days.</p>`;
  const first = items.slice(0, 5).map(item => renderDueDateItem(item, referenceDate)).join("");
  const remaining = items.slice(5);
  const more = remaining.length ? `<details class="due-date-more"><summary>View ${remaining.length} more upcoming assignment${remaining.length === 1 ? "" : "s"}</summary>${remaining.map(item => renderDueDateItem(item, referenceDate)).join("")}</details>` : "";
  return `<div class="due-date-list">${first}${more}</div>`;
}

function parseRows(text) {
  const parsed = parseCSV(text).filter(r => r.some(cell => clean(cell)));
  if (!parsed.length) return [];
  const headers = parsed[0].map(h => normalizeHeader(h));

  return parsed.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i] || "");
    obj._date = normalizeDate(getField(obj, ["Date", "Day"]));
    return obj;
  }).filter(r => r._date).sort((a, b) => a._date.localeCompare(b._date));
}

function agendaByDate() {
  return new Map(rows.map(r => [r._date, r]));
}

function findAgenda() {
  return rows.find(r => r._date === currentDate) || null;
}

function findQuote() {
  if (!quoteRows.length) return "";
  const exact = quoteRows.find(r => r._date === currentDate);
  if (exact) return getField(exact, ["Quote"]);
  const before = quoteRows.filter(r => r._date <= currentDate);
  if (before.length) return getField(before[before.length - 1], ["Quote"]);
  return getField(quoteRows[quoteRows.length - 1], ["Quote"]);
}

function lessonSummary(row) {
  const unit = getField(row, ["Unit"]);
  const lesson = getField(row, ["Lesson Title", "Lesson"]);
  if (unit && lesson) return `${unit} • ${lesson}`;
  return lesson || unit || "Lesson";
}

function updateBadges(agenda) {
  els.dateBadge.textContent = viewMode === "week" ? `Week of ${shortDisplayDate(schoolWeekDates(currentDate)[0])}–${shortDisplayDate(schoolWeekDates(currentDate)[4])}` : displayDate(currentDate);
  els.courseBadge.textContent = courseName(currentCourse);
  els.lessonBadge.textContent = agenda ? lessonSummary(agenda) : "No agenda found";
}

function renderAgendaCard(title, content, extraClass = "") {
  return `<section class="agenda-display-card ${extraClass}"><h3>${escapeHTML(title)}</h3><div>${content}</div></section>`;
}

function renderDayView() {
  const agenda = findAgenda();
  const quote = findQuote();
  updateBadges(agenda);

  if (!agenda) {
    els.app.className = "agenda-empty-state fade";
    els.app.innerHTML = `
      <h2>No agenda found</h2>
      <p>There is no agenda listed for <strong>${escapeHTML(courseName(currentCourse))}</strong> on ${escapeHTML(displayDate(currentDate))}.</p>
      <p class="muted-dark">Add a row for this date in the published Google Sheet, then refresh the page.</p>
    `;
    return;
  }

  const agendaText = getField(agenda, ["Agenda"]);
  const objectives = getField(agenda, ["Objectives", "Objective"]);
  const standards = getField(agenda, ["Standards", "Standard"]);
  const announcements = getField(agenda, ["Important Announcements", "Announcements"]);
  const homework = getField(agenda, ["Homework"]);
  const notes = getField(agenda, ["Notes"]);
  const links = getField(agenda, ["Links", "Resources"]);
  const unit = getField(agenda, ["Unit"]);
  const lesson = getField(agenda, ["Lesson Title", "Lesson"]);

  els.app.className = "agenda-display-grid fade";
  els.app.innerHTML = `
    <article class="agenda-main-card">
      <div class="agenda-card-topline">
        <span>${escapeHTML(courseName(currentCourse))}</span>
        <span>${escapeHTML(displayDate(currentDate))}</span>
      </div>
      <h2>${escapeHTML(lesson || "Class Agenda")}</h2>
      ${unit ? `<div class="agenda-unit-pill">${escapeHTML(unit)}</div>` : ""}
      ${renderAgendaLessonResourceBar(currentCourse, unit, lesson, links)}
      <div class="agenda-primary-block">
        <h3>Today in Class</h3>
        ${listify(agendaText)}
      </div>
      <div class="agenda-main-footer">
        <div><strong>Homework</strong>${listify(homework)}</div>
        <div><strong>Announcements</strong>${listify(announcements)}</div>
      </div>
    </article>

    <aside class="agenda-side-stack">
      ${renderAgendaCard("Objectives", listify(objectives), "objectives")}
      ${renderAgendaCard("Upcoming Due Dates", renderUpcomingDueDates(currentCourse, currentDate), "due-dates")}
      ${renderAgendaCard("Standards", listify(standards), "standards")}
      ${renderAgendaCard("Notes", listify(notes), "notes")}
      ${quote ? renderAgendaCard("Quote of the Day", `<div class="quote-text">${escapeHTML(quote)}</div>`, "quote") : ""}
    </aside>
  `;
  enhanceAgendaLessonResourceBar(currentCourse, unit, lesson).catch(console.warn);
}

function renderWeekView() {
  const dates = schoolWeekDates(currentDate);
  const rowsByDate = agendaByDate();
  updateBadges(rowsByDate.get(currentDate));

  els.app.className = "agenda-week-display fade";
  const weekCards = dates.map(date => {
    const agenda = rowsByDate.get(date);
    return `
      <article class="agenda-week-card ${date === todayISO() ? "today" : ""}">
        <div class="agenda-week-header">
          <h3>${escapeHTML(dayName(date))}</h3>
          <span>${escapeHTML(shortDisplayDate(date))}</span>
        </div>
        <div class="agenda-week-body">
          <strong>${agenda ? escapeHTML(lessonSummary(agenda)) : "No agenda listed"}</strong>
          <div class="week-label">Agenda</div>
          ${agenda ? listify(getField(agenda, ["Agenda"])) : `<span class="empty">Nothing listed.</span>`}
          <div class="week-label">Homework</div>
          ${agenda ? listify(getField(agenda, ["Homework"])) : `<span class="empty">Nothing listed.</span>`}
        </div>
      </article>
    `;
  }).join("");
  els.app.innerHTML = `${weekCards}<section class="agenda-week-due-dates"><h2>Upcoming Due Dates</h2>${renderUpcomingDueDates(currentCourse, currentDate)}</section>`;
}

function render() {
  if (viewMode === "week") renderWeekView();
  else renderDayView();
}

function setViewMode(mode) {
  viewMode = mode === "week" ? "week" : "day";
  els.dayViewBtn.classList.toggle("active", viewMode === "day");
  els.weekViewBtn.classList.toggle("active", viewMode === "week");
  els.dayViewBtn.setAttribute("aria-pressed", viewMode === "day" ? "true" : "false");
  els.weekViewBtn.setAttribute("aria-pressed", viewMode === "week" ? "true" : "false");
  render();
}

function shiftDate(direction) {
  if (viewMode === "week") currentDate = addDaysISO(currentDate, direction * 7);
  else currentDate = addDaysISO(currentDate, direction);
  els.datePicker.value = currentDate;
  render();
}

async function loadDueDates() {
  try {
    if (!dueDatesCsvUrl) return;
    const res = await fetch(dueDatesCsvUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`Due dates could not load (${res.status})`);
    dueDateRows = parseDueDateRows(await res.text());
  } catch (err) {
    console.warn("Due dates could not load", err);
    dueDateRows = [];
  }
}

async function loadQuotes() {
  try {
    if (!quotesCsvUrl) return;
    const res = await fetch(quotesCsvUrl, { cache: "no-store" });
    const text = await res.text();
    quoteRows = parseRows(text);
  } catch (err) {
    console.warn("Quotes could not load", err);
    quoteRows = [];
  }
}

async function loadAgendaForCourse(course) {
  try {
    setTheme(course);
    currentCourse = course;
    els.app.className = "agenda-loading";
    els.app.textContent = `Loading ${courseName(course)} agenda...`;

    const url = getCsvUrl(course);
    if (!url) throw new Error(`Missing CSV URL for ${course}`);

    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    rows = parseRows(text);

    if (!currentDate) currentDate = todayISO();
    els.datePicker.value = currentDate;
    render();
  } catch (err) {
    console.error(err);
    els.app.className = "agenda-empty-state fade";
    els.app.innerHTML = `
      <h2>Agenda could not load</h2>
      <p>Check that the Google Sheet tab is published to the web as a CSV and that the URL is correct in <code>assets/js/agenda-config.js</code>.</p>
    `;
  }
}

function initCourseOptions() {
  if (!els.courseSelect) return;
  Array.from(els.courseSelect.options).forEach(option => {
    if (courseLabels[option.value]) option.textContent = courseLabels[option.value];
  });
  els.courseSelect.value = currentCourse;
}

els.courseSelect.addEventListener("change", () => loadAgendaForCourse(els.courseSelect.value));
els.datePicker.addEventListener("change", () => { currentDate = els.datePicker.value; render(); });
els.dayViewBtn.addEventListener("click", () => setViewMode("day"));
els.weekViewBtn.addEventListener("click", () => setViewMode("week"));
els.prevBtn.addEventListener("click", () => shiftDate(-1));
els.nextBtn.addEventListener("click", () => shiftDate(1));
els.todayBtn.addEventListener("click", () => { currentDate = todayISO(); els.datePicker.value = currentDate; render(); });

(async function init() {
  initCourseOptions();
  currentDate = todayISO();
  els.datePicker.value = currentDate;
  await Promise.all([loadQuotes(), loadDueDates()]);
  await loadAgendaForCourse(currentCourse);
})();


// Agenda semantic field class helper
document.addEventListener("DOMContentLoaded", () => {
  const assignClass = (selectors, className) => {
    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => el.classList.add(className));
    });
  };

  assignClass(
    ["#agenda-date", "[data-agenda-field='date']", ".agenda-date-value", ".current-date"],
    "agenda-date"
  );
  assignClass(
    ["#agenda-course", "[data-agenda-field='course']", ".agenda-course-value", ".current-course"],
    "agenda-course"
  );
  assignClass(
    ["#agenda-lesson-title", "[data-agenda-field='lesson']", "[data-agenda-field='lesson-title']", ".agenda-lesson-value", ".current-lesson"],
    "agenda-lesson-title"
  );
});

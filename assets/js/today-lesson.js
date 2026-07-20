(function () {
  "use strict";

  const INDEX_URL = "assets/data/lesson-index.json";
  const COURSE_HUBS = {
    IED: "courses/ied/index.html",
    POE: "courses/poe/index.html",
    ADM: "courses/adm/index.html"
  };
  const UNIT_HUB = (course, unit) => `courses/${course.toLowerCase()}/units/unit-${unit}.html`;
  let lessonIndexPromise = null;

  function clean(value) { return String(value || "").trim(); }
  function normalizeHeader(value) { return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, ""); }
  function normalizeTitle(value) {
    return clean(value)
      .toLowerCase()
      .replace(/^lesson\s*\d+\s*[.\-]\s*\d+\s*[:\-–—]?\s*/i, "")
      .replace(/^\d+\s*[.\-]\s*\d+\s*[:\-–—]?\s*/i, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  function escapeHTML(value) {
    return clean(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }
  function parseCSV(text) {
    const result = [];
    let row = [], field = "", inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i], next = text[i + 1];
      if (char === '"' && inQuotes && next === '"') { field += '"'; i++; }
      else if (char === '"') inQuotes = !inQuotes;
      else if (char === "," && !inQuotes) { row.push(field); field = ""; }
      else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (field || row.length) { row.push(field); result.push(row); row = []; field = ""; }
        if (char === "\r" && next === "\n") i++;
      } else field += char;
    }
    if (field || row.length) row.push(field);
    if (row.length) result.push(row);
    return result;
  }
  function normalizeDate(value) {
    const raw = clean(value);
    if (!raw) return "";
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
    const parts = raw.split(/[\/\-]/);
    if (parts.length === 3 && parts[0].length <= 2) {
      let [m, d, y] = parts;
      if (y.length === 2) y = "20" + y;
      return `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return raw;
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }
  function todayISO() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }
  function displayDate(iso) {
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }
  function parseRows(text) {
    const parsed = parseCSV(text).filter(row => row.some(clean));
    if (!parsed.length) return [];
    const headers = parsed[0].map(normalizeHeader);
    return parsed.slice(1).map(row => {
      const item = {};
      headers.forEach((h, i) => item[h] = row[i] || "");
      item._date = normalizeDate(item.date || item.day);
      return item;
    }).filter(item => item._date).sort((a, b) => a._date.localeCompare(b._date));
  }
  function field(row, names) {
    for (const name of names) {
      const key = normalizeHeader(name);
      if (clean(row && row[key])) return row[key];
    }
    return "";
  }
  function firstURL(value) {
    const match = clean(value).match(/https?:\/\/[^\s;,<]+/i);
    return match ? match[0] : "";
  }
  function extractNumbers(unitText, lessonText) {
    const combined = `${unitText} ${lessonText}`;
    const explicit = combined.match(/\b(?:lesson\s*)?(\d+)\s*[.\-]\s*(\d+)\b/i);
    if (explicit) return { unit: Number(explicit[1]), lesson: Number(explicit[2]) };
    const unitMatch = clean(unitText).match(/\b(\d+)\b/);
    return { unit: unitMatch ? Number(unitMatch[1]) : null, lesson: null };
  }
  function tokenScore(a, b) {
    const aa = new Set(normalizeTitle(a).split(" ").filter(token => token.length > 2));
    const bb = new Set(normalizeTitle(b).split(" ").filter(token => token.length > 2));
    if (!aa.size || !bb.size) return 0;
    let shared = 0;
    aa.forEach(token => { if (bb.has(token)) shared++; });
    return shared / Math.max(aa.size, bb.size);
  }
  const todayLessonScript = document.querySelector('script[src*="today-lesson.js"]');
  const siteRoot = todayLessonScript
    ? new URL("../../", todayLessonScript.src)
    : new URL("./", document.baseURI);

  function rootURL(path) {
    const value = clean(path);
    if (!value) return siteRoot.href;
    if (/^(?:https?:|mailto:|tel:|#)/i.test(value)) return value;
    return new URL(value.replace(/^\/+/, ""), siteRoot).href;
  }
  function loadLessonIndex() {
    if (!lessonIndexPromise) {
      lessonIndexPromise = fetch(rootURL(INDEX_URL), { cache: "no-store" })
        .then(response => {
          if (!response.ok) throw new Error("Lesson index could not load");
          return response.json();
        })
        .then(data => data.lessons || []);
    }
    return lessonIndexPromise;
  }
  function resolveLesson(index, course, unitText, lessonText) {
    const normalizedCourse = clean(course).toUpperCase();
    const numbers = extractNumbers(unitText, lessonText);
    let candidates = index.filter(item => item.course === normalizedCourse);
    if (numbers.unit !== null) candidates = candidates.filter(item => item.unit === numbers.unit);
    if (numbers.lesson !== null) {
      const exact = candidates.find(item => item.lesson === numbers.lesson);
      if (exact) return exact;
    }
    const target = normalizeTitle(lessonText);
    if (!target) return null;
    const exactTitle = candidates.find(item => normalizeTitle(item.title) === target);
    if (exactTitle) return exactTitle;
    const containing = candidates.find(item => normalizeTitle(item.title).includes(target) || target.includes(normalizeTitle(item.title)));
    if (containing) return containing;
    const ranked = candidates.map(item => ({ item, score: tokenScore(item.title, lessonText) }))
      .sort((a, b) => b.score - a.score);
    return ranked[0] && ranked[0].score >= 0.45 ? ranked[0].item : null;
  }
  function actionLinks(course, row, lesson, agendaURL) {
    const unitText = field(row, ["Unit"]);
    const numbers = extractNumbers(unitText, field(row, ["Lesson Title", "Lesson"]));
    const fallback = numbers.unit !== null ? UNIT_HUB(course, numbers.unit) : COURSE_HUBS[course];
    const lessonURL = lesson ? lesson.url : fallback;
    const presentation = lesson && lesson.presentation;
    const classLink = firstURL(field(row, ["Links", "Resources"]));
    const links = [
      `<a href="${escapeHTML(rootURL(lessonURL))}">Open Lesson &amp; Resources</a>`
    ];
    if (presentation) links.push(`<a class="secondary" href="${escapeHTML(rootURL(presentation))}" download>Presentation</a>`);
    if (classLink) links.push(`<a class="secondary" href="${escapeHTML(classLink)}" target="_blank" rel="noopener">Class Link</a>`);
    if (agendaURL) links.push(`<a class="secondary" href="${escapeHTML(agendaURL)}">Full Agenda</a>`);
    return links.join("");
  }
  async function loadCourseAgenda(course) {
    const config = window.LOCKWOOD_AGENDA_CONFIG || {};
    const url = config.csvUrls && config.csvUrls[course];
    if (!url) return [];
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`${course} agenda failed`);
    return parseRows(await response.text());
  }
  function homepageCard(course, row, lesson, isNext) {
    const lessonTitle = field(row, ["Lesson Title", "Lesson"]) || "Course work";
    const unitText = field(row, ["Unit"]);
    const agendaURL = `agenda.html?course=${encodeURIComponent(course)}&date=${encodeURIComponent(row._date)}`;
    const number = lesson ? `Lesson ${lesson.number}` : clean(unitText) || "Course";
    return `
      <article class="today-lesson-card course-${course.toLowerCase()}">
        <div class="today-lesson-topline">
          <span class="today-course-pill">${escapeHTML(course)}</span>
          <span class="today-status-pill">${isNext ? "Next Scheduled" : "Today"}</span>
        </div>
        <p class="today-lesson-number">${escapeHTML(number)}</p>
        <h3>${escapeHTML(lesson ? lesson.title : lessonTitle)}</h3>
        <p class="today-lesson-date">${escapeHTML(displayDate(row._date))}</p>
        <div class="today-lesson-actions">${actionLinks(course, row, lesson, agendaURL)}</div>
      </article>`;
  }
  function noAgendaCard(course) {
    return `
      <article class="today-lesson-card course-${course.toLowerCase()}">
        <div class="today-lesson-topline"><span class="today-course-pill">${escapeHTML(course)}</span><span class="today-status-pill">No agenda</span></div>
        <h3>No scheduled lesson found</h3>
        <p class="today-lesson-note">Open the course hub or full agenda to find the next activity.</p>
        <div class="today-lesson-actions">
          <a href="${escapeHTML(rootURL(COURSE_HUBS[course]))}">Open Course Hub</a>
          <a class="secondary" href="${escapeHTML(rootURL(`agenda.html?course=${course}`))}">Full Agenda</a>
        </div>
      </article>`;
  }
  async function initHomepage() {
    const app = document.getElementById("todayLessonsApp");
    if (!app) return;
    try {
      const index = await loadLessonIndex();
      const today = todayISO();
      const courses = ["IED", "POE", "ADM"];
      const cards = await Promise.all(courses.map(async course => {
        try {
          const rows = await loadCourseAgenda(course);
          const exact = rows.find(row => row._date === today);
          const next = exact || rows.find(row => row._date > today);
          if (!next) return noAgendaCard(course);
          const lesson = resolveLesson(index, course, field(next, ["Unit"]), field(next, ["Lesson Title", "Lesson"]));
          return homepageCard(course, next, lesson, !exact);
        } catch (error) {
          console.warn(error);
          return noAgendaCard(course);
        }
      }));
      app.innerHTML = cards.join("");
    } catch (error) {
      console.warn(error);
      app.innerHTML = ["IED", "POE", "ADM"].map(noAgendaCard).join("");
    }
  }
  async function enhanceAgenda() {
    const app = document.getElementById("agendaApp");
    const panel = document.getElementById("todayLessonAgendaActions");
    if (!app || !panel) return;

    let updateTimer = null;
    async function updatePanel() {
      window.clearTimeout(updateTimer);
      updateTimer = window.setTimeout(async () => {
        const main = app.querySelector(".agenda-main-card");
        if (!main) {
          panel.hidden = true;
          panel.innerHTML = "";
          return;
        }

        const course = clean(document.getElementById("courseSelect")?.value || "IED").toUpperCase();
        const unitText = clean(main.querySelector(".agenda-unit-pill")?.textContent);
        const lessonText = clean(main.querySelector("h2")?.textContent);
        if (!lessonText) {
          panel.hidden = true;
          return;
        }

        let lesson = null;
        try {
          const index = await loadLessonIndex();
          lesson = resolveLesson(index, course, unitText, lessonText);
        } catch (error) {
          console.warn("Today’s Lesson index unavailable; using the course or unit fallback.", error);
        }

        const classLink = app.querySelector(".agenda-link-box a")?.href || "";
        const pseudoRow = { unit: unitText, lessontitle: lessonText, links: classLink };
        panel.innerHTML = `
          <div class="agenda-today-action-heading">
            <span>Today’s Lesson</span>
            <strong>${escapeHTML(lessonText)}</strong>
          </div>
          <div class="today-lesson-actions">${actionLinks(course, pseudoRow, lesson, "")}</div>`;
        panel.hidden = false;
      }, 40);
    }

    const observer = new MutationObserver(() => { updatePanel().catch(console.warn); });
    observer.observe(app, { childList: true, subtree: true });

    ["courseSelect", "datePicker", "dayViewBtn", "weekViewBtn", "prevBtn", "todayBtn", "nextBtn"]
      .map(id => document.getElementById(id))
      .filter(Boolean)
      .forEach(control => control.addEventListener("change", () => updatePanel().catch(console.warn)));

    const courseSelect = document.getElementById("courseSelect");
    if (courseSelect) {
      courseSelect.addEventListener("change", () => {
        localStorage.setItem("lockwood-last-course", courseSelect.value);
        updatePanel().catch(console.warn);
      });
    }

    updatePanel().catch(console.warn);
  }
  function applyAgendaQuery() {
    const courseSelect = document.getElementById("courseSelect");
    const datePicker = document.getElementById("datePicker");
    if (!courseSelect || !datePicker) return;
    const params = new URLSearchParams(window.location.search);
    const course = params.get("course") || localStorage.getItem("lockwood-last-course");
    const date = params.get("date");
    window.addEventListener("load", () => {
      if (course && courseSelect.querySelector(`option[value="${CSS.escape(course)}"]`)) {
        courseSelect.value = course;
        courseSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
      if (date) {
        datePicker.value = date;
        datePicker.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }, { once: true });
  }
  document.addEventListener("DOMContentLoaded", () => {
    initHomepage();
    applyAgendaQuery();
    enhanceAgenda();
  });
})();

(() => {
  "use strict";

  const q = (root, selector) => root.querySelector(selector);
  const qa = (root, selector) => Array.from(root.querySelectorAll(selector));

  function feedback(root, message, state = "info") {
    const box = q(root, "[data-u1-feedback]");
    if (!box) return;
    box.dataset.state = state;
    box.innerHTML = message;
  }

  function selectedValues(root, name) {
    return qa(root, `input[name="${name}"]:checked`).map((el) => el.value);
  }

  function sameSet(a, b) {
    return a.length === b.length && a.every((value) => b.includes(value));
  }

  function selectChoiceButtons(root) {
    qa(root, "[data-u1-choice]").forEach((button) => {
      button.addEventListener("click", () => {
        const group = button.dataset.u1Group || "default";
        qa(root, `[data-u1-choice][data-u1-group="${group}"]`).forEach((peer) => {
          peer.setAttribute("aria-pressed", "false");
          peer.classList.remove("selected");
        });
        button.setAttribute("aria-pressed", "true");
        button.classList.add("selected");
        root.dataset[`choice${group}`] = button.dataset.u1Choice;
      });
    });
  }

  function initSketchClarity(root) {
    const check = q(root, "[data-u1-check]");
    check?.addEventListener("click", () => {
      const chosen = selectedValues(root, "sketch-note");
      const correct = ["purpose", "feature", "direction"];
      if (sameSet(chosen, correct)) {
        feedback(root, "<strong>Clear communication.</strong> The sketch now identifies what the object does, a critical feature, and how it is used or loaded. Decorative color can be useful later, but it does not replace technical information.", "success");
      } else {
        feedback(root, "Choose the three notes that explain <strong>purpose, geometry, and use</strong>. Avoid information that is mostly decorative.", "error");
      }
    });
  }

  function initLineClassifier(root) {
    const check = q(root, "[data-u1-check]");
    check?.addEventListener("click", () => {
      const rows = qa(root, "[data-line-answer]");
      let correct = 0;
      rows.forEach((row) => {
        const select = q(row, "select");
        const isCorrect = select?.value === row.dataset.lineAnswer;
        row.dataset.state = isCorrect ? "correct" : "incorrect";
        if (isCorrect) correct += 1;
      });
      if (correct === rows.length) {
        feedback(root, `<strong>${correct}/${rows.length} correct.</strong> Solid object lines communicate visible edges; evenly dashed hidden lines communicate blocked features.`, "success");
      } else {
        feedback(root, `<strong>${correct}/${rows.length} correct.</strong> Recheck whether the feature can be seen directly from the selected view.`, "error");
      }
    });
  }

  function initHiddenFeature(root) {
    const toggles = qa(root, "[data-hidden-line]");
    toggles.forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.hiddenLine;
        const line = q(root, `[data-line-id="${id}"]`);
        const pressed = button.getAttribute("aria-pressed") !== "true";
        button.setAttribute("aria-pressed", String(pressed));
        button.classList.toggle("selected", pressed);
        if (line) line.style.opacity = pressed ? "1" : ".15";
      });
    });
    q(root, "[data-u1-check]")?.addEventListener("click", () => {
      const chosen = toggles.filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.dataset.hiddenLine);
      const correct = ["b", "c"];
      if (sameSet(chosen, correct)) {
        feedback(root, "<strong>Correct.</strong> The two interior dashed lines locate the sides of the blocked slot. The outside lines would duplicate visible object edges.", "success");
      } else {
        feedback(root, "Select only the dashed lines needed to show the two hidden sides of the internal slot.", "error");
      }
    });
  }

  function initCenterline(root) {
    const svg = q(root, "[data-center-target]");
    const marker = q(root, "[data-center-marker]");
    let point = null;
    svg?.addEventListener("click", (event) => {
      const rect = svg.getBoundingClientRect();
      const vb = svg.viewBox.baseVal;
      const x = vb.x + ((event.clientX - rect.left) / rect.width) * vb.width;
      const y = vb.y + ((event.clientY - rect.top) / rect.height) * vb.height;
      point = { x, y };
      if (marker) {
        marker.setAttribute("transform", `translate(${x} ${y})`);
        marker.style.display = "block";
      }
    });
    q(root, "[data-u1-check]")?.addEventListener("click", () => {
      const axis = q(root, "select[name='symmetry-axis']")?.value;
      if (!point) {
        feedback(root, "Click the drawing to place the center mark before checking.", "error");
        return;
      }
      const distance = Math.hypot(point.x - 190, point.y - 145);
      if (distance <= 12 && axis === "both") {
        feedback(root, "<strong>Accurate placement.</strong> The center mark is at the circular feature’s center, and the feature is symmetric about both horizontal and vertical axes.", "success");
      } else if (distance > 12) {
        feedback(root, "The center mark is not yet at the intersection of the circle’s horizontal and vertical diameters.", "error");
      } else {
        feedback(root, "The center is accurate. Reconsider how many axes of symmetry a full circle has in this view.", "error");
      }
    });
  }

  function initIsometricBox(root) {
    const width = q(root, "input[name='iso-width']");
    const depth = q(root, "input[name='iso-depth']");
    const height = q(root, "input[name='iso-height']");
    const polyTop = q(root, "[data-iso-top]");
    const polyLeft = q(root, "[data-iso-left]");
    const polyRight = q(root, "[data-iso-right]");
    const edgeGroup = q(root, "[data-iso-edges]");
    const values = qa(root, "[data-iso-value]");

    function update() {
      const w = Number(width.value);
      const d = Number(depth.value);
      const h = Number(height.value);
      const origin = { x: 210, y: 260 };
      const wx = w * 18;
      const dx = d * 18;
      const hz = h * 25;
      const p0 = origin;
      const p1 = { x: origin.x + wx * .866, y: origin.y - wx * .5 };
      const p2 = { x: p1.x - dx * .866, y: p1.y - dx * .5 };
      const p3 = { x: origin.x - dx * .866, y: origin.y - dx * .5 };
      const t0 = { x: p0.x, y: p0.y - hz };
      const t1 = { x: p1.x, y: p1.y - hz };
      const t2 = { x: p2.x, y: p2.y - hz };
      const t3 = { x: p3.x, y: p3.y - hz };
      const pts = (arr) => arr.map((p) => `${p.x},${p.y}`).join(" ");
      polyTop?.setAttribute("points", pts([t0, t1, t2, t3]));
      polyLeft?.setAttribute("points", pts([p0, p3, t3, t0]));
      polyRight?.setAttribute("points", pts([p0, p1, t1, t0]));
      if (edgeGroup) {
        const edges = [[p0,p1],[p1,p2],[p2,p3],[p3,p0],[t0,t1],[t1,t2],[t2,t3],[t3,t0],[p0,t0],[p1,t1],[p2,t2],[p3,t3]];
        edgeGroup.innerHTML = edges.map(([a,b]) => `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`).join("");
      }
      values.forEach((el) => {
        const key = el.dataset.isoValue;
        el.textContent = key === "width" ? w : key === "depth" ? d : h;
      });
    }
    [width, depth, height].forEach((input) => input?.addEventListener("input", update));
    update();
    q(root, "[data-u1-check]")?.addEventListener("click", () => {
      const answer = q(root, "select[name='iso-axis-question']")?.value;
      if (answer === "vertical") {
        feedback(root, "<strong>Correct.</strong> Height changes only along the vertical isometric axis; width and depth follow the two 30° axes.", "success");
      } else {
        feedback(root, "Change only the height slider and watch which axis the top face moves along.", "error");
      }
    });
  }

  function initEllipseShading(root) {
    const angle = q(root, "input[name='ellipse-angle']");
    const light = q(root, "select[name='light-direction']");
    const ellipse = q(root, "[data-ellipse]");
    const side = q(root, "[data-cylinder-side]");
    const top = q(root, "[data-cylinder-top]");
    const value = q(root, "[data-angle-value]");
    let selectedFace = null;
    selectChoiceButtons(root);
    qa(root, "[data-u1-choice]").forEach((button) => button.addEventListener("click", () => { selectedFace = button.dataset.u1Choice; }));
    function update() {
      const a = Number(angle.value);
      const ry = Math.max(10, 52 - a * .45);
      ellipse?.setAttribute("ry", ry);
      top?.setAttribute("ry", ry);
      if (value) value.textContent = `${a}°`;
      const dir = light.value;
      if (side) side.setAttribute("fill", dir === "left" ? "#758b99" : "#c5d1d8");
      if (top) top.setAttribute("fill", "#eef3f6");
    }
    angle?.addEventListener("input", update);
    light?.addEventListener("change", update);
    update();
    q(root, "[data-u1-check]")?.addEventListener("click", () => {
      const expected = light.value === "left" ? "right" : "left";
      if (selectedFace === expected) {
        feedback(root, "<strong>Correct shading logic.</strong> The face turned away from the light should carry the darkest value, while the upward face remains lightest.", "success");
      } else {
        feedback(root, "Select the side that faces away from the chosen light direction.", "error");
      }
    });
  }

  function initProjectionMatch(root) {
    selectChoiceButtons(root);
    q(root, "[data-u1-check]")?.addEventListener("click", () => {
      const choice = root.dataset.choiceprojection;
      const correct = root.dataset.correct || "b";
      const success = root.dataset.successMessage || "<strong>Correct projection.</strong> View B preserves the upper step and the lower rectangular footprint seen from the front.";
      const error = root.dataset.errorMessage || "Trace the highest step and the full lower width along the front viewing direction.";
      if (choice === correct) {
        feedback(root, success, "success");
      } else {
        feedback(root, error, "error");
      }
    });
  }

  function initMissingView(root) {
    selectChoiceButtons(root);
    q(root, "[data-u1-check]")?.addEventListener("click", () => {
      const choice = root.dataset.choicemissing;
      const correct = root.dataset.correct || "c";
      const success = root.dataset.successMessage || "<strong>Correct missing view.</strong> The right view must show the full height from the front view and the stepped depth from the top view.";
      const error = root.dataset.errorMessage || "Transfer height from the front view and depth from the top view before selecting the right-side profile.";
      if (choice === correct) {
        feedback(root, success, "success");
      } else {
        feedback(root, error, "error");
      }
    });
  }

  function initDimensionAudit(root) {
    q(root, "[data-u1-check]")?.addEventListener("click", () => {
      const chosen = selectedValues(root, "dimension-issue");
      const correct = ["missing-hole-location", "duplicate-width", "inside-clutter"];
      if (sameSet(chosen, correct)) {
        feedback(root, "<strong>Audit complete.</strong> The drawing needs a hole-location dimension, contains a duplicated overall width, and places a dimension where it competes with object geometry.", "success");
      } else {
        feedback(root, "Look for information needed to manufacture the part, information stated more than once, and dimensions that reduce readability.", "error");
      }
    });
  }

  function initBracketConsistency(root) {
    selectChoiceButtons(root);
    q(root, "[data-u1-check]")?.addEventListener("click", () => {
      const view = root.dataset.choicebracket;
      const reason = q(root, "select[name='bracket-reason']")?.value;
      if (view === "right" && reason === "hole-count") {
        feedback(root, "<strong>Mismatch found.</strong> The right-side view omits one mounting hole that appears in the isometric and top views.", "success");
      } else {
        feedback(root, "Compare feature count and location across all views. Every projection must describe the same bracket.", "error");
      }
    });
  }

  function makeSortable(root, correctOrder) {
    const list = q(root, "[data-sort-list]");
    if (!list) return;
    function wire() {
      qa(list, "[data-move-up]").forEach((button) => {
        button.onclick = () => {
          const item = button.closest("li");
          if (item?.previousElementSibling) list.insertBefore(item, item.previousElementSibling);
        };
      });
      qa(list, "[data-move-down]").forEach((button) => {
        button.onclick = () => {
          const item = button.closest("li");
          if (item?.nextElementSibling) list.insertBefore(item.nextElementSibling, item);
        };
      });
    }
    wire();
    q(root, "[data-u1-check]")?.addEventListener("click", () => {
      const current = qa(list, "li").map((li) => li.dataset.step);
      if (current.join("|") === correctOrder.join("|")) {
        feedback(root, "<strong>Sequence verified.</strong> The order protects evidence, keeps parts oriented, and creates a usable record for reassembly.", "success");
      } else {
        feedback(root, "The sequence still creates a documentation or safety problem. Capture the assembled condition before removing parts, and verify the final record at the end.", "error");
      }
    });
  }

  function initDocumentationTest(root) {
    selectChoiceButtons(root);
    q(root, "[data-u1-check]")?.addEventListener("click", () => {
      const choice = root.dataset.choiceinstruction;
      const issue = q(root, "select[name='ambiguity-type']")?.value;
      if (choice === "b" && issue === "orientation") {
        feedback(root, "<strong>Document B stands alone.</strong> It identifies the part, direction, reference face, and verification condition. Document A leaves orientation open to interpretation.", "success");
      } else {
        feedback(root, "Choose the instruction that a new user could execute without asking which side, direction, or stopping condition was intended.", "error");
      }
    });
  }

  function initToolSelector(root) {
    q(root, "[data-u1-check]")?.addEventListener("click", () => {
      const answers = {
        "overall-length": "ruler",
        "shaft-diameter": "caliper",
        "fin-angle": "protractor",
        "room-distance": "tape"
      };
      let score = 0;
      Object.entries(answers).forEach(([name, expected]) => {
        const select = q(root, `select[name='${name}']`);
        if (select?.value === expected) score += 1;
      });
      if (score === 4) {
        feedback(root, "<strong>4/4 tools matched.</strong> Tool range, geometry, and required precision all support the selections.", "success");
      } else {
        feedback(root, `<strong>${score}/4 correct.</strong> Match the tool’s measuring surfaces and precision to the feature being measured.`, "error");
      }
    });
  }

  function initTolerance(root) {
    const nominal = q(root, "input[name='nominal']");
    const plusMinus = q(root, "input[name='plus-minus']");
    const measured = q(root, "input[name='measured']");
    const lower = q(root, "[data-limit='lower']");
    const upper = q(root, "[data-limit='upper']");
    const result = q(root, "[data-limit='result']");
    function update() {
      const n = Number(nominal.value);
      const t = Math.abs(Number(plusMinus.value));
      const m = Number(measured.value);
      const lo = n - t;
      const hi = n + t;
      lower.textContent = lo.toFixed(3);
      upper.textContent = hi.toFixed(3);
      result.textContent = m < lo ? "Undersized" : m > hi ? "Oversized" : "Pass";
    }
    [nominal, plusMinus, measured].forEach((el) => el?.addEventListener("input", update));
    update();
    q(root, "[data-u1-check]")?.addEventListener("click", () => {
      const n = Number(nominal.value);
      const t = Math.abs(Number(plusMinus.value));
      const m = Number(measured.value);
      const status = m < n - t ? "undersized" : m > n + t ? "oversized" : "pass";
      const answer = q(root, "select[name='tolerance-decision']")?.value;
      if (answer === status) {
        feedback(root, `<strong>Correct.</strong> The acceptable interval is ${(n-t).toFixed(3)} to ${(n+t).toFixed(3)}, so the sample is ${status}.`, "success");
      } else {
        feedback(root, "Use the lower and upper limits shown, then compare the measured value directly with that interval.", "error");
      }
    });
  }

  function initConnectionSelector(root) {
    const controls = qa(root, "input[name='joint-criterion']");
    const rec = q(root, "[data-connection-rec]");
    function recommend() {
      const selected = controls.filter((c) => c.checked).map((c) => c.value);
      let choice = "Structural epoxy";
      let reason = "Best when a permanent, gap-filling bond is more important than disassembly.";
      if (selected.includes("removable") || selected.includes("serviceable")) {
        choice = "Machine screw with locking nut";
        reason = "Supports disassembly and resists vibration when the locking feature is installed correctly.";
      } else if (selected.includes("lightweight") && selected.includes("low-load")) {
        choice = "Snap-fit or retained tab";
        reason = "Can reduce hardware mass for a low-load connection when the geometry is designed for repeated use.";
      }
      rec.innerHTML = `<strong>${choice}</strong><span>${reason}</span>`;
      rec.dataset.answer = choice;
    }
    controls.forEach((c) => c.addEventListener("change", recommend));
    recommend();
    q(root, "[data-u1-check]")?.addEventListener("click", () => {
      recommend();
      const selected = selectedValues(root, "joint-criterion");
      if (selected.length >= 2) {
        const method = q(rec, "strong")?.textContent || "Recommended connection";
        const reason = q(rec, "span")?.textContent || "";
        feedback(root, `<strong>Evidence-based recommendation: ${method}.</strong> ${reason} Your final written justification should connect each selected criterion to this choice.`, "success");
      } else {
        feedback(root, "Select at least two joint requirements before accepting a connection method.", "error");
      }
    });
  }

  function initSystemChain(root) {
    const component = q(root, "select[name='system-component']");
    const failure = q(root, "select[name='system-failure']");
    const chain = q(root, "[data-system-chain]");
    const maps = {
      "fin|loose": ["Fin loosens", "Alignment changes", "Aerodynamic stability decreases", "Flight path becomes less predictable"],
      "nose|misaligned": ["Nose cone is misaligned", "Outer profile becomes asymmetric", "Airflow becomes uneven", "Drag and directional error increase"],
      "coupler|cracked": ["Coupler cracks", "Body sections lose support", "Loads concentrate at the joint", "Assembly may separate or deform"],
      "motor|shifted": ["Motor mount shifts", "Thrust line moves off-axis", "Turning moment develops", "Rocket veers during launch"]
    };
    function update() {
      const key = `${component.value}|${failure.value}`;
      const nodes = maps[key] || ["Select a compatible component and failure", "Observe the local effect", "Trace the subsystem effect", "State the system-level consequence"];
      chain.innerHTML = nodes.map((text, i) => `${i ? '<span class="u1-chain-arrow" aria-hidden="true">→</span>' : ''}<span class="u1-chain-node">${text}</span>`).join("");
    }
    [component, failure].forEach((el) => el?.addEventListener("change", update));
    update();
    q(root, "[data-u1-check]")?.addEventListener("click", () => {
      const key = `${component.value}|${failure.value}`;
      if (maps[key]) {
        feedback(root, "<strong>Valid cause-and-effect chain.</strong> Your notebook system map should name the relationships between each step rather than listing components without connections.", "success");
      } else {
        feedback(root, "Choose a failure mode that matches the selected component so the chain represents a plausible physical relationship.", "error");
      }
    });
  }

  function initRecordCheck(root) {
    q(root, "[data-u1-check]")?.addEventListener("click", () => {
      const chosen = selectedValues(root, "record-error");
      const correct = ["row2", "row4"];
      if (sameSet(chosen, correct)) {
        feedback(root, "<strong>Record corrected.</strong> Row 2 uses a different name for the same item, and Row 4 conflicts with the observed quantity. Standard names and quantities prevent downstream drawing and BOM errors.", "success");
      } else {
        feedback(root, "Compare each row with the master item-number convention and the observed quantity. Flag only genuine inconsistencies.", "error");
      }
    });
  }

  function initBomCheck(root) {
    q(root, "[data-u1-check]")?.addEventListener("click", () => {
      const chosen = selectedValues(root, "bom-error");
      const correct = ["missing-4", "qty-2"];
      if (sameSet(chosen, correct)) {
        feedback(root, "<strong>BOM verified.</strong> Item 4 is missing, and Item 2 has the wrong quantity. Every balloon needs one matching row with an accurate count.", "success");
      } else {
        feedback(root, "Compare balloon numbers and physical counts with the BOM rows. Do not flag differences that are only wording preferences.", "error");
      }
    });
  }

  function initInstructionQuality(root) {
    makeSortable(root, ["inspect", "align", "insert", "secure", "verify"]);
    const originalCheck = q(root, "[data-u1-check]");
    if (!originalCheck) return;
    const handlers = originalCheck.onclick;
    originalCheck.addEventListener("click", () => {
      const checkpoint = q(root, "select[name='quality-checkpoint']")?.value;
      if (checkpoint !== "alignment") {
        feedback(root, "The step order may be correct, but the best checkpoint occurs after alignment and before the connection is fully secured.", "error");
      }
    });
  }

  function initEcrReview(root) {
    const fields = ["problem", "change", "evidence", "verification"];
    const meter = q(root, "[data-ecr-meter]");
    function score() {
      const filled = fields.filter((name) => (q(root, `[name='${name}']`)?.value.trim().length || 0) >= 12).length;
      if (meter) {
        meter.textContent = `${filled}/4 complete`;
        meter.dataset.score = String(filled);
      }
      return filled;
    }
    fields.forEach((name) => q(root, `[name='${name}']`)?.addEventListener("input", score));
    score();
    q(root, "[data-u1-check]")?.addEventListener("click", () => {
      const filled = score();
      const decision = q(root, "select[name='ecr-decision']")?.value;
      if (filled === 4 && decision === "revise") {
        feedback(root, "<strong>Complete review.</strong> The sample request contains all required categories, but an engineering reviewer should request revision until the change is tied to a measurable acceptance criterion.", "success");
      } else if (filled < 4) {
        feedback(root, "Complete each field with enough specific information for another person to implement and test the proposed change.", "error");
      } else {
        feedback(root, "The request is complete, but the evidence does not yet justify immediate approval. Select the review decision that protects verification quality.", "error");
      }
    });
  }

  function initEvidencePlanner(root) {
    q(root, "[data-u1-check]")?.addEventListener("click", () => {
      const answers = {
        "claim-fit": "measurement",
        "claim-assembly": "exploded",
        "claim-change": "ecr",
        "claim-complete": "bom"
      };
      let score = 0;
      Object.entries(answers).forEach(([name, expected]) => {
        if (q(root, `select[name='${name}']`)?.value === expected) score += 1;
      });
      const opening = q(root, "select[name='presentation-opening']")?.value;
      if (score === 4 && opening === "problem") {
        feedback(root, "<strong>Evidence plan ready.</strong> Each claim is paired with the document that most directly supports it, and the presentation opens with the problem before showing the proposed change.", "success");
      } else {
        feedback(root, `<strong>${score}/4 evidence matches correct.</strong> Pair claims with the document that contains direct proof, and begin the presentation by establishing the engineering problem.`, "error");
      }
    });
  }

  function initSimpleMulti(root) {
    const check = q(root, "[data-u1-check]");
    if (!check) return;
    check.addEventListener("click", () => {
      const name = root.dataset.multiName;
      const correct = (root.dataset.multiCorrect || "").split(",").filter(Boolean);
      const chosen = selectedValues(root, name);
      if (sameSet(chosen, correct)) {
        feedback(root, root.dataset.success || "<strong>Correct.</strong>", "success");
      } else {
        feedback(root, root.dataset.error || "Recheck the evidence and try again.", "error");
      }
    });
  }

  const initializers = {
    "sketch-clarity": initSketchClarity,
    "line-classifier": initLineClassifier,
    "hidden-feature": initHiddenFeature,
    "centerline": initCenterline,
    "isometric-box": initIsometricBox,
    "ellipse-shading": initEllipseShading,
    "projection-match": initProjectionMatch,
    "missing-view": initMissingView,
    "dimension-audit": initDimensionAudit,
    "bracket-consistency": initBracketConsistency,
    "disassembly-sequence": (root) => makeSortable(root, ["capture", "label", "remove-exterior", "remove-interior", "verify"]),
    "documentation-test": initDocumentationTest,
    "tool-selector": initToolSelector,
    "tolerance": initTolerance,
    "connection-selector": initConnectionSelector,
    "system-chain": initSystemChain,
    "record-check": initRecordCheck,
    "exploded-order": (root) => makeSortable(root, ["nose", "body", "coupler", "fin", "mount"]),
    "bom-check": initBomCheck,
    "instruction-quality": initInstructionQuality,
    "ecr-review": initEcrReview,
    "evidence-planner": initEvidencePlanner,
    "simple-multi": initSimpleMulti
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-u1-interactive]").forEach((root) => {
      const type = root.dataset.u1Interactive;
      const init = initializers[type];
      if (init) init(root);
    });
  });
})();

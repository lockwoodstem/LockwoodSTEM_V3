const IED_UNITS = {
  "0": {
    "title": "Engineering Design Foundations",
    "project": "Rocket Launch Pad Design Challenge",
    "cert": "Engineering Safety Readiness + Unit 0 Portfolio",
    "description": "Students build the habits, safety practices, documentation routines, and problem-solving mindset used throughout the engineering course.",
    "lessons": [
      "Course Launch & Engineering Mindset",
      "Engineering Notebook Setup & Course Resources",
      "Safety Acknowledgment, PPE & FabLab Orientation",
      "Engineering Design Process",
      "Engineering Notebook & Documentation Basics",
      "Problem Definition, Criteria & Constraints",
      "Rocket Launch Pad Design Challenge Launch",
      "Launch Pad Build Plan",
      "Launch Pad Prototype Build Day",
      "Launch Pad Testing and Improvement",
      "Launch Pad Final Documentation and Design Review",
      "Unit 0 Portfolio Check and Design Reflection"
    ]
  },
  "1": {
    "title": "Technical Sketching & Engineering Documentation",
    "project": "3D Rocket Assembly Reverse Engineering Documentation Package",
    "cert": "Technical Sketching + Engineering Documentation Portfolio",
    "description": "Students communicate engineering designs through sketching, measurement, tolerances, assembly documentation, BOMs, change records, and final proposal presentations.",
    "lessons": [
      "Why Engineers Sketch",
      "Line Conventions",
      "Object Lines & Hidden Lines",
      "Centerlines & Symmetry",
      "Isometric Sketching",
      "Isometric Circles, Arcs, and Shading",
      "Orthographic Projection",
      "Top, Front & Right Side Views",
      "Dimensioning Basics",
      "Aerospace Bracket Sketch",
      "Rocket Assembly Reverse Engineering",
      "Why Documentation Matters",
      "Measurement Tools",
      "Tolerances",
      "Adhesives & Fasteners",
      "Rocket Assembly Systems",
      "Documenting the Rocket Assembly",
      "Rocket Exploded View",
      "Rocket Bill of Materials",
      "Rocket Assembly Notes",
      "Engineering Change Requests",
      "Final Rocket Assembly Proposal Presentation"
    ]
  },
  "2": {
    "title": "CAD Modeling, Parametric Design & 3D Printing",
    "project": "3D Printed Rocket Assembly Tolerance Tester",
    "cert": "Fusion CAD Level 1 + 3D Printing Certification",
    "description": "Students create accurate CAD part models, prepare files for 3D printing, complete the 3D printer workflow, and print a tolerance tester that supports the next rocket assembly unit.",
    "lessons": [
      "From Engineering Documentation to CAD",
      "Fusion 360 Interface and File Setup",
      "Sketch Planes and 2D Sketching",
      "Sketch Constraints",
      "Dimensioned CAD Sketches",
      "Extrude Basics",
      "Cut Features and Holes",
      "Fillets, Chamfers, and Design Intent",
      "Revolve Features: Nose Cone and Nozzle",
      "Patterns and Symmetry: Rocket Fins",
      "Parametric Rocket Part Modeling",
      "CAD Model Check and Revision",
      "Preparing CAD Files for 3D Printing",
      "Slicer Basics and Print Settings",
      "FabLab 3D Printer Certification",
      "Final 3D Printed Tolerance Tester Workday",
      "3D Printing Post-Processing",
      "Final Tolerance Tester Review and Recommendation"
    ]
  },
  "3": {
    "title": "CAD Assemblies, Mechanisms & Technical Drawings",
    "project": "Final Rocket Assembly Prototype & Design Package",
    "cert": "Fusion CAD Level 2 + Engineering Drawings Portfolio",
    "description": "Students build a full rocket CAD assembly, check fits and motion, 3D print and build a prototype, test the assembly, and create technical drawings for final presentation.",
    "lessons": [
      "From Printed Testers to Rocket Assembly",
      "CAD Components and Assembly Files",
      "Inserting and Positioning Rocket Parts",
      "Assembly Alignment and Fit Checks",
      "Joints and Assembly Relationships",
      "Fin Placement and Symmetry",
      "Rocket Assembly Revision Workday",
      "Exploded CAD Views",
      "Assembly Motion and Functional Checks",
      "Export, Slice, and Submit Rocket Parts for 3D Printing",
      "Prototype Assembly Build Day",
      "Prototype Fit Testing and Revision Notes",
      "Introduction to Technical Drawing Sheets",
      "Part and Assembly Drawing Views",
      "Parts List, Balloons, Notes, and Revisions",
      "Final Rocket Assembly Design Package Workday",
      "Final Rocket Assembly Presentation"
    ]
  },
  "4": {
    "title": "Prototyping, Testing & Iteration",
    "project": "Aerospace Prototype Validation Challenge",
    "cert": "Fabrication Tool Certifications + Prototype Testing Portfolio",
    "description": "Students prepare, fabricate, test, analyze, and revise prototypes using manufacturing constraints, safety expectations, engineering data, and evidence-based iteration.",
    "lessons": [
      "Prototype Planning",
      "DFM for 3D Printing",
      "Slicing Basics",
      "Print Orientation",
      "Support Strategy",
      "Laser Cutting Safety",
      "Laser File Prep",
      "Material Selection",
      "Testable Requirements",
      "Test Plan Design",
      "Data Collection",
      "Failure Analysis",
      "Redesign Decisions",
      "Prototype Build Sprint",
      "Inspection",
      "Test Day",
      "Data Visualization",
      "Final Redesign",
      "Manufacturing Reflection",
      "Fabrication Certifications"
    ]
  },
  "5": {
    "title": "Aerospace Systems Design Capstone",
    "project": "Final Aerospace Design Challenge",
    "cert": "Portfolio Completion + Final Showcase",
    "description": "Students complete a full aerospace engineering project using research, requirements, concept development, CAD, fabrication planning, prototyping, testing, revision, documentation, and presentation.",
    "lessons": [
      "Capstone Launch",
      "Problem Definition",
      "Research & Benchmarking",
      "Requirements",
      "Concept Generation",
      "Decision Matrix",
      "Preliminary Sketches",
      "System Architecture",
      "CAD Sprint 1",
      "CAD Sprint 2",
      "Drawing Package",
      "BOM & Materials",
      "Manufacturing Planning",
      "Prototype Build 1",
      "Prototype Build 2",
      "Testing Plan",
      "Launch Testing",
      "Data Analysis",
      "Failure Review",
      "Redesign Sprint",
      "Final Build",
      "Final Documentation",
      "Presentation Prep",
      "Showcase",
      "Course Evidence Reflection"
    ]
  }
};

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderLesson() {
  const unit = getParam("unit") || "0";
  const lesson = parseInt(getParam("lesson") || "1", 10);
  const data = IED_UNITS[unit];
  if (!data || !data.lessons[lesson - 1]) {
    setText("lesson-title", "Lesson not found");
    setText("lesson-summary", "Return to the IED course hub and select a unit lesson.");
    return;
  }

  const lessonTitle = data.lessons[lesson - 1];
  setText("lesson-eyebrow", `IED Unit ${unit} • Lesson ${unit}.${lesson}`);
  setText("lesson-title", lessonTitle);
  setText("lesson-summary", `This lesson connects ${lessonTitle.toLowerCase()} to aerospace engineering practice through student-facing activities, documentation, and portfolio evidence.`);
  setText("lesson-deliverable", "Engineering notebook entry + student deliverable");
  setText("lesson-cert", `Certification connection: ${data.cert}`);
  setText("lesson-target", `I can apply ${lessonTitle.toLowerCase()} to communicate, model, build, document, or test an aerospace engineering solution.`);
  setText("lesson-notebook", `Create a dated engineering notebook entry for Lesson ${unit}.${lesson}. Include the problem, constraints, key vocabulary, sketches or evidence, and a reflection on how the skill supports aerospace engineering work.`);
  setText("lesson-exit", "Show the required notebook evidence and explain one engineering decision you made today.");

  const agenda = [
    "Launch question and aerospace connection",
    "Mini lesson or demonstration",
    "Guided practice using LockwoodSTEM resources",
    "Independent or team deliverable work",
    "Notebook evidence check"
  ];
  const agendaEl = document.getElementById("lesson-agenda");
  if (agendaEl) agendaEl.innerHTML = agenda.map(item => `<li>${item}</li>`).join("");

  const unitHref = `units/unit-${unit}.html`;
  const unitLink = document.getElementById("unit-link");
  const unitLink2 = document.getElementById("unit-link-2");
  if (unitLink) unitLink.href = unitHref;
  if (unitLink2) unitLink2.href = unitHref;
}

document.addEventListener("DOMContentLoaded", renderLesson);

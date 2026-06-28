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
    "description": "Students learn to communicate engineering designs through sketching, measurement, tolerances, assembly documentation, BOMs, change records, and final proposal presentations.",
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
    "title": "Aerospace CAD Modeling",
    "project": "Aerospace Sensor Mount Challenge",
    "cert": "Fusion CAD Level 1",
    "description": "Students use Fusion-style CAD workflows to build accurate part models using sketches, constraints, dimensions, features, patterns, and parameters.",
    "lessons": [
      "Fusion Workspace",
      "Sketch Constraints",
      "Dimensioned Sketches",
      "Extrude & Cut",
      "Fillets & Chamfers",
      "Holes & Patterns",
      "Construction Geometry",
      "Parameters",
      "Aerospace Bracket Model",
      "Sensor Mount Requirements",
      "CAD Design Sprint",
      "Drawing from Model",
      "Model Review",
      "Portfolio Export",
      "Fusion CAD Level 1 Certification"
    ]
  },
  "3": {
    "title": "Technical Drawings & Manufacturing Documentation",
    "project": "Aerospace Manufacturing Package",
    "cert": "Engineering Drawings Certification",
    "description": "Students create manufacturing-ready drawings with projected views, dimensions, notes, section/detail views, and inspection information.",
    "lessons": [
      "Drawing Workspace",
      "Base and Projected Views",
      "Section Views",
      "Detail Views",
      "Dimension Placement",
      "Hole Callouts",
      "Notes & Title Blocks",
      "Inspection Dimensions",
      "Manufacturing Constraints",
      "Drawing Standards",
      "Peer Drawing Check",
      "Revision Control",
      "Manufacturing Package Planning",
      "Final Drawing Package",
      "Presentation of Drawings",
      "Engineering Drawings Certification"
    ]
  },
  "4": {
    "title": "Assemblies & Mechanisms",
    "project": "Aerospace Deployment Mechanism",
    "cert": "Fusion CAD Level 2",
    "description": "Students build assemblies and mechanisms using components, joints, motion limits, interference checks, exploded views, and animations.",
    "lessons": [
      "Components & Bodies",
      "Joints",
      "Rigid Groups",
      "Motion Limits",
      "Linkages",
      "Gears & Pivots",
      "Deployment Mechanisms",
      "Assembly Constraints",
      "Interference Checks",
      "Exploded Assemblies",
      "Animation",
      "Mechanism Testing",
      "Design Revision",
      "Assembly Documentation",
      "Team Design Review",
      "CAD Portfolio Export",
      "Mechanism Presentation",
      "Fusion CAD Level 2 Certification"
    ]
  },
  "5": {
    "title": "Prototyping & Testing",
    "project": "Aerospace Prototype Validation Challenge",
    "cert": "3D Printing + Laser Cutter Certifications",
    "description": "Students prepare, fabricate, test, analyze, and revise prototypes using manufacturing constraints and engineering data.",
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
  "6": {
    "title": "Aerospace Systems Design Capstone",
    "project": "Aerospace Launch System Capstone",
    "cert": "Portfolio Completion",
    "description": "Students complete a full engineering project using research, requirements, concept development, CAD, manufacturing documentation, prototyping, testing, revision, and presentation.",
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
      "Portfolio Reflection"
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

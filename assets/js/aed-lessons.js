const AED_UNITS = {
  "0": {
    "title": "Engineering Foundations & Rocket Launch Pad Challenge",
    "project": "Rocket Launch Pad Design Challenge",
    "cert": "Engineering Safety Readiness + Unit 0 Portfolio",
    "description": "Students build engineering habits, safety routines, documentation practices, and early design-process skills through a hands-on launch pad challenge.",
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
    "description": "Students communicate engineering designs through sketching, measurement, tolerances, assembly documentation, bills of materials, change records, and final proposal presentations.",
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
    "description": "Students create accurate CAD part models, prepare files for 3D printing, complete the FabLab 3D printer workflow, and print a tolerance tester that supports the next rocket assembly unit.",
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
    "title": "CAD Assemblies, Prototyping & Technical Drawings",
    "project": "Full Rocket Assembly Prototype & Technical Drawing Package",
    "cert": "Fusion CAD Level 2 + Engineering Drawings Portfolio",
    "description": "Students build a full rocket CAD assembly, check fit and alignment, 3D print and physically assemble a prototype, test the assembly, and create technical drawings for final presentation.",
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
    "title": "Aerospace Mechanisms, Materials & Electromechanical Systems",
    "project": "Aerospace Mechanism/Electromechanical System Prototype",
    "cert": "Materials, Mechanisms, Circuits + Prototype Testing Portfolio",
    "description": "Students investigate materials, mechanisms, motion, friction, data, statistics, circuits, motors, and electromechanical systems through an aerospace prototype challenge.",
    "lessons": [
      "Unit 4 Challenge Launch: Aerospace Mechanisms, Materials & Electromechanical Systems",
      "Aerospace Materials and Material Properties",
      "Material Testing Lab",
      "Statistics and Measurement Error",
      "Mechanisms and Types of Motion",
      "Mechanism Exploration: Linkages, Hinges, Cams, Gears, and Pulleys",
      "Friction, Force, and Mechanism Performance",
      "Motion Graphs and System Behavior",
      "Electrical Safety and Simple Circuits",
      "Motors and Electromechanical Motion",
      "Concept Generation and Decision Matrix",
      "System Architecture and Subsystem Planning",
      "CAD Planning and Assembly Layout",
      "CAD Modeling Workday: Components, Motion, and Fit",
      "Prototype Build Day 1: Structure and Mechanism",
      "Prototype Build Day 2: Electrical or Electromechanical Integration",
      "Testing Protocol Development",
      "Prototype Testing and Data Collection",
      "Data Analysis, Graphing, and Design Conclusions",
      "Iteration and Prototype Revision",
      "Final Technical Documentation: Mechanism, Circuit, Data, and Revision",
      "Unit 4 Technical Demonstration and Reflection"
    ]
  },
  "5": {
    "title": "Human-Centered Aerospace Design Capstone",
    "project": "Human-Centered Aerospace Design Capstone + Final Portfolio",
    "cert": "Final Engineering Portfolio + Capstone Presentation",
    "description": "Students complete a final human-centered aerospace design capstone that uses user research, ethics, sustainability, life-cycle thinking, project management, prototyping, testing, feedback, revision, portfolio evidence, and final presentation.",
    "lessons": [
      "Human-Centered Aerospace Design Capstone Launch",
      "Stakeholder Research and User Needs",
      "Problem Statement, Criteria, Constraints, and Design Brief",
      "Team Norms and Project Management",
      "Concept Generation and Human-Centered Ideation",
      "Decision Matrix and Final Concept Selection",
      "CAD, Fabrication, and Prototype Planning",
      "CAD Modeling and Prototype Part Development",
      "Prototype Build Day 1: Structure and Core Function",
      "Prototype Build Day 2: Integration and Refinement",
      "Testing Protocol and User Feedback Plan",
      "Prototype Testing and User Feedback",
      "Data Analysis and Stakeholder Feedback Review",
      "Ethics, Safety, Sustainability, and Life-Cycle Analysis",
      "Final Prototype Revision and Refinement",
      "Final Engineering Portfolio Workday",
      "Final Presentation Preparation and Rehearsal",
      "Final Capstone Presentations"
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
  const data = AED_UNITS[unit];
  if (!data || !data.lessons[lesson - 1]) {
    setText("lesson-title", "Lesson not found");
    setText("lesson-summary", "Return to the AED course hub and select a unit lesson.");
    return;
  }

  const lessonTitle = data.lessons[lesson - 1];
  setText("lesson-eyebrow", `AED Unit ${unit} • Lesson ${unit}.${lesson}`);
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

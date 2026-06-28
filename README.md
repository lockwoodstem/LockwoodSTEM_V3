# LockwoodSTEM Full Site RC1

This is a fresh GitHub-ready static site assembled from the current LockwoodSTEM / Aerospace IED curriculum direction defined in the chat.

## Included
- Homepage using the established dark navy/gold LockwoodSTEM style
- Courses page with IED, POE, and Advanced Manufacturing hubs
- Complete IED Units 0–6 course hub
- Unit pages for Units 0–6
- Lesson pages for every IED lesson in Units 0–6
- Resource Library with templates, references, asset boards, and package downloads
- Certification Hub
- FabLab page
- Portfolio page
- Publishing Standard page
- Build Status page

## Notes
This package is review-ready, not final-publication-complete. Reference guides and certification exams still need final publishing layout and question-bank development.

## Deploy
Upload the contents of this folder to a GitHub Pages repository. `.nojekyll` is included.


## GitHub Lite Notes
This version replaces the many individual IED lesson files with one dynamic page:
`courses/ied/lesson.html?unit=1&lesson=1`

The course content remains reviewable, but the `courses` folder is much smaller and easier to upload through GitHub's web uploader.
Large image assets were compressed for upload-friendly previews. Full-size downloads are in the separate Resource Downloads Pack.


## RC5d Certification Login Cacheproof Build

Certification auth scripts include cache-busting query strings and auth.js contains a fallback Apps Script Web App URL.


## RC20b Backend URL Update

Certification backend URL updated to:
https://script.google.com/macros/s/AKfycbw0j9MBMdMG-QNi2IIbp1SE6htXwYgKVV65dV1gLMMTkyK6ujNBWYXtIl-1Jnjlyns/exec


## IED Unit 0 Update

This package updates IED Unit 0 to end with the Rocket Launch Pad Design Challenge. Lessons 0.7–0.12 now cover challenge launch, build planning, prototype build, testing/improvement, final documentation/design review, and the Unit 0 portfolio check/reflection. Student construction uses approved classroom materials only; student CAD/3D printing begins later in the course.


## Unit 1 update: Visual Communication & Sketching

- Unit 1 now runs from Lesson 1.1 through Lesson 1.11 only.
- Lesson 1.11 is the culminating Reverse Engineering Study and Unit 1 Portfolio Check.
- Original Unit 1 instructional graphics are included in `assets/img/unit1/` and embedded in the appropriate lessons.
- Former Lessons 1.12–1.15 were removed from the Unit 1 lesson list.


Update note: Units 1 and 2 were merged into Unit 1 — Technical Sketching & Engineering Documentation. The IED course now uses Units 0–6. Unit 1 lessons 1.11–1.22 use a teacher-provided 3D printed rocket assembly for reverse engineering, measurement, tolerances, adhesives/fasteners, assembly documentation, BOM, assembly notes, engineering change requests, and final proposal presentation.


Unit 2 update: Rebuilt as CAD Modeling, Parametric Design & 3D Printing with 18 lessons, embedded YouTube tutorial references in relevant lessons, and a choice-based 3D printed rocket assembly tolerance tester final project.

# IED Course Accessibility Pass — QA Report

Date: July 20, 2026

## Scope

The accessibility hardening was applied to every HTML page under `courses/ied/`, including the IED course home, unit pages, lesson pages, and challenge pages.

- IED pages updated: **153**
- Links reviewed by static checks: **4,517**
- Buttons reviewed by static checks: **360**
- Reveal/accordion summaries reviewed: **372**
- Images checked for alternative text: **441**
- Visible control, label, tag, and chip elements included in the contrast audit: **5,749**

## Corrections

- Added a final, course-wide stylesheet: `assets/css/ied-accessibility.css`.
- Corrected invisible or low-contrast text on dark download buttons.
- Corrected active 3D viewer buttons, including Standard View and Line Display controls.
- Corrected the Interactive Activity badge.
- Standardized reveal/dropdown boxes to use a gold summary header with dark text and a white answer panel with dark text.
- Corrected secondary and ghost buttons on light and dark backgrounds.
- Corrected tags, pills, workflow verbs, timeline labels, challenge badges, form labels, inputs, and disabled controls.
- Added consistent keyboard focus indicators and a 44-pixel minimum target height for primary controls.
- Added reduced-motion support for users who request it through their operating system.

## Automated Results

The solid-background contrast audit initially identified **637** failures among the targeted control and label elements. After the accessibility stylesheet was applied, the same audit returned **0 failures**.

Static accessible-name checks found:

- Missing image alternative text: **0**
- Unnamed buttons: **0**
- Unnamed links: **0**
- Unlabeled form controls: **0**
- Pages without exactly one level-one heading: **0**

## Verification Notes

Representative visual checks were completed for:

- IED Lesson 1.2 interactive model controls
- IED Lesson 1.2 Interactive Activity banner
- Lesson resource download buttons
- Open and closed reveal-answer boxes
- Standard button, label, and tag states

The automated color audit excludes elements whose backgrounds are created entirely by complex gradients or images because a single CSS background color cannot reliably represent those pixels. Hero and dark-panel controls were therefore also hardened explicitly with high-specificity white-on-dark rules.

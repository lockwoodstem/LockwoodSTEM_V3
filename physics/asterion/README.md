# STRANDED: The Asterion Incident — full campaign playtest

Status: Unit 3 approved baseline complete. All seven chapters are playable in one connected adventure. This build adds 18 challenges to the four original Unit 3 challenges, for 22 commissioning gates total.

## Play
Open index.html from the website package, or dist/index.html in the source project. Move with WASD or arrows, hold Shift to run, and press E near equipment. The glowing diamond marks the next required station. Touch controls are available on smaller/touch screens. M opens the chapter map; J opens the journal; Escape pauses. Music and sound begin on entry and can be adjusted separately.

Complete each station to open the next bulkhead. After the last station, walk to the eastern transit door and press E to move into the next chapter. At each chapter exit, students complete three unit-specific reflection questions in the game. A student name is required; course/section is optional. The Export unit PDF report button downloads a report with responses, measurements, successful configurations, and field notes. Save reflection & continue advances the campaign. Chapter 7 ends at the rescue craft after reflection.

The chapter map includes playtest travel to any chapter. Visiting never awards completion. Each chapter saves its own position, measurements, notes, and successful predictions. Pause → Restart this chapter clears only the current chapter. Progress and reflection drafts are local to this browser and website origin; the journal exports the full campaign record and lets students reopen each completed unit’s reflection/PDF report. Students manually upload their PDFs to the course submission. Moving to a different domain does not automatically transfer local progress. Existing Unit 3 prototype progress is imported when present, while a new campaign starts at Chapter 1.

## Chapters and coverage
1. The Charged Airlock: Coulomb-force measurements, field superposition, charged-probe kinematics.
2. Emergency Reserves: capacitance measurements, series/parallel capacitor banks, potential-to-kinetic energy conversion.
3. Life Support (approved baseline): unknown resistor, series repair, main and reserve parallel networks.
4. Magnetic Transit: wire-force measurements, right-hand rule, charged-particle orbit and period.
5. The Silent Beacon: magnetic flux, Faraday and Lenz laws, electromagnetic frequency/wavelength/period.
6. Finding the Way Home: refraction measurements, lens focus and magnification, double-slit interference.
7. The Asterion Incident: photoelectric effect, atomic transitions, decay timing and mass-defect energy.

## Hosting
Upload the contents of dist to a folder such as /physics/asterion/ and link to its index.html. The download ZIP places website files at its root. No build step, backend, API key or student account is required. Preserve the vendor subfolder: it contains the browser PDF library, bundled Unicode font, and licenses. No external PDF service is used. Keep README.md as a local reference if you do not want it on your website. The provided LockwoodSTEM logo is included unchanged. Google Fonts is optional; local fallback fonts work offline. Audio is procedurally synthesized and requires no third-party audio files.

For embedding: <iframe src="/physics/asterion/index.html" title="Asterion physics adventure" width="100%" height="800" style="border:0"></iframe>. A full-page link is preferable on phones.

## Scientific and assessment scope
Models and units are stated at each station. Instruments use ideal expected readings, without random measurement noise. Alignment and numerical tolerances are defined in validators; most predictions accept 2% rounding tolerance. The turbine controller remains a resistive approximation. Some apparatus drawings are schematic rather than scale drawings; the models drive their relevant control responses.

This is a complete campaign for playtesting selected unit concepts, not a claim of exhaustive PHY 2054C curriculum coverage or validated mastery assessment. Answers are fixed in this build, and client-side state is inspectable. There are no grades, lives, or timers. Keyboard controls, labels, reduced motion, and adjustable audio are provided. A nonvisual navigation alternative and formal accessibility/student usability review are still needed before a broad course launch.

## Verification
All 18 new challenge solutions were checked, including incorrect predictions, invalid numbers, polarity/topology mistakes, and photoelectric threshold rejection. All 18 new challenges were then completed through the browser, with movement through the gates and normal chapter transitions. Measurement requirements, chapter jumping, existing Unit 3 migration, and the final rescue ending were verified. No browser runtime errors were reported during that playthrough. Unit 3's previously tested physics and interactions remain the baseline.

## Reflection report validation
All seven units have three prompts. Required identity and response checks, in-game PDF generation, and post-completion journal access were tested. The shared PDF generator was checked with a two-page sample and a six-page long-response case; selectable Unicode text, pagination, and response endings were verified.


## Interactive missions

All seven units have three interactive apparatus missions. Students manipulate scene handles or the equivalent labeled controls, run experiments, record instrument readings, and certify numerical predictions. Circuit and capacitor missions use terminal-to-terminal wiring; electrically equivalent connections are accepted. DC circuits also require meter measurements. The final mission in each unit opens reflections and the unit PDF directly.

The chapter map provides mission shortcuts for the current deck, subject to sector prerequisites. Earlier saved progress is preserved, and completed apparatus can be replayed. Experiment history retains the most recent 30 runs per apparatus and is included in the Journal and PDF reports. Visual motion is slowed and spatially scaled; numerical instruments use the stated idealized physics models.

Interaction supports mouse, touch, and keyboard controls. Mobile circuit boards include additional large terminal buttons. No server or API key is needed for the game or PDF export. Upload all files and subdirectories from dist to GitHub Pages; preserve the vendor folder.

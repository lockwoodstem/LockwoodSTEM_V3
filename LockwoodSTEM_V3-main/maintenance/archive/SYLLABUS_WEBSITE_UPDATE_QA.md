# Syllabus Website Update QA

## Source files used

The three attached, user-edited PDF files were copied byte-for-byte into the website. Each source and website copy has an identical SHA-256 hash.

- **IED:** `IED_Introduction_to_Engineering_Design_Syllabus_2026-2027.pdf` — 8 pages; SHA-256 verified.
- **POE:** `POE_Principles_of_Engineering_Syllabus_2026-2027.pdf` — 8 pages; SHA-256 verified.
- **ADM:** `ADM_Advanced_Manufacturing_Syllabus_2026-2027.pdf` — 8 pages; SHA-256 verified.

## Website changes

- Added a 2026–2027 syllabus card to the IED course hub.
- Added a 2026–2027 syllabus card to the POE course resources section.
- Added a 2026–2027 syllabus card to the ADM course resources section.
- Added all three syllabi to the global Resource Library as featured course documents.
- Added all three syllabi to the website search index.
- Updated the IED Unit 0 syllabus resource link to the new IED PDF.

## Old syllabus cleanup

- Removed `downloads/course-documents/AED_Syllabus_2026_2027.pdf`.
- Removed `downloads/course-documents/AED_Syllabus_2026_2027_Editable.docx`.
- Removed the old academy syllabus entries from `resource-library.json` and `search-index.json`.
- Preserved the separate academy signature-page files because they are not old syllabi.

## Verification

- All three course-page syllabus buttons resolve to files in the website package.
- No references to `AED_Syllabus_2026_2027` remain in public HTML, JSON, JavaScript, Markdown, or text files.
- Resource Library totals and search-index counts match their item arrays.
- Each final syllabus PDF contains 8 pages.

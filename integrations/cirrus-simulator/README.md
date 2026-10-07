# Cirrus G7 Simulator Reservation System

This folder contains the Google Apps Script backend/UI that is embedded into:
`resources/cirrus-g7-simulator.html`

## Recommended setup
1. Create a new Google Sheet in the school Google Workspace account.
2. Open **Extensions → Apps Script**.
3. Replace Code.gs with the contents of `Code.gs`.
4. Add an HTML file named **Index** and paste the contents of `Index.html`.
5. In Apps Script Project Settings, set the timezone to **America/New_York**.
6. Run `ensureSheets_` once from the editor and authorize the script.
7. Use **Deploy → New deployment → Web app**.
   - Execute as: **Me**
   - Who has access: choose the school-domain option if your Workspace permits it; otherwise use the least-public option compatible with student access.
8. Copy the deployed `https://script.google.com/macros/s/.../exec` URL.
9. Paste that URL into `assets/js/cirrus-simulator.js` as `RESERVATION_APP_URL`.

## Sheet tabs
The script creates:
- **Availability** — teacher-entered availability windows.
- **Students** — student email, name, and Orientation Complete status.
- **Reservations** — all confirmed/cancelled reservations.
- **Settings** — optional allowed email domain and instructions.

## Setting availability
On the Availability sheet, add rows using:
| Date | Start Time | End Time | Enabled | Note |
|---|---|---|---|---|
| 10/14/2026 | 3:00 PM | 5:00 PM | TRUE | After school |

A 3:00–5:00 PM window automatically creates:
- 3:00–3:30
- 3:30–4:00
- 4:00–4:30
- 4:30–5:00

## Orientation workflow
A student not marked complete on the Students tab is automatically booked as **Orientation**.
After the student actually completes the orientation, change **Orientation Complete** to TRUE.
Do not mark it complete simply because the student reserved an orientation.

## Recommended operating rule
The current script permits one active future reservation per student at a time.
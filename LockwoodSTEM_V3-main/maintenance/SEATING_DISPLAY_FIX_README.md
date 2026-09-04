# LockwoodSTEM Seating Display Fix

The hidden seating page has been restored at:

- `https://lockwoodstem.org/seating-display/`

The page is intentionally absent from site navigation and search indexes. It embeds the existing LockwoodSTEM Google Apps Script seating tool in read-only display mode and includes direct links for the display and teacher editor.

## Optional display parameters

- Classroom layout: `/seating-display/?layout=Classroom`
- FabLab layout: `/seating-display/?layout=FabLab`
- Specific period: `/seating-display/?period=2&layout=Classroom`

## Google sign-in

If the embedded frame does not show the chart, use **Open Display**, sign in or authorize the Apps Script web app in the new tab, then return to the hidden page and select **Refresh**.

## Publishing

Place `seating-display/` and `robots.txt` in the repository publishing root. The hidden page must be located at `seating-display/index.html`, not inside another nested repository folder.

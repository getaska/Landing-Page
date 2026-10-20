/**
 * Getaska waitlist collector.
 *
 * Setup:
 * 1. Create a new Google Sheet (e.g. "Getaska Waitlist"). Add a header
 *    row: Timestamp | Email
 * 2. In the sheet, go to Extensions > Apps Script.
 * 3. Delete the default code and paste this file's contents in.
 * 4. Save, then Deploy > New deployment.
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Click Deploy, authorize the requested permissions, and copy the
 *    Web App URL (it ends in /exec).
 * 6. Paste that URL into WAITLIST_ENDPOINT in js/waitlist.js.
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var email = (data.email || '').toString().trim();

    if (!email || email.indexOf('@') === -1) {
      return jsonResponse({ ok: false, error: 'Please enter a valid email address.' });
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var existing = sheet.getDataRange().getValues();
    for (var i = 1; i < existing.length; i++) {
      if (String(existing[i][1]).toLowerCase() === email.toLowerCase()) {
        return jsonResponse({ ok: false, error: 'Email already registered' });
      }
    }

    sheet.appendRow([new Date(), email]);
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: 'Something went wrong, please try again.' });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

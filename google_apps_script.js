/**
 * Google Apps Script for Sci-Fi HUD Nutrition & Training Tracker
 * 
 * INSTRUCTIONS:
 * 1. Open Google Sheets.
 * 2. Create a sheet with the following column headers in Row 1:
 *    Date | Weight | Calories | Protein | Workout Tag | Workout Details | Food Log
 * 3. Go to Extensions -> Apps Script.
 * 4. Paste this code, replacing any default code.
 * 5. Click "Save" (disk icon).
 * 6. Click "Deploy" -> "New deployment".
 * 7. Choose "Web app" as the type.
 * 8. Set:
 *    - Description: Tracker Sync Endpoint
 *    - Execute as: Me (your email)
 *    - Who has access: Anyone
 * 9. Click "Deploy", authorize permissions, and COPY the "Web app URL".
 * 10. Paste this URL into the settings modal in your Tracker Web App.
 */

function doPost(e) {
  try {
    // Parse incoming payload
    var payload = JSON.parse(e.postData.contents);
    var targetDate = payload.date; // Format: YYYY-MM-DD
    var weight = payload.weight;
    var calories = payload.calories;
    var protein = payload.protein;
    var workoutTag = payload.workoutTag;
    var workoutDetails = payload.workoutDetails;
    var foodLog = payload.foodLog; // Summary text of meals
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Check if headers exist, if not, create them
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Date", "Weight", "Calories", "Protein", "Workout Tag", "Workout Details", "Food Log"]);
      // Format headers
      sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#d9ead3");
    }
    
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();
    var rowFound = -1;
    
    // Search for existing date row (starting from row 2)
    for (var i = 1; i < values.length; i++) {
      var rowDate = values[i][0];
      
      // Parse sheets date to string YYYY-MM-DD for comparison
      var dateStr = "";
      if (rowDate instanceof Date) {
        // Offset timezone differences
        var timezone = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
        dateStr = Utilities.formatDate(rowDate, timezone, "yyyy-MM-dd");
      } else {
        dateStr = rowDate.toString().trim();
      }
      
      if (dateStr === targetDate) {
        rowFound = i + 1; // 1-indexed row number
        break;
      }
    }
    
    // Assemble log data row
    var rowData = [
      targetDate,
      weight !== undefined && weight !== null ? weight : "",
      calories !== undefined && calories !== null ? calories : 0,
      protein !== undefined && protein !== null ? protein : 0,
      workoutTag || "",
      workoutDetails || "",
      foodLog || ""
    ];
    
    if (rowFound > -1) {
      // Update existing row
      sheet.getRange(rowFound, 1, 1, 7).setValues([rowData]);
    } else {
      // Append new row
      sheet.appendRow(rowData);
    }
    
    // Format the Date column as plain text to avoid automatic Sheets formatting glitches
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).setNumberFormat("@");
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: rowFound > -1 ? "Row updated for " + targetDate : "Row appended for " + targetDate
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

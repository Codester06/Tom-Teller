// Add this function to your Google Apps Script to handle CORS
function doOptions(e) {
  return ContentService
    .createTextOutput()
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    });
}

// Also update your doPost function to include CORS headers
function doPost(e) {
  try {
    // Add safety check for the event object
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'No data received'
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
    }

    // Get the data from the POST request
    const data = JSON.parse(e.postData.contents);
    const email = data.email;

    // Validate email
    if (!email || !email.includes('@')) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'Invalid email address'
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
    }

    // Open the spreadsheet with your actual sheet ID
    const sheetId = '17lFMbWZ0Yj43gVjS-zbKhJ4p3gKEnGSFRV5crIK6gQc';
    const sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();

    // Check if email already exists
    const existingEmails = sheet.getRange('A:A').getValues().flat();
    if (existingEmails.includes(email)) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'Email already subscribed'
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
    }

    // Add headers if this is the first entry
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 3).setValues([['Email', 'Date', 'Timestamp']]);
    }

    // Add the new email with timestamp
    const now = new Date();
    const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const timeStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm:ss');
    sheet.appendRow([email, dateStr, timeStr]);

    // Send welcome email
    try {
      sendWelcomeEmail(email);
      console.log('Welcome email sent to:', email);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Continue even if email fails - we still want to save the subscription
    }

    // Return success response with CORS headers
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Email successfully added and welcome email sent'
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });

  } catch (error) {
    console.error('Error:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Server error occurred'
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
  }
}
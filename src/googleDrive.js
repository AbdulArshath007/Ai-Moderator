const { google } = require('googleapis');
const stream = require('stream');
const path = require('path');
const fs = require('fs');

// Reference the JSON key file from the root directory
const KEYFILEPATH = path.join(__dirname, '../gps-tracker-439417-629a860d6001.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

let authConfig = { scopes: SCOPES };

if (fs.existsSync(KEYFILEPATH)) {
    authConfig.keyFile = KEYFILEPATH;
} else if (process.env.GOOGLE_CREDENTIALS) {
    authConfig.credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
} else {
    console.warn("No Google Auth credentials found. Set GOOGLE_CREDENTIALS in your environment.");
}

const auth = new google.auth.GoogleAuth(authConfig);

// Initialize the Google Drive API service
const driveService = google.drive({ version: 'v3', auth });

/**
 * Uploads a Multer file object to Google Drive and sets permissions to public
 * @param {Object} fileObject - The file object from multer (req.file)
 * @returns {Promise<string>} - Returns the URL to view the uploaded file
 */
async function uploadFileToDrive(fileObject) {
    if (!fileObject) throw new Error("No file object provided.");

    // Convert the buffer to a stream
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileObject.buffer);

    const fileMetadata = {
        name: `profile_${Date.now()}_${fileObject.originalname}`,
    };

    const media = {
        mimeType: fileObject.mimetype,
        body: bufferStream,
    };

    try {
        console.log("Uploading image to Google Drive...");
        const response = await driveService.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, webViewLink, webContentLink',
        });

        const fileId = response.data.id;

        // Make the file publicly accessible so the chat app image tags can load it
        await driveService.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        console.log(`Successfully uploaded: ${response.data.webViewLink}`);

        // webContentLink allows direct downloading/displaying in <img> tags often better than webViewLink
        return response.data.webContentLink || response.data.webViewLink;
    } catch (error) {
        console.error("Error uploading to Google Drive", error);
        throw error;
    }
}

module.exports = {
    uploadFileToDrive
};

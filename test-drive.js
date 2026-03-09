const { uploadFileToDrive } = require('./src/googleDrive.js');

async function test() {
    try {
        const fileObj = {
            buffer: Buffer.from('hello world'),
            originalname: 'test.txt',
            mimetype: 'text/plain'
        };
        const url = await uploadFileToDrive(fileObj);
        console.log("Success URL:", url);
    } catch (e) {
        console.error("FAILED. Details:");
        if (e.response && e.response.data) {
            console.error(JSON.stringify(e.response.data, null, 2));
        } else {
            console.error(e.message);
        }
    }
}
test();

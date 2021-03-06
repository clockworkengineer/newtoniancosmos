'use strict';
/* 
 * The MIT License
 *
 * Copyright 2016 Robert Tizzard.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

(function TASKPROCESS(run) {

    // Not a child process so don't run.

    if (!run) {
        return;
    }

    // Node path handling

    const path = require('path');

    // Nodemailer SMTP  processing package

    const nodemailer = require('nodemailer');

    // File systems extra package

    const fs = require('fs-extra');

    // Task Process Utils

    const TPU = require('./FPE_taskProcessUtil.js');
    
    //
    // ================
    // UNPACK ARGUMENTS
    // ================
    //
 
   // Setup watch folder, allowed file formats to print and eprint JSON File

    var fileFormats = JSON.parse(process.argv[2]);
    var watchFolder = process.argv[4];
    var eprintJSON  = process.argv[3];

    // 
    // =====================
    // MESSAGE EVENT HANDLER
    // =====================
    //

    //
    // Send email to HP ePrint with file attached so that it is printed.
    //

    process.on('message', function (message) {

        let srcFileName = message.fileName;

        // Send only selected extensions

        if (fileFormats[path.parse(srcFileName).ext]) {

            console.log('Emailing [%s] to ePRINT.', srcFileName);

            // Set up email details

            let mailOptions = {
                from: eprintDetails.emailAccount,
                to: eprintDetails.eprintAddress,
                subject: srcFileName,
                attachments: [{path: srcFileName}]
            };

            // Send email if eprint.json send flag set to true

            if (eprintDetails.eprintSend && eprintDetails.eprintSend === 'true') {

                // send mail with defined transport object 

                transporter.sendMail(mailOptions, function (err, info) {
                    TPU.sendStatus(TPU.stausSend);   // File complete send more
                    if (err) {
                        return console.error(err);
                    }
                    console.log('Message sent: %s', info.response);
                    if (message.deleteSource) {     // Delete Source if specified
                        TPU.deleteSourceFile(srcFileName);
                    }
                });

            } else {
                console.log('Message not sent for file : [%s].', srcFileName);
                TPU.sendStatus(TPU.stausSend);  // File complete send more
            }

        } else {
            TPU.sendStatus(TPU.stausSend);  // File format not supported send another
        }

    });

    //
    // =========
    // MAIN CODE
    // =========
    //
    
    // Process closedown

    function processCloseDown(callback) {

        try {
            transporter.close();
        } catch (err) {
            callback(err);
        }

    }

    // Setup process exit handlers.

    TPU.processExitHandlers(processCloseDown);

    // Read in eprint.json

    var eprintDetails = TPU.readJSONFile(eprintJSON, '"emailTransport" : "", "emailAccount" : "", "eprintAddress": "", "eprintSend": "true/false"}');

    // Create reusable transporter object using the default SMTP transport 

    var transporter = nodemailer.createTransport('smtps://' + eprintDetails.emailTransport);


})(process.env.TASKCHILD);

// ======================
// TASK PROCESS SIGNATURE
// ======================

var EprintTask = {

    signature: function () {
        return({
            taskName: 'File ePrinter',
            processDetails: {prog: 'node', args: [__filename.slice(__dirname.length + 1), '{ ".docx" : true, ".rtf" : true, ".txt" : true}', global.commandLine.options.root + 'eprint.json']},
         });

    }

};

module.exports = EprintTask;

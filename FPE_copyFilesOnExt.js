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

//var console = require('./FPE_logging.js');

// Node path module

var path = require('path');

// File systems extra package

var fs = require('fs-extra');

//
// MAIN CODE
//

// Setup watch and default destination folder and parse file extension destination JSON

var destinationFolder = process.argv[2];
var watchFolder = process.argv[4];

try {

    var destinationForExt = JSON.parse(process.argv[3]);

} catch (err) {

    console.error('Error parsing JSON passed stopping process ' + err);
    console.error(err);
    process.exit(1);  // Closedown child process

}
;

// Create default desination folder if needed

if (!fs.existsSync(destinationFolder)) {
    console.log('Creating destination folder. %s', destinationFolder);
    fs.mkdir(destinationFolder, function (err) {
        if (err) {
            console.error(err);
            process.exit(1);    // Closedown child process       
        }
    });

}

// Create destination folders for individual extensions if needed

for (let dest in destinationForExt) {

    if (!fs.existsSync(destinationForExt[dest])) {
        console.log('Creating destination folder. %s', destinationForExt[dest]);
        fs.mkdir(destinationForExt[dest], function (err) {
            if (err) {
                console.error(err);
                process.exit(1);    // Closedown child process
            }
        });
    }

}

//
// MESSAGE EVENT HANDLER
//

// Send satus reply to parent (1=rdy to recieve files, 0=proessing don't send)

function processSendStatus(value) {

    process.send({status: value}, function (err) {
        if (err) {
            console.error(err);
            process.exit(1);    // Closedown child process        
        }
    });

}

// Delete source file

function deleteSourceFile(srcFileName) {

    console.log('Delete Source %s.', srcFileName);
    fs.unlink(srcFileName, function (err) {
        if (err) {
            console.error(err);
        }
    });

}

// Process file. If extension destination not specified copy to default

process.on('message', function (message) {

    let srcFileName = message.fileName;
    let dstFileName;

    if (!destinationForExt[path.parse(srcFileName).ext]) {
        dstFileName = destinationFolder + message.fileName.substr(watchFolder.length);
    } else {
        dstFileName = destinationForExt[path.parse(srcFileName).ext] + message.fileName.substr(watchFolder.length);
    }

    processSendStatus(0);  // Signal file being processed so stop sending more

    console.log('Copying file ' + srcFileName + ' To ' + dstFileName + '.');

    fs.copy(srcFileName, dstFileName, function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log('File copy complete.');
        }
        processSendStatus(1);           // File complete send more
        if (message.deleteSource) {     // Delete Source if specified
            deleteSourceFile(srcFileName);
        }

    });

});
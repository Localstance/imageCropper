'use strict';
var express = require('express');
var fs = require('fs');
var path = require('path');
var bodyParser = require('body-parser');
var app = express();
var appPort = 3001;
var UPLOAD_FOLDER = 'jsapiupload';
var uploadsPath =  path.join(__dirname, UPLOAD_FOLDER);

app.use(express.static(__dirname + '/public', {
    etag: false,
    lastModified: false
}));

app.use('/' + UPLOAD_FOLDER, express.static(uploadsPath, {
    etag: false,
    lastModified: false
}));

if(!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath);
}

var generateFilename = function(name) {
    var ext = path.extname(name);
    var base = path.basename(name, ext);
    return [UPLOAD_FOLDER, '/', base,'_',Date.now(),ext].join('');
};

app.use(bodyParser.urlencoded({
    extended: true,
    limit: '5mb'
}));

app.use(bodyParser.json());

app.get('/' + UPLOAD_FOLDER, function(req, res){
    var dirName = '/' + UPLOAD_FOLDER;
    var _files = fs.readdirSync(UPLOAD_FOLDER);
    var resFiles = [];
    for (var i in _files) {
        resFiles.push(dirName + '/' + _files[i]);
    }
    res.json({'images': resFiles});
});

app.post('/' + UPLOAD_FOLDER, function (req, res) {
    var body = req.body;
    var name = generateFilename('crop') + '.jpg';
    var base64data = body.image.split('base64,')[1];
    var binaryData = new Buffer(base64data, 'base64').toString('binary');
    fs.writeFile(name, binaryData, 'binary', function(error) {
        if(error) {
            throw error;
        } else {
            res.status(200).json({'link': '/' + name});
        }
    });
});

app.listen(appPort, function () {
  console.log('Site available on http://localhost:' + appPort);
});
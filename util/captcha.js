var http = require('http');
var fs = require('fs');
var request = require('request');
var util = require('util');

sleep = function (milliSeconds) {
    var startTime = new Date().getTime();
    while (new Date().getTime() < startTime + milliSeconds);
};

exports.downloadCaptcha = function(url, id, callback){
    var options = {
        url         :   url,
        headers     :   {
            'User-Agent'    :   'request'
        }
    };
    request(options, function () {
        callback();
    }).pipe(fs.createWriteStream(id + '.jpeg'));
}

var mkfield = function (field, value) {
    return util.format('Content-Disposition: form-data; name="%s"\r\n\r\n%s\r\n', field, value);
}

exports.getValue = function(imageId, config, callback){
    var content = '';
    var contentLength = 0;
    var options = {
        hostname    :   'bbb4.hyslt.com',
        port        :   80,
        path        :   '/api.php?mod=php&act=upload',
        method      :   'POST',
        headers     :   {
            'User-Agent'    :   'request',
            'Content-Type'  :   '',
            'Content-Length':   0
        }
    };

    // make the boundry
    var boundry = '----WebKitFormBoundary';
    var max = 9007199254740992;
    var dec = Math.random() * max;
    var hex = dec.toString(36);
    boundry += hex;
    boundry = '----WebKitFormBoundaryuNqeaLLMjB4jbAXg';
    options.headers['Content-Type'] = 'multipart/form-data; boundary=' + boundry;

    // make the req body
    content += '--' + boundry + '\r\n';
    content += mkfield('user_name', config.lianzhong_user);
    content += '--' + boundry + '\r\n';
    content += mkfield('user_pw', config.lianzhong_pw);
    content += '--' + boundry + '\r\n';
    content += mkfield('yzm_minlen', '0');
    content += '--' + boundry + '\r\n';
    content += mkfield('yzm_maxlen', '10');
    content += '--' + boundry + '\r\n';
    content += mkfield('yzmtype_mark', '0');
    content += '--' + boundry + '\r\n';
    content += mkfield('zztool_token', config.lianzhong_user);
    content += '--' + boundry + '\r\n';
    content += util.format('Content-Disposition: form-data; name="upload"; filename="%s.jpeg"\r\n', imageId);
    content += util.format('Content-Type: %s\r\n\r\n', 'image/jpeg');

    // read file
    fs.readFile(imageId + '.jpeg', function(err, data){
        var endData = '\r\n--' + boundry + '\r\n';
        options.headers['Content-Length'] = content.length + endData.length + data.length;
        var req = http.request(options, function(res){
            res.on("data", function(result){
                var result = JSON.parse(result);
                console.log(result);
                if (result.result == true){
                    callback(result.data.val);
                }else{
                    console.log('error when get captcha value');
                }
            })
        })
        req.on('error', function(e){
            console.log('problem with request:' + e.message);
        })
        req.write(content);
        req.write(data);
        req.end(endData);
    });
}
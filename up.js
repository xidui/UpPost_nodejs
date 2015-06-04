var http = require('http');
var qs = require('querystring');
var cap = require('./captcha');

var URL = 'www.douban.com/group/topic/75835626/';

var postForm = {
    rv_comment      :   '',
    ck              :   '5zHN',
    start           :   0,
    submit_btn      :   '加上去'
};

var postFormCaptcha = {
    rv_comment          :   '',
    ck                  :   '5zHN',
    start               :   0,
    submit_btn          :   '加上去',
    'captcha-solution'  :   '',
    'captcha-id'        :   ''
};

var up_once = function(url, postForm){
    var host = url.match(/[a-z|A-Z|0-9|.]*/)[0];
    var path = url.match(/\/[a-z|A-Z|0-9|\/#!\?=&_]*/)[0];
    var up_options = {
        hostname    :   host,
        port        :   80,
        path        :   path,
        method      :   'POST',
        headers     :   {
            'User-Agent'    :   'request',
            "Content-Type"  :   'application/x-www-form-urlencoded',
            "Content-Length":   0,
            Cookie          :   global.ck
        }
    };

    // make the login request
    var postData = qs.stringify(postForm);
    up_options.headers['Content-Length'] = postData.length;

    // up
    var req = http.request(up_options, function(res) {
        console.log('UP STATUS: ' + res.statusCode);
        console.log('HEADERS : ' + res.headers);
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            //console.log(chunk);
        });
    });
    req.on('error', function(e) {
        console.log('problem with log request: ' + e.message);
    });
    req.write(postData);
    req.end();
}

var up = function (content){
    // first to see weather need input captcha
    var options = {
        hostname    :   URL.match(/[a-z|0-9|A-Z|.]*/)[0],
        port        :   80,
        path        :   URL.match(/\/[a-z|A-Z|0-9|\/]*/)[0],
        method      :   'GET',
        headers     :   {
            'User-Agent'    :   'request',
            Cookie          :   global.ck
        }
    };
    var req = http.request(options, function (res) {
        res.setEncoding('utf8');
        var responseText = '';
        var multiFlag = false;
        res.on('data', function (chunk) {
            responseText += chunk;
            if (chunk.match(/<html lang/) != null){
                multiFlag = true;
            }
            if (chunk.match(/<\/html>/) == null && multiFlag){
                return;
            }
            if (responseText.match(/<img id="captcha_image" src="/)){
                // up with captcha
                var imageDom = responseText.match(/<img id="captcha_image" src="http:\/\/www.douban.com\/misc\/captcha\?id=[a-z|A-Z|0-9|:;&=]*/g)[0];
                var imageUrl = imageDom.match(/http:[a-z|A-Z|0-9|\/|.\?&:=;]*/)[0];
                var imageId = imageUrl.match(/id=[a-z|A-Z|0-9|:;]*/)[0];
                imageId = imageId.split('=')[1];
                console.log(imageUrl);
                cap.downloadCaptcha(imageUrl, imageId, function(){
                    cap.getValue(imageId, function(imageValue){
                        var form = postFormCaptcha;
                        form['rv_comment'] = 'up_captcha : ' + content;
                        form['captcha-solution'] = imageValue;
                        form['captcha-id'] = imageId;
                        //console.log(form);
                        up_once('www.douban.com/group/topic/75835626/add_comment', form);
                    });
                });
            } else {
                // up without captcha
                var form = postForm;
                form.rv_comment = 'up_without : ' + content;
                up_once('www.douban.com/group/topic/75835626/add_comment', form);
            }
        });
    });
    req.on('error', function (e) {
        console.log('up problem with request: ' + e.message);
    });
    req.end();
}

exports.afterLogin = function(){
    for (var i = 0; i < 3; ++i){
        up(i);
    }
}
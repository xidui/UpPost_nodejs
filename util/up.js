var http = require('http');
var qs = require('querystring');
var cap = require('./captcha');

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

var up_once = function(config, postForm){
    var host = (config.url + '/add_comment').match(/[a-z|A-Z|0-9|.]*/)[0];
    var path = (config.url + '/add_comment').match(/\/[a-z|A-Z|0-9|\/#!\?=&_]*/)[0];
    var up_options = {
        hostname    :   host,
        port        :   80,
        path        :   path,
        method      :   'POST',
        headers     :   {
            'User-Agent'    :   'request',
            "Content-Type"  :   'application/x-www-form-urlencoded',
            "Content-Length":   0,
            Cookie          :   global.ck[config.douban_user]
        }
    };

    // make the login request
    var postData = qs.stringify(postForm);
    up_options.headers['Content-Length'] = postData.length;

    // up
    var req = http.request(up_options, function(res) {
        console.log('UP STATUS: ' + res.statusCode);
        //console.log('HEADERS : ' + res.headers);
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

var up = function (config){
    // first to see weather need input captcha
    var options = {
        hostname    :   config.url.match(/[a-z|0-9|A-Z|.]*/)[0],
        port        :   80,
        path        :   config.url.match(/\/[a-z|A-Z|0-9|\/]*/)[0],
        method      :   'GET',
        headers     :   {
            'User-Agent'    :   'request',
            Cookie          :   global.ck[config.douban_user]
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
                        form['rv_comment'] = 'up_captcha : ' + config.content;
                        form['captcha-solution'] = imageValue;
                        form['captcha-id'] = imageId;
                        //console.log(form);
                        up_once(config, form);
                    });
                });
            } else {
                // up without captcha
                var form = postForm;
                form.rv_comment = 'up_without : ' + config.content;
                up_once(config, form);
            }
        });
    });
    req.on('error', function (e) {
        console.log('up problem with request: ' + e.message);
    });
    req.end();
}

exports.afterLogin = function(config){
    console.log('afterlogin');
    up(config);
}
var http = require('http');
var login = require('./login');
var cap = require('./captcha');
var up = require('./up');

exports.cklog = function(cookie, config, cb){
    if (cookie == null) cookie = '';
    var options = {
        hostname    :   'accounts.douban.com',
        port        :   80,
        path        :   '/login',
        method      :   'GET',
        headers     :   {
            'User-Agent'    :   'request',
            Cookie          :   cookie
        }
    };
    console.log('cookie : ' + cookie);

    var req = http.request(options, function (res) {
        res.setEncoding('utf8');
        var responseText = '';
        res.on('data', function (chunk) {
            responseText += chunk;
            if (null == chunk.match(/\/html/)) {
                return;
            }
            if (cookie != '' && responseText.match(/id="captcha_image"/) == null){
                console.log('Need not login');
                cb(config);
                return;
            }
            if (responseText.match(/id="captcha_image"/)){
                var imageDom = responseText.match(/<img id="captcha_image" src="http:\/\/www.douban.com\/misc\/captcha\?id=[a-z|A-Z|0-9|:;&=]*/g)[0];
                var imageUrl = imageDom.match(/http:[a-z|A-Z|0-9|\/|.\?&:=;]*/)[0];
                var imageId = imageUrl.match(/id=[a-z|A-Z|0-9|:;]*/)[0];
                imageId = imageId.split('=')[1];
                cap.downloadCaptcha(imageUrl, imageId, function(){
                    cap.getValue(imageId, config, function(imageValue){
                        login.loginWithCap(imageId, imageValue, config, cb);
                    });
                });
            }else {
                login.login(config, cb);
            }
        });
    });
    req.on('error', function (e) {
        console.log('problem with request: ' + e.message);
    });
    req.end();
}


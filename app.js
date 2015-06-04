var http = require('http');
var login = require('./login');
var cap = require('./captcha');
var up = require('./up');

global.ck = 'ue="664984593@qq.com"; domain=.douban.com; expires=Fri, 03-Jun-2016 07:10:05 GMT; httponly;bid="hvmGAh7MZMQ"; path=/; domain=.douban.com; expires=Fri, 03-Jun-2016 07:10:05 GMT;dbcl2="126338431:3S1dIjE73sM"; path=/; domain=.douban.com; expires=Sat, 04-Jul-2015 07:10:05 GMT; httponly;as="deleted"; max-age=0; domain=.douban.com; expires=Thu, 01-Jan-1970 00:00:00 GMT;';
global.ck = '';

var options = {
    hostname    :   'accounts.douban.com',
    port        :   80,
    path        :   '/login',
    method      :   'GET',
    headers     :   {
        'User-Agent'    :   'request',
        Cookie          :   global.ck
    }
};

var req = http.request(options, function (res) {
    res.setEncoding('utf8');
    var responseText = '';
    res.on('data', function (chunk) {
        responseText += chunk;
        if (null == chunk.match(/\/html/)) {
            return;
        }
        if (global.ck != '' && responseText.match(/id="captcha_image"/) == null){
            console.log('Need not login');
            up.afterLogin();
            return;
        }
        if (responseText.match(/id="captcha_image"/)){
            var imageDom = responseText.match(/<img id="captcha_image" src="http:\/\/www.douban.com\/misc\/captcha\?id=[a-z|A-Z|0-9|:;&=]*/g)[0];
            var imageUrl = imageDom.match(/http:[a-z|A-Z|0-9|\/|.\?&:=;]*/)[0];
            var imageId = imageUrl.match(/id=[a-z|A-Z|0-9|:;]*/)[0];
            imageId = imageId.split('=')[1];
            cap.downloadCaptcha(imageUrl, imageId, function(){
                cap.getValue(imageId, function(imageValue){
                    login.loginWithCap(imageId, imageValue, up.afterLogin);
                });
            });
        }else {
            login.login(up.afterLogin);
        }
    });
});
req.on('error', function (e) {
    console.log('problem with request: ' + e.message);
});
req.end();
var http = require('http');
var qs = require('querystring');
var request = require('request');
var config = require('./config');

var login_options = {
    hostname    :   'accounts.douban.com',
    port        :   80,
    path        :   '/login',
    method      :   'POST',
    headers     :   {
        'User-Agent'    :   'request',
        "Content-Type"  :   'application/x-www-form-urlencoded',
        "Content-Length":   0
    }
};

exports.login = function(callback){
    var postForm = {
        form_email      :   config.douban_email,
        form_password   :   config.douban_password,
        remember        :   'on',
        source          :   'index_nav'
    };

    // make the login request
    var postData = qs.stringify(postForm);
    login_options.headers['Content-Length'] = postData.length;

    // login
    var req = http.request(login_options, function(res) {
        console.log('LOGIN STATUS: ' + res.statusCode);
        console.log('HEADERS : ' + res.headers);
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            if ("Your browser should have redirected you to http://www.douban.com" == chunk){
                //console.log('login successful');
                global.ck = '';
                res.headers['set-cookie'].forEach(function(c){
                    global.ck += c;
                    global.ck += ';';
                });
                callback();
            }else{
                console.log('login failed');
            }
        });
    });
    req.on('error', function(e) {
        console.log('problem with log request: ' + e.message);
    });
    req.write(postData);
    req.end();
}

exports.loginWithCap = function(id, value, callback){
    var postForm = {
        form_email          :   config.douban_email,
        form_password       :   config.douban_password,
        redir               :   'http://www.douban.com/',
        remember            :   'on',
        source              :   'index_nav',
        'captcha-solution'  :   value,
        'captcha-id'        :   id
    };

    // make the login request
    var postData = qs.stringify(postForm);
    login_options.headers['Content-Length'] = postData.length;

    // login
    var req = http.request(login_options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            if ("Your browser should have redirected you to http://www.douban.com/" == chunk){
                console.log('login douban successful!');
                global.ck = '';
                res.headers['set-cookie'].forEach(function(c){
                    global.ck += c;
                    global.ck += ';';
                });
                callback();
            }else{
                console.log('login failed');
            }
        });
    });
    req.on('error', function(e) {
        console.log('problem with log request: ' + e.message);
    });
    req.write(postData);
    req.end();
}
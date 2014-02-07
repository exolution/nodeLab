/**
 * Created with JetBrains PhpStorm.
 * User: godsong
 * Date: 14-1-30
 * Time: 上午11:56
 */
var Http = require("http"),
    Fs = require("fs"),
    Util = require("util"),

    Url = require('url'),
    QueryString = require('querystring'),
    Request=require('./lib/request'),
    _chain = [],
    _chainIndex = 0,
    Servo = {};

function _resolveUrlMatch(urlMatch){
    var res='^',add= 0;
    urlMatch=urlMatch||'/';
    if(urlMatch.charAt(0)!='/'){
        res='';
    }
    for(var i=0;i<urlMatch.length;i++){
        var ch=urlMatch.charAt(i);
       if(ch=='*'){
            add++;
        }
        else {
            if(add==1){
                res+='[^\\/]*';
                add=0;
            }
            else if(add>=2){
                res+='.*';
                add=0;
            }
            if(ch=='/'||ch=='.'){
                res+='\\'+ch;
            }
           else {
                res+=ch;
            }
        }
    }
    if(urlMatch.charAt(urlMatch.length-1)!='/'){
        res+='$';
    }
    return new RegExp(res);

}
Servo.use = function (middleware, urlMatch) {
    if (typeof middleware == 'function') {

        _chain.push({mw: middleware, urlMatch: _resolveUrlMatch(urlMatch)});
    }
    return this;
};

function preResolveRequest(req) {
    var ret = Url.parse(req.url);
    req.pathname = ret.pathname;
    req.params = QueryString.parse(ret.query);
    console.log(req.method+':'+req.pathname);
}
Servo.start = function (port) {

    Http.createServer(function (req, res) {
        var _invocationContext = {};
        _invocationContext.request = req;
        _invocationContext.response = res;
        _invocationContext._chainIndex=0;
        _invocationContext.chain=_chain;

        function startChain(){

            if (_invocationContext._chainIndex<_chain.length&&_chain[_invocationContext._chainIndex].urlMatch.test(req.pathname)) {
                var ret= _chain[_invocationContext._chainIndex++].mw.call(_invocationContext, req, res, startChain);
            }

            return ret;
        }
        console.log(req.__proto__===Http.IncomingMessage);
        req.__proto__=Request;
        req.response=res;
        startChain();

        res.end();

    }).listen(port || 4632);
};


Servo.use(require('./lib/dispatcher')({root: './action'}),'*.do');
Servo.start(8080);
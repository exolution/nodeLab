/**
 * Created with JetBrains PhpStorm.
 * User: godsong
 * Date: 14-1-31
 * Time: 下午11:39
 */
var http=require('http'),
    Url=require('url'),qs=require('querystring');
var _session={},
    _prefix=Math.random().toString().slice(3);
    uuid=+_prefix;
console.log(uuid);
var request=exports=module.exports={
    __proto__:http.IncomingMessage.prototype
};

request.__defineGetter__('pathname',function(){
        var ret=Url.parse(this.url);
        return ret.pathname;

});
request.__defineGetter__('params',function(){
    var ret=Url.parse(this.url);

    return QueryString.parse(ret.query);
});
request.__defineGetter__('cookies',function(){
    var headers=this.headers;

    var ret=headers.cookie.split(/;|=/);
    var cookies={};
    for(var i=0;i<ret.length;i+=2){
        cookies[ret[i]]=ret[i+1];
    }

    return cookies;
});
request.__defineGetter__('session',function(){
    console.log(this.sessionId,_session);
    debugger;
    if(this.sessionId&&_session[this.sessionId]){

        return _session[this.sessionId];
    }
    else {
        this.sessionId=uuid;
        this.response.setHeader('set-cookie','SERVOSESSIONID='+this.sessionId);

        return _session[uuid++]={};
    }

});

request.__defineGetter__('sessionId',function(){
    console.log(this._sessionId,this.cookies['SERVOSESSIONID'])
   return this._sessionId||(this.cookies['SERVOSESSIONID']);
});
request.__defineSetter__('sessionId',function(val){
    this._sessionId=val;
})

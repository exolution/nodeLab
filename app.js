/**
 * Created with JetBrains PhpStorm.
 * User: godsong
 * Date: 14-1-29
 * Time: 下午9:27
 */
var http=require("http"),fs=require("fs"),util=require("util");
http.createServer(function(req,res){
    var input=fs.createReadStream('./app.js');

    res.setHeader('Content-Type','text/html;charset=utf-8');
    var obj=res.__proto__.__proto__;
    var i= 0;
    var target=require('express');
    //res.write(util.inspect(target));
    for(var key in target){
        if(key.charAt(0)!='_'){
            if(typeof target[key]=='function'){
                var func=target[key].toString();
                var fname=func.substr(0,func.indexOf('\n'));

                res.write('<span style="font-size:20px;">'+key+'</span> : '+fname+'<span title="'+func+'">...</span>}<br>');
            }else{
                res.write(key+'='+target[key]+'<br>');
            }
        }
    }
    res.write('<pre>'+target.application.render.toString()+'</pre>');
    res.write('<pre>'+target.application.get('view').toString()+'</pre>');
    res.write('<script>');

        res.write('var t'+i+++'='+util.inspect(req).replace(/\[[FCOG][^\]]*\]/g,'[]')+';\n');


    res.end('</script>');
}).listen(4000);
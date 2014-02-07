/**
 * Created with JetBrains PhpStorm.
 * User: godsong
 * Date: 14-1-30
 * Time: 下午2:47
 */
var fs = require('fs'),
    Path=require('path'),
    settings = require("./route.config"),
    _servList= {};



var _count=0;
function scanDir(rootDir,callback,filter,flag){
    if(filter===false){
        flag=false;
    }
    var files=fs.readdirSync(rootDir);

        for(var i=0;i<files.length;i++){
            var path=Path.resolve(rootDir,files[i]);
            var stat=fs.statSync(path);
            if(stat.isDirectory()){
                if(flag!==false){
                    scanDir(path,callback,filter);

                }

            }
            else{
                if(filter instanceof RegExp){
                    if(filter.test(files[i])){
                        callback.call(files,rootDir,files[i],stat);
                    }
                }
                else callback.call(files,rootDir,files[i],stat);
            }
        }



}
function _resolveUrlMapping(urlMapping,path,fileName){
    fileName=fileName.substr(0,fileName.lastIndexOf('.js'));
    if(urlMapping){
        if(urlMapping.charAt(0)=='/'){
            urlMapping=urlMapping.slice(1);
            path='';
        }
        if(urlMapping.charAt(urlMapping.length-1)!='/'){
            fileName='';
        }
        return Path.join('/',path,urlMapping,fileName);
    }
    else {
        return Path.join('/',path,fileName);
    }
}
module.exports = function (config,matchs) {
    console.time(1);
    var root='./action/';
    scanDir(root,function(filePath,fileName,stat){
        var path=Path.resolve(filePath,fileName);
        var serv=require(path);

        _servList[_resolveUrlMapping(serv.$urlMapping,Path.relative(root,filePath),fileName)]={
            mtime:stat.mtime,
            path:path,
            instance:serv
        };
        _servList.length=++_count;
        //console.log(filePath);ct++;
    },/\.js$/);


    //console.log(_servList);


    return function (req, res,next) {

        var url=req.pathname.substr(0,req.pathname.lastIndexOf('.'));
        var serv=_servList[url];
        console.log(_servList);
        console.log(url);
        console.time('a');
        if(serv){
            var stat=fs.statSync(serv.path);
            if(+stat.mtime!=+serv.mtime){
                delete require.cache[serv.path];
                serv.instance=require(serv.path);
                //console.log(+stat.mtime,+serv.mtime,stat.mtime!=serv.mtime,'changed!!!!!!!!!!');
            }
            serv.instance.index(req,res);
        }else{
            res.setHeader('abc','123');
            res.setHeader('Cache-Control','max-age:0');
            res.writeHead(404,{'Content-Type':'text/html;charset=utf-8'});
            //res.end('not found!');
        }
        next();
        console.timeEnd('a');
    }
};

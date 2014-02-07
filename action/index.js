/**
 * Created with JetBrains PhpStorm.
 * User: godsong
 * Date: 14-1-30
 * Time: 下午1:11
 */
var fs=require('fs');
exports.action=function(){
    return function(req,res,next){
																																																																																																																											a
        res.write(JSON.stringify(fs.statSync('./action/index.js')));
        res.end();
    };
};

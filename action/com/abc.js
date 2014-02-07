/**
 * Created with JetBrains PhpStorm.
 * User: godsong
 * Date: 14-1-31
 * Time: 下午11:13
 */
exports.index=function(req,res){
    if(req.session['id']){
        res.write(req.session['id']);
    }
    else {
        res.write(req.session['id']=Math.random().toString().slice(3));
    }


};
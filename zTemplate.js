/**
 * Created with JetBrains PhpStorm.
 * User: godsong
 * Date: 14-2-2
 * Time: 下午10:38
 */
var Fs = require('fs');
var frs = Fs.createReadStream('./test.html');
var ParseState = {
    OUT_BLOCK: 0,
    IN_BLOCK: 1,
    BLOCK_BODY: 2
};
var BlockMode = {
    mode: '',
    addMode: function (mode, handler) {
        this.mode += mode;
        this.filter = new RegExp('[' + this.mode + ']');
        this.handlers[mode] = handler;
    },
    handlers: {}
};
var GroupManager = {
    register: function (name, func) {
        this[name] = func;
    }
};
var MethodHandler={
    onEndBlock:function(blockContent,context){
        if (!context.skipMode) {
            if (context.deferEval) {
                context.saveVar(blockContent,'invoke');
            }
            else {

                context.result.push(context.invoke(context.blockScope, blockContent));

            }
        }
    }
};
var PropertyHandler = {

    onEndBlock: function (blockContent, context) {
        if (!context.skipMode) {
            if (context.deferEval) {
                context.saveVar(blockContent,'eval');
            }
            else {

                context.result.push(context.eval(context.blockScope, blockContent));

            }
        }

    },
    onInBlock: function (ch, context) {
        if (!context.skipMode) {
            if (/[$_a-zA-Z0-9.]/.test(ch)) {
                context.blockContent[context.blockType] += ch;
            }
            else {
                context.text += '{' + context.blockType + context.blockContent[context.blockType] + ch;

            }
        }
    }
};
var GroupHandler = {


    onEndBlock: function (blockContent, context) {

        var split = blockContent.indexOf(' ');
        if (split == -1) {
            split = blockContent.length;
        }


        var blockName = blockContent.substring(0, split),
            blockArgs = blockContent.slice(split + 1).trim(),
            group = GroupManager[blockName];
        console.log('resolve group:', blockName, blockContent, context.skipMode);
        if (group) {

            if (context.skipMode) {

                group.onSkipBegin && group.onSkipBegin(context);
            }
            else {
                group.onBegin && group.onBegin(context, blockArgs);
            }

        }
    }
};
var EndGroupHandler = {
    onEndBlock: function (blockContent, context) {
        var group = GroupManager[blockContent];
        if (group) {
            if (context.skipMode) {
                group.onSkipClose && group.onSkipClose(context);
            } else {
                if (group.onClose) {
                    var result = group.onClose(context);
                    context.result.push(result);
                }
                else {
                    console.log('unrecognized group name:' + blockContent);
                }
            }
        }
        else {
            console.log('unrecognized group name:' + blockContent);
            //result = context.resolveResult();

            //context.result.push(result);
        }
        //console.log('{/',blockContent,'}');
    }
};
BlockMode.addMode('$', PropertyHandler);
BlockMode.addMode('#', GroupHandler);
BlockMode.addMode('/', EndGroupHandler);
BlockMode.addMode('@', MethodHandler);
GroupManager.register('each', {
    onBegin: function (context, blockArgs) {
        if (blockArgs.charAt(0) == '$') {
            var scope = context.eval(context.blockScope, blockArgs.slice(1));
            context.push();
            context.blockName='each';
            context.deferEval = true;
            context.blockScope = scope;
        }
        else {
            throw new Error('can\'t resolve the arguments of each :"' + blockArgs + '"');
        }

    },
    onClose: function (context) {
        var result = '';
        var list = context.blockScope;
        if (list) {
            if (list.length > 0) {
                for (var i = 0; i < list.length; i++) {
                    list[i]._index_ = i;
                    result += context.resolveResult(list[i]);
                }
            }
            else {
                for (var key in list) {
                    list[key]._key_ = key;
                    result += context.resolveResult(list[key]);
                }
            }
        }

        context.pop();
        return result;

    }

});
GroupManager.register('if', {
    onSkipBegin: function (context) {
        debugger;
        context.skipIndicator++;

    },
    onBegin: function (context, blockArgs) {
        var criteria;


        var exp=blockArgs.replace(/\$([_a-zA-Z][_a-zA-Z0-9.]*)/g,function(a,b,i){
           var v=context.eval(context.blockScope,b);
           if(typeof v=='string'){
               v='"'+v+'"';
           }
            return v;
        });
        console.log('exp===========>',exp);
        criteria=eval(exp);
        if (criteria) {
            context.skipMode = false;
            context.skipIndicator = -1;
        }
        else {
            context.skipMode = true;
            context.skipIndicator = 1;
        }


        console.log('=========', criteria);
    },
    onSkipClose: function (context) {
        if (context.skipIndicator > 0) {
            context.skipIndicator--;
        }
        else if (context.skipIndicator < 0) {
            context.skipIndicator = 0;
        }
        if (context.skipIndicator == 0) {
            context.skipMode = false;
        }

        console.log(context.result);
    }
});
function resolveChar(ch, context) {
    var nch, handler;
    if (context.state != ParseState.IN_BLOCK && ch == '{') {

        nch = context.html.charAt(context.idx + 1);

        if (BlockMode.filter.test(nch)) {
            if (!context.skipMode) {
                context.result.push(context.text);
                context.text = '';
            }


            context.state = ParseState.IN_BLOCK;
            context.blockType = nch;
            handler = BlockMode.handlers[nch];
            handler.onStartBlock && handler.onStartBlock(context);
            context.idx++;
        }
        else {
            if (!context.skipMode) {
                context.text += ch;
            }
        }
    }
    else if (context.state == ParseState.IN_BLOCK) {
        if (ch == '}') {
            context.state = ParseState.OUT_BLOCK;
            var blockContent = context.blockContent[context.blockType];
            handler = BlockMode.handlers[context.blockType];
            context.blockContent[context.blockType] = '';
            handler.onEndBlock && handler.onEndBlock(blockContent, context);

        }
        else {

            handler = BlockMode.handlers[context.blockType];
            if (handler.onInBlock) {
                handler.onInBlock(ch, context);
            }
            else {
                context.blockContent[context.blockType] += ch;
            }
        }
    }
    else {
        if (!context.skipMode) {
            context.text += ch;
        }

    }
}

/*
 *  if (/[$_a-zA-Z0-9.]/.test(ch)) {
 context.blockContent[context.blockType] += ch;
 }
 else {
 if(context.bodyMode){
 context.group.body += '{' + context.blockType + context.blockContent[context.blockType] + ch;
 }
 else {
 result+='{' + context.blockType + context.blockContent[context.blockType] + ch;
 }
 context.blockType = false;
 }
 * */

function parse(html, scope) {
    var ch = '',
        context = {
            result: [],
            blockName: '',
            blockArgs: '',
            blockStack: [],
            varList: [],
            blockScope: scope,
            text: '',
            idx: 0,
            skipMode: false,
            scope: scope,
            blockContent: {},
            html: html,
            deferEval: false,
            saveVar: function (exp,type) {
                context.varList.push({index: context.result.length, exp: exp,type:type});
                context.result.push('');
            },

            push: function () {
                this.blockStack.push({
                    result: this.result,
                    deferEval: this.deferEval,
                    blockName: this.blockName,
                    //blockArgs: this.blockArgs,
                    blockScope: this.blockScope,
                    varList: this.varList
                });
                this.result = [];
                this.varList = [];
            },
            pop: function () {
                var obj = this.blockStack.pop();
                this.blockName = obj.blockName;
                //this.blockArgs = obj.blockArgs;
                this.deferEval = obj.deferEval;
                this.result = obj.result;
                this.blockScope = obj.blockScope;
                this.varList = obj.varList;
            },
            resolveResult: function (scope) {
                scope = scope || this.blockScope;

                for (var i = 0; i < this.varList.length; i++) {
                    var varObj = this.varList[i];
                    this.result[varObj.index] = this[varObj.type](scope, varObj.exp);
                }
                return this.result.join('');
            },
            invoke:function(scope,exp,bind){

                var ret=/\((.*)\)/.exec(exp);
                if(ret&&ret[1]){
                    var tok=ret[1].split(','),args=[];
                    for(var i=0;i<tok.length;i++){
                        var val=tok[i];
                        if(!isNaN(+val)){
                            args.push(+val);
                        }
                        else if(val.charAt(0)=="'"&&val.charAt(val.length-1)=="'"){
                            args.push(val);
                        }
                        else if(val.charAt(0)=='$'){
                            args.push(this.eval(scope,val.slice(1)));
                        }
                        else{
                            throw new Error('unrecognized arguments "'+val+'" for invoke "'+exp+'"');
                        }
                    }
                }
                else {
                    args=[];
                }
                i=exp.indexOf('(');
                if(i!=-1){
                    exp=exp.slice(0,i);
                }

                //debugger;
                var func=this.eval(scope,exp);

                return func.apply(scope,args);
            },
            eval: function (scope, exp) {
                var tok = exp.split('.'),
                    idx = 0,
                    name,
                    curObj = scope,
                    dflag = exp.charAt(0) == '$';
                //处理 $$xxx的情况

                while (name = tok[idx++]) {
                    curObj = curObj[name];
                    if (typeof curObj != 'object') {
                        //提示错误
                        break;
                    }
                }

                if(curObj==undefined){
                    if(tok.length==1){
                        debugger;
                        idx=this.blockStack.length-1;
                        name=tok[0];
                        while(idx>=0&&!this.blockStack[idx].blockScope.hasOwnProperty(name)){
                            idx--;
                        }
                        return this.blockStack[idx].blockScope[name];
                    }

                    else return undefined;
                }
                else if (dflag) {
                    return scope[curObj];
                }
                else {
                    return curObj;
                }
            },
            parse: parse,
            save: function (text) {


            }
        };
    for (var i = 0; i < BlockMode.mode.length; i++) {
        context.blockContent[BlockMode.mode.charAt(i)] = '';
    }
    while (context.idx < html.length) {
        ch = html.charAt(context.idx);

        resolveChar(ch, context);

        context.idx++;

    }
    // console.log(context.resolveResult());
    return context.resolveResult();
}
frs.on('data', function (data) {
    var html = data.toString('utf-8');
    console.time(1);
    //console.log(html);
    try{
    var result = parse(html, {name: '松影', content: '花花又一夏',abc:function(a,b,c){
        return this.name+'love'+this.content+'('+a+','+b+','+c+')';
    },
        items: [
            {name: '高嵩', content: '霍雨佳'},
            {name: '王舒曼', content: '卡儿朵麦'}
        ]});
    }catch (e){
       console.log(e.name);
       console.log(e.stack);
    }
    console.log(result);
    console.timeEnd(1);

});
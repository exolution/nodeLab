/**
 * Created with JetBrains PhpStorm.
 * User: godsong
 * Date: 14-2-2
 * Time: 下午10:38
 */

var ParseState = {
    OUT_BLOCK: 0,
    IN_BLOCK: 1,
    BLOCK_BODY: 2
};
function Context(html, scope) {
    this.blockStack = [
        {
            result: [],
            blockName: '',
            blockArgs: '',
            blockScope: scope,
            type: 'block'
        }
    ];
    this.branchStack = [];
    this.text = '';
    this.idx = 0;
    this.skipMode = false;
    this.scope = scope;
    this.blockContent = {};
    this.html = html;
    this.deferEval = false;
    this.__defineGetter__('Block', function () {
        return this.blockStack[this.blockStack.length - 1];
    });
    for (var i = 0; i < BlockMode.mode.length; i++) {
        this.blockContent[BlockMode.mode.charAt(i)] = '';
    }
}
var ct = 0;
Context.prototype = {
    saveVar: function (exp, type) {
        this.Block.result.push({ exp: exp, type: type});
    },
    saveBranch: function (criteria) {
        var branchNode = {type: 'branch', exp: criteria,elseGroup:[]};
        var block=this.Block;
        block.result.push(branchNode);
        block.branchStack.push(branchNode);
    },
    setElse:function(criteria){
        var block=this.Block;
        var elseNode={exp:criteria,index:block.result.length-1};
        var branch=block.branchStack[block.branchStack.length-1];
        branch.elseGroup.push(elseNode);
    },
    endBranch:function(){
        var block=this.Block;
        var branch=block.branchStack[block.branchStack.length-1].pop();
        branch.elseGroup[branch.elseGroup.length-1].endIndex=block.result.length-1;
    },
    newBlock: function (name, args, scope) {
        this.blockStack.push({
            result: [],
            branchStack:[],
            blockName: name,
            blockArgs: args,
            blockScope: scope || this.Block.blockStack,
            type: 'block'
        });
    },
    closeBlock: function () {
        var cur = this.blockStack.pop();
        if(cur.branchStack.length>0){
            throw new Error('unclosed if!');
        }
        this.Block.result.push(cur);
        if (this.blockStack.length == 1) {
            this.deferEval = false;
        }
    },
    resolveBlock: function (block, scope) {
        ct++;
        block = block || this.Block;
        scope = scope || block.blockScope;
        var result = '';
        for (var i = 0; i < block.result.length; i++) {
            var varObj = block.result[i];

            if (typeof varObj == 'object') {
                if (varObj.type == 'property') {
                    result += this.eval(scope, varObj.exp);
                }
                else if (varObj.type == 'method') {
                    result += this.invoke(scope, varObj.exp);
                }

                else if (varObj.type = 'block') {
                    if (varObj.blockArgs) {
                        varObj.blockScope = this.eval(scope, varObj.blockArgs);
                        varObj.blockArgs = '';
                    }


                    result += GroupManager[varObj.blockName].onClose(this, varObj);
                }
            }
            else {
                result += varObj;
            }

        }
        return result;
    },
    invoke: function (scope, exp, bind) {
        var ret = /\((.*)\)/.exec(exp);
        if (ret && ret[1]) {
            var tok = ret[1].split(','), args = [];
            for (var i = 0; i < tok.length; i++) {
                var val = tok[i];
                if (!isNaN(+val)) {
                    args.push(+val);
                }
                else if (val.charAt(0) == "'" && val.charAt(val.length - 1) == "'") {
                    args.push(val);
                }
                else if (val.charAt(0) == '$') {
                    args.push(this.eval(scope, val.slice(1)));
                }
                else {
                    throw new Error('unrecognized arguments "' + val + '" for invoke "' + exp + '"');
                }
            }
        }
        else {
            args = [];
        }
        i = exp.indexOf('(');
        if (i != -1) {
            exp = exp.slice(0, i);
        }


        var func = this.eval(scope, exp);

        return func && func.apply(scope, args);
    },
    eval: function (scope, exp) {
        var idx = 0,
            name,
            curObj = scope;

        exp=exp.replace(/\$([^.]*)/g,function(a,b){
           return curObj[b];
        });
        if(exp.charAt(0)=='^'){
            curObj=this.scope;
            exp=exp.slice(1);
        }
        //console.log(curObj,exp);

        var tok = exp.split('.');
        if (exp == '') {
            return scope;
        }
        while (name = tok[idx++]) {
            curObj = curObj[name];
            if (typeof curObj != 'object') {
                //提示错误
                break;
            }
        }
        return curObj;

    }
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
var MethodHandler = {
    onEndBlock: function (blockContent, context) {
        if (!context.skipMode) {
            if (context.deferEval) {
                context.saveVar(blockContent, 'method');
            }
            else {
                var block = context.Block;
                block.result.push(context.invoke(block.blockScope, blockContent));
            }
        }
    }
};

var PropertyHandler = {
    onEndBlock: function (blockContent, context) {
        if (!context.skipMode) {
            if (context.deferEval) {

                context.saveVar(blockContent, 'property');
            }
            else {
                var block = context.Block;
                block.result.push(context.eval(block.blockScope, blockContent));
            }
        }

    },
    onInBlock: function (ch, context) {
        if (!context.skipMode) {
            if (/[$^_a-zA-Z0-9.]/.test(ch)) {
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
       //console.log('resolve group:', blockName, blockContent, context.skipMode);
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
                    if (!context.deferEval) {
                        var result = group.onClose(context, context.Block);
                        if(result!=undefined){
                            context.Block.result.push(result);
                        }
                    }
                    else {
                        context.closeBlock();
                    }
                }
                else {
                    console.log('unrecognized group name:' + blockContent);
                }
            }
        }
        else {
            console.log('unrecognized group name:' + blockContent);

        }
    }
};
BlockMode.addMode('$', PropertyHandler);
BlockMode.addMode('#', GroupHandler);
BlockMode.addMode('/', EndGroupHandler);
BlockMode.addMode('@', MethodHandler);
BlockMode.addMode('!', {
    onEndBlock: function (b, context) {
        //debugger;
    }
});
GroupManager.register('each', {
    onBegin: function (context, blockArgs) {
        if (blockArgs.charAt(0) == '$') {
            var args = '', scope;
            if (context.deferEval) {
                args = blockArgs.slice(1);
            }
            else {
                scope = context.eval(context.Block.blockScope, blockArgs.slice(1));
            }
            context.newBlock('each', args, scope);
            context.deferEval = true;

        }
        else {
            throw new Error('can\'t resolve the arguments of each :"' + blockArgs + '"');
        }

    },
    onClose: function (context, block) {
        var result = '';
        var list = block.blockScope;
        if (list) {
            if (list.length > 0) {
                for (var i = 0; i < list.length; i++) {
                    list[i]._index_ = i;
                    result += context.resolveBlock(block, list[i]);
                }
            }
            else {
                for (var key in list) {
                    list[key]._key_ = key;
                    result += context.resolveBlock(block, list[key]);
                }
            }
        }
        return result;
    }
});
GroupManager.register('if', {
    onSkipBegin: function (context) {
        context.skipIndicator++;

    },
    onBegin: function (context, blockArgs) {
        if(context.deferEval){
            context.saveBranch(blockArgs);
        }
        else{
        var criteria;
        var exp = blockArgs.replace(/\$([_a-zA-Z][_a-zA-Z0-9.]*)/g, function (a, b, i) {
            var v = context.eval(context.Block.blockScope, b);
            if (typeof v == 'string') {
                v = '"' + v + '"';
            }
            return v;
        });
        console.log('exp===========>', exp);
        criteria = eval(exp);
        if (criteria) {
            context.skipMode = false;
            context.skipIndicator = -1;
        }
        else {
            context.skipMode = true;
            context.skipIndicator = 1;
        }

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


    },
    onClose:function(context){
        if(context.deferEval){
            context.endBranch();
        }
    }
});
GroupManager.register('else',{
    onBegin:function(context,blockArgs){

        context.setElse('');
    }
});
GroupManager.register('elseif',{
    onBegin:function(context,blockArgs){
        context.setElse(blockArgs);
    }
});

function resolveChar(ch, context) {
    var nch, handler;
    if (context.state != ParseState.IN_BLOCK && ch == '{') {
        nch = context.html.charAt(context.idx + 1);
        if (BlockMode.filter.test(nch)) {
            if (!context.skipMode) {
                context.Block.result.push(context.text);
                context.text = '';
            }
            context.state = ParseState.IN_BLOCK;
            context.blockType = nch;
            //handler = BlockMode.handlers[nch];
            //handler.onStartBlock && handler.onStartBlock(context);
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
function render(html, data) {
    var ch = '',
        context = new Context(html, data);
    while (context.idx < html.length) {
        ch = html.charAt(context.idx);
        resolveChar(ch, context);
        context.idx++;

    }
    context.Block.result.push(context.text);
    console.time(2);


    var result = context.resolveBlock();
    console.timeEnd(2);
    console.log(ct);

    return result;
}
exports.Context = Context;
exports.GroupManager = GroupManager;
exports.BlockMode = BlockMode;
exports.render = render;

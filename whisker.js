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
            type: 'block',
            branchStack: []
        }
    ];
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
        var branchNode = {type: 'branch', exp: criteria, elseGroup: []};
        var block = this.Block;
        block.result.push(branchNode);
        block.branchStack.push(branchNode);
    },
    setElse: function (criteria, flag) {
        var block = this.Block;
        var branch = block.branchStack[block.branchStack.length - 1];
        var elseNode = {exp: criteria, If: branch, flag: flag, type: 'else'};

        var prevElse = branch.elseGroup[branch.elseGroup.length - 1];
        if (prevElse && prevElse.flag && !criteria) {
            throw new Error('else if can\'t after else');
        }
        if (!prevElse) {
            prevElse = branch;
        }
        prevElse.nextIndex = block.result.length;
        block.result.push(elseNode);
        branch.elseGroup.push(elseNode);
    },
    endBranch: function () {

        var block = this.Block;
        var branch = block.branchStack.pop();
        if(branch){
        branch.endIndex = block.result.length;
        var lastElse=branch.elseGroup[branch.elseGroup.length - 1];
        if(lastElse){
            lastElse.nextIndex = block.result.length;
        }
        }else{
            throw new Error('{/if} need a if');
        }
    },
    newBlock: function (name, args, scope) {
        this.blockStack.push({
            result: [],
            branchStack: [],
            blockName: name,
            blockArgs: args,
            blockScope: scope || this.Block.blockStack,
            type: 'block',
            idx:this.idx
        });
    },
    closeBlock: function () {
        var cur = this.blockStack.pop();
        if (cur.branchStack.length > 0) {
            throw new Error('unclosed if!');
        }
        this.Block.result.push(cur);
        if (this.blockStack.length == 1) {
            this.deferEval = false;
        }
    },
    test: function (scope, exp) {
        var self = this;
        exp = exp.replace(/\$([_a-zA-Z][_a-zA-Z0-9.]*)/g, function (a, b) {
            var v = self.eval(scope, b);
            if (typeof v == 'string') {
                v = '"' + v + '"';
            }
            return v;
        });
        return eval(exp);
    },
    resolveBlock: function (block, scope) {
        ct++;
        block = block || this.Block;
        scope = scope || block.blockScope;

        var ctx={i:0,result:''};
        for (ctx.i = 0; ctx.i < block.result.length; ctx.i++) {
            var varNode = block.result[ctx.i];
            if (typeof varNode == 'object') {
                VarNodeManager.handlers[varNode.type].call(this,varNode,scope,ctx);

            }
            else {
                ctx.result += varNode;
            }

        }
        return ctx.result;
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

        exp = exp.replace(/\$([^.]*)/g, function (a, b) {
            return curObj[b];
        });
        if (exp.charAt(0) == '^') {
            curObj = this.scope;
            exp = exp.slice(1);
        }


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
var VarNodeManager={
    handlers:{},
    add:function(type,func){
        this.handlers[type]=func;
    }
};
var GroupManager = {
    register: function (name, func) {
        this[name] = func;
    }
};
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
VarNodeManager.add('method',function(varNode,scope,ctx){
    ctx.result+=this.invoke(scope, varNode.exp);
});
VarNodeManager.add('property',function(varNode,scope,ctx){
    ctx.result+=this.eval(scope,varNode.exp)
});
VarNodeManager.add('branch',function(varNode,scope,ctx){
    var criteria = this.test(scope, varNode.exp);
    if (criteria) {
        varNode.flag = true;
    }
    else {
        varNode.flag = false;
        ctx.i = (varNode.nextIndex || varNode.endIndex) - 1;

    }
});
VarNodeManager.add('else',function(varNode,scope,ctx){
    if (varNode.If.flag == true) {
        ctx.i = varNode.If.endIndex - 1;
    }
    else {
        if (varNode.flag || (varNode.flag == undefined && this.test(scope, varNode.exp))) {
            varNode.If.flag = true;
        }
        else {
            ctx.i = varNode.nextIndex - 1;
        }
    }
});
VarNodeManager.add('block',function(varNode,scope,ctx){
    if (varNode.blockArgs) {
        varNode.blockScope = this.eval(scope, varNode.blockArgs);
        varNode.blockArgs = '';
    }
    ctx.result+=GroupManager[varNode.blockName].onClose(this, varNode);
});
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
    onStartBlock:function(context){

        var result=context.Block.result,
            prev=result[result.length-1];
        if(typeof prev=='string'){
            var len=prev.length,ct=len;
            while(prev.charAt(--len)==' '){
                ct--;
            }
            result[result.length-1]=prev.slice(0,ct)
        }

    },
    onEndBlock: function (blockContent, context) {

        var split = blockContent.indexOf(' ');
        if (split == -1) {
            split = blockContent.length;
        }
        var blockName = blockContent.substring(0, split),
            blockArgs = blockContent.slice(split + 1).trim(),
            group = GroupManager[blockName];

        if (group) {
            if (context.skipMode) {
                group.onSkipBegin && group.onSkipBegin(context,blockArgs);
            }
            else {
                group.onBegin && group.onBegin(context, blockArgs);
            }

        }
        else{
            console.log('Warning:unidentified group name:' + blockContent);
        }
        var nextChar = context.html.charAt(context.idx + 1);
        if (nextChar == '\n') {
            context.idx++;
        }
        if (nextChar == '\r') {
            context.idx++;
            if (context.html.charAt(context.idx + 2) == '\n') {
                context.idx++;
            }
        }
    }
};
var EndGroupHandler = {
    onStartBlock:function(context){
        var result=context.Block.result,
            prev=result[result.length-1];
        if(typeof prev=='string'){
            var len=prev.length,ct=len;
            while(prev.charAt(--len)==' '){
                ct--;
            }
            result[result.length-1]=prev.slice(0,ct)
        }
    },
    onEndBlock: function (blockContent, context) {
        var group = GroupManager[blockContent];
        if (group) {
            if (context.skipMode) {
                group.onSkipClose && group.onSkipClose(context);
            } else {
                if (group.onClose) {

                    var result = group.onClose(context, context.Block);
                    if (result != undefined) {
                        context.Block.result.push(result);
                    }

                }
                else {
                    console.log('Warning:group "' + blockContent+'" need a onClose Handler');
                }
            }
        }
        else {
            console.log('Warning:unidentified group name:' + blockContent);

        }
        var nextChar = context.html.charAt(context.idx + 1);
        if (nextChar == '\n') {
            context.idx++;
        }
        if (nextChar == '\r') {
            context.idx++;
            if (context.html.charAt(context.idx + 2) == '\n') {
                context.idx++;
            }
        }
    }
};
BlockMode.addMode('$', PropertyHandler);
BlockMode.addMode('#', GroupHandler);
BlockMode.addMode('/', EndGroupHandler);
BlockMode.addMode('@', MethodHandler);
BlockMode.addMode('!', {
    onEndBlock: function (b, context) {

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
        if(block.blockName=='each'){
        if (!context.deferEval) {
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
        else {
            context.closeBlock();
        }
        }
        else{
            throw new Error('unmatched {/each}');
        }
    }
});
GroupManager.register('if', {
    onSkipBegin: function (context) {
        context.Block.branchStack.push(null);

    },
    onBegin: function (context, blockArgs) {
        if (context.deferEval) {
            context.saveBranch(blockArgs);
        }
        else {
            var criteria = context.test(context.Block.blockScope, blockArgs);
            if (criteria) {
                context.skipMode = false;
                context.Block.branchStack.push({flag: true});
            }
            else {
                context.skipMode = true;
                context.Block.branchStack.push({flag: false});
            }

        }

    },
    onSkipClose: function (context) {
        var If=context.Block.branchStack.pop();

        if(If){
            context.skipMode = false;
        }

    },
    onClose: function (context) {

        if (context.deferEval) {
            context.endBranch();
            context.skipMode = false;
        }
        else {
            var If=context.Block.branchStack.pop();
            if(If){
                context.skipMode = false;
            }
            if(If==undefined){
                throw new Error('unmatched /if');
            }
        }
    }
});
GroupManager.register('else', {
    onSkipBegin: function (context) {
        var branchStack = context.Block.branchStack;
        var If = branchStack[branchStack.length - 1];
        if (If) {
            context.skipMode=If.flag;
        }

    },
    onBegin: function (context, blockArgs) {
        if (context.deferEval) {
            context.setElse('', true);
        }
        else {
            var branchStack = context.Block.branchStack;

            var If = branchStack[branchStack.length - 1];
            if(branchStack.length==0){
                throw new Error('else need a if');
            }
            if (If) {
                context.skipMode = If.flag;
            }

        }
    }
});
GroupManager.register('elseif', {
    onSkipBegin:function(context,blockArgs){

        var branchStack = context.Block.branchStack,
            If=branchStack[branchStack.length-1];
        if (If) {
            if (!If.flag) {
                var criteria = context.test(context.Block.blockScope, blockArgs);
                if (criteria) {
                    context.skipMode = false;
                    If.flag = true;
                }
            } else{
                context.skipMode=true;
            }
        }
    },
    onBegin: function (context, blockArgs) {
        if (context.deferEval) {
            context.setElse(blockArgs);
        }
        else {
            debugger;
            var branchStack = context.Block.branchStack;
            if(branchStack.length==0){
                throw new Error('elseif need a if');
            }
            var If = branchStack[branchStack.length - 1];
            if (If) {
                if (!If.flag) {
                    var criteria = context.test(context.Block.blockScope, blockArgs);
                    if (criteria) {
                        context.skipMode = false;
                        If.flag = true;
                    }
                }
                else{
                    context.skipMode=true;
                }
            }
        }
    }
});


function render(html, data) {
    var ch = '',
        context = new Context(html, data);

    try {
        while (context.idx < html.length) {
            ch = html.charAt(context.idx);
            resolveChar(ch, context);
            context.idx++;
        }
        if(context.blockStack.length>1){
            console.log('{#'+context.Block.blockName+'} need a close block "{/'+context.Block.blockName+'}"');
        }
        context.Block.result.push(context.text);

        console.time('resolve');
        var result = context.resolveBlock();
        console.timeEnd('resolve');
    } catch (e) {
        console.log(context.html.substring(context.idx - 30, context.idx), '|', context.html.charAt(context.idx), '|', context.html.substring(context.idx + 1, context.idx + 30));
        console.log(e.stack)

    }



    return result;
}
exports.Context = Context;
exports.GroupManager = GroupManager;
exports.BlockMode = BlockMode;
exports.render = render;
var Fs = require('fs');
var frs = Fs.createReadStream('./test.html');


frs.on('data', function (data) {
    var html = data.toString('utf-8');
    console.time('all');


    var result = render(html, {
        name: '松影',
        content: '花花又一夏',
        abc: function (a, b, c) {
            return this.name + 'love' + this.content + '(' + a + ',' + b + ',' + c + ')';
        },
        items: [
            {name: '高嵩', content: '霍雨佳', set: ['1', 2, 3]},
            {name: '王舒曼', content: '卡儿朵麦', set: [3, 4, 5]}
        ],
        lists: [1, 2, 3, 4]
    });

    console.log(result);
    console.timeEnd('all');


});
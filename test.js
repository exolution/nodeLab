/**
 * Created with JetBrains PhpStorm.
 * User: godsong
 * Date: 14-1-30
 * Time: 下午3:02
 */
/*
 var office=require('office'),fs=require('fs');
 var n=102400,r='',a=[];
 console.time(1);
 for(var i=0;i<n;i++){
 r+=i;
 }
 console.timeEnd(1);
 console.time(2);
 for(i=0;i<n;i++){
 a.push(i);
 }

 a.join('');
 console.timeEnd(2);*/

var Fs = require('fs');
var frs = Fs.createReadStream('./test.html');
var mustache=require('./mustache.js');
var hb=require('./handlebars-v1.3.0.js');

frs.on('data', function (data) {
    var html = data.toString('utf-8');
    console.time(1);
    //console.log(html);

    var result = require('./whisker.js').render(html, {
        name: '松影',
        content: '花花又一夏',
        abc: function (a, b, c) {
            return this.name + 'love' + this.content + '(' + a + ',' + b + ',' + c + ')';
        },
        items: [
            {name: '高嵩', content: '霍雨佳', set: ['1', 2, 3]},
            {name: '王舒曼', content: '卡儿朵麦', set: [3, 4, 5]}
        ],
        lists:[1,2,3,4]
    });

    console.log(result);
    console.timeEnd(1);


});
frs = Fs.createReadStream('./test3.html');
frs.on('data', function (data) {
    var html = data.toString('utf-8');
    console.time(3);
    var ret=mustache.render(html,{
        name: '松影',
        content: '花花又一夏',
        abc: function (a, b, c) {
            return this.name + 'love' + this.content + '(' + a + ',' + b + ',' + c + ')';
        },
        items: [
            {name: '高嵩', content: '霍雨佳', set: ['1', 2, 3]},
            {name: '王舒曼', content: '卡儿朵麦', set: [3, 4, 5]}
        ],
        lists:[1,2,3,4]
    });
    console.timeEnd(3);
    //console.log(ret);

});
frs = Fs.createReadStream('./test4.html');
frs.on('data', function (data) {
    var html = data.toString('utf-8');
    console.time(4);
    var ret=hb.compile(html);
    console.timeEnd(4);
    console.time(5);
    ret({
        name: '松影',
        content: '花花又一夏',
        abc: function (a, b, c) {
            return this.name + 'love' + this.content + '(' + a + ',' + b + ',' + c + ')';
        },
        items: [
            {name: '高嵩', content: '霍雨佳', set: ['1', 2, 3]},
            {name: '王舒曼', content: '卡儿朵麦', set: [3, 4, 5]}
        ],
        lists:[1,2,3,4]
    });
    console.timeEnd(5);
    //console.log(ret);
});
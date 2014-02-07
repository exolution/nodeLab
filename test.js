/**
 * Created with JetBrains PhpStorm.
 * User: godsong
 * Date: 14-1-30
 * Time: 下午3:02
 */
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
console.timeEnd(2);
var test = require('tape');

var stats = require('../index.js');
var fs = require('fs');

var input = 'test/data/preludes.txt'
var output = 'test/data/precop.txt';

test('Buffer test', function(t){
  t.plan(1);
  fs.createReadStream(input, {highWaterMark:1024})
    .pipe(stats('Buffer test'))
    .pipe(fs.createWriteStream(output))
    .on('close',function(){
      t.ok(stats.getResults('Buffer test'), 'Got a result');
      console.log(stats.getResults('Buffer test'));
      fs.unlinkSync(output);
    });
});

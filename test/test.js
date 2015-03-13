var test = require('tape');

var stats = require('../index.js');
var fs = require('fs');


function lengthCheck(t, statObj){
  return function(err, data){
    if(err) throw new Error('Error testing output file size');
    t.equal(statObj.byteCount, data.length);  
  }
}


test('512 byte chunks', function(t){
  t.plan(2);

  var input = 'test/data/preludes.txt'
  var output = 'test/data/precop.txt';

  fs.createReadStream(input, {highWaterMark:512})
    .pipe(stats('Buffer test'))
    .pipe(fs.createWriteStream(output))
    .on('close',function(){
      var statObj = stats.getResults('Buffer test');

      t.equal(statObj.chunkCount, 4, 'Got a result');

      fs.readFile(input, lengthCheck(t, statObj));  

      fs.unlinkSync(output);
   });
});

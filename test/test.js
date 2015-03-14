var fs = require('fs');
var test = require('tape');
var stats = require('../index.js');


function lengthCheck(t, statObj){
  return function(err, data){
    if(err) throw new Error('Error testing output file size');
    t.equal(statObj.byteCount, data.length, 'Byte count is accurate');  
  }
}

function testChunksByLength(len){
  test(len+' byte chunks', function(t){
    t.plan(1);

    var input = 'test/data/preludes.txt'
    var output = 'test/data/'+ Math.random() + '.txt';
    var testName = len + ' length chunk';
    var midStats = stats(testName)
     
    fs.createReadStream(input, {highWaterMark:len})
      .pipe(midStats)
      .pipe(fs.createWriteStream(output))

    midStats.on('end',function(){
      var statObj = stats.getResults(testName);

      fs.readFile(input, lengthCheck(t, statObj));  
      
      fs.unlinkSync(output);   
    });
  });
}

testChunksByLength(512);
testChunksByLength(1);

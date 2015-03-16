var fs = require('fs');
var test = require('tape');
var stats = require('../index.js');
var Writable = require('readable-stream/writable');


function lengthCheck(t, statObj){
  return function(err, data){
    if(err) throw new Error('Error testing output file size');
    t.equal(statObj.len, data.length, 'Byte count is accurate');  
  }
}

function testChunksByLength(len){
  test(len+' byte chunks', function(t){
    t.plan(3);

    var input = 'test/data/preludes.txt'
    var output = 'test/data/'+ Math.random() + '.txt';
    var testName = len + ' length chunk';
    var midStats = stats(testName)
     
    fs.createReadStream(input, {highWaterMark:len})
      .pipe(midStats)
      .pipe(fs.createWriteStream(output))

    midStats.on('end',function(){
      fs.unlinkSync(output);   

      var statObj = stats.getResults(testName);
      t.equal(statObj.store, null, "Store is empty");
      t.equal(statObj.chunkCount, statObj.chunks.length, "Chunk count set properly");
      if(len === 0){
        return t.ok(statObj, "Doesn't throw with a 0 highwater mark.");
      }

      fs.readFile(input, lengthCheck(t, statObj));  
      
    });
  });
}

testChunksByLength(512);
testChunksByLength(1);
testChunksByLength(0);
testChunksByLength(1e6);

test('Object Mode', function(t){
    t.plan(3);

    var testName = 'Object mode';
    var midStats = stats.obj(testName);
    var output = new Writable({objectMode:true});
    output._write = function(chunk,enc,cb){return cb()}
     
    midStats.pipe(output);

    midStats.on('end',function(){

      var statObj = stats.getResults(testName);
      t.equal(statObj.store, null, 'Store is empty');
      t.equal(statObj.chunkCount, statObj.chunks.length, 'Chunk count set properly');
      t.equal(statObj.chunkCount, statObj.len, 'Each chunk is an object');
    });

    midStats.write({a:1});
    midStats.write({b:2});
    midStats.write({c:3});
    midStats.write({d:4});
    midStats.end({e:5});
});

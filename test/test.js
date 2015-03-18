var fs = require('fs');
var test = require('tape');
var bufferEqual = require('buffer-equal');
var isStream = require('isstream');
var stats = require('../index.js');


function lengthCheck(t, statObj){
  return function(err, data){
    if(err) throw new Error('Error testing output file size');
    t.equal(statObj.len, data.length, 'Byte count is accurate');  
    if(statObj.store) t.ok(bufferEqual(statObj.store, data), 'Data in, data out.')
    else t.equal(statObj.store, null, 'No data stored')
  }
}

function testChunksByLength(len, store){
  test(len+' byte chunks, store is '+(store?'set':'unset'), function(t){
    t.plan(7);

    var input = 'test/data/preludes.txt'
    var testName = len + ' length chunk';
    var midStats = store ? stats(testName, {store:1}) : stats(testName);
     
    t.ok(isStream(midStats),'Stats returns a stream');

    var pipeline = fs.createReadStream(input, {highWaterMark:len})
      .pipe(midStats)
      .sink();

    t.ok(isStream.isWritable(pipeline) && !isStream.isReadable(pipeline), 
          'The final stream in the pipeline is a sink');
     
    midStats.on('end',function(){
      var statObj = stats.getResults(testName);
      t.notOk(midStats._obj, 'Object flag is unset');
      t.ok(midStats._store == store, 'Store flag is '+ (store?'set':'unset'));
      t.equal(statObj.chunkCount, statObj.chunks.length, 'Chunk count set properly');
      if(len === 0){
        t.ok(statObj, 'Doesn\'t throw with a 0 highwater mark.');
        t.equal(statObj.chunkCount, 0, 'No zero length chunks.') 
        return;
      }

      fs.readFile(input, lengthCheck(t, statObj));  
      
    });
  });
}

testChunksByLength(512, 1);
testChunksByLength(1);
testChunksByLength(0);
testChunksByLength(1e6, 1);

test('Object Mode', function(t){
    t.plan(7);

    var testName = 'Object mode';
    var midStats = stats.obj(testName,{store:1});
    var objects = [{a:1}, {b:2}, {c:3}, {d:4}, {e:5}];
    var stringified = objects.map(function(v){return JSON.stringify(v)}).join('');
     
    t.ok(isStream(midStats),'Stats returns a stream');

    var pipeline = midStats.sink();

    t.ok(isStream.isWritable(pipeline) && !isStream.isReadable(pipeline), 
          'The final stream in the pipeline is a sink');

    midStats.on('end',function(){

      var statObj = stats.getResults(testName);
      t.ok(midStats._obj, 'Object mode flag is set');
      t.ok(midStats._store, 'Store flag is set');
      t.equal(statObj.chunkCount, statObj.chunks.length, 'Chunk count set properly');
      t.equal(statObj.chunkCount, statObj.len, 'Each chunk is an object');
      t.equal(statObj.store, stringified, 'Object Store is valid');
    });

    objects.forEach(function(v,i){
      if(i < objects.length - 1) midStats.write(v);
      else midStats.end(v);
    })
});

var PassThrough = require('readable-stream/passthrough');
var inherits = require('inherits');

inherits(StatStream, PassThrough);

StatStream.prototype._transform = function(chunk, enc, cb){
  if(!this.initialTime){this.initialTime = process.hrtime();

  var time = this.getTime() ;

  var statObj = {
     
  } 
  console.log("\nCHUNK TYPE: %s", Buffer.isBuffer(chunk) && "Buffer" || typeof chunk);
  console.log(chunk);
  console.log("\n");
  cb();
}

StatStream.prototype._flush = function(cb){
  this.stats.chunkCount = chunks.length;
  this.stats.time = this.getTime(); 
  cb();
}

StatStream.prototype._getTime(){
  var diff = process.hrtime(this.initialTime);
  return diff[0]*1000 + diff[1]/1e6;
}

function StatStream(label, obj){
  if(!(this instanceof StatStream)) return new StatStream(label, obj);
  PassThrough.call(this, obj);

  this.stats = {
    label: label,
    chunks: [],
    chunkCount: 0,
    byteCount: 0,
    time: 0
  }

  this.initialTime = null;
  this.lastTime = 0;
  if(obj && obj.store) this.store = 1;

}

module.exports = StatStream;

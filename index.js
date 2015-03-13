var PassThrough = require('readable-stream/passthrough');
var inherits = require('inherits');

var results = {};

inherits(StatStream, PassThrough);

StatStream.prototype._transform = function(chunk, enc, cb){
  if(!this.initialTime) this.initialTime = process.hrtime();
  var time = this._getTime();

  var statObj = {
    time: time - this.lastTime,
    bytes: chunk.length,
    chunk: this.store ? chunk : null  
  }

  this.lastTime = time;

  this.stats.chunks.push(statObj); 
  this.push(chunk);

  cb();
}

StatStream.prototype._flush = function(cb){
  this.stats.chunkCount = this.stats.chunks.length;
  this.stats.time = this._getTime(); 
  this.stats.byteCount = this.stats.chunks.reduce(function(a,b){
    return a + b.bytes;
  }, 0);
  cb();
}

StatStream.prototype._getTime = function(){
  if(this.initialTime === null) return 0;
  var diff = process.hrtime(this.initialTime);
  return diff[0]*1000 + diff[1]/1e6;
}

StatStream.getResults = function(label){
  return results[label];
}

function StatStream(label, obj){
  if(!label) throw new Error("Must provide a label for stats.");
  if(!(this instanceof StatStream)) return new StatStream(label, obj);
  PassThrough.call(this, obj);

  this.stats = {
    label: label,
    chunks: [],
    chunkCount: 0,
    byteCount: 0,
    time: 0
  }

  results[label] = this.stats;

  this.initialTime = null;
  this.lastTime = 0;
  if(obj && obj.store) this.store = 1;

}

module.exports = StatStream;

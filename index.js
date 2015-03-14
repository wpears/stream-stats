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
    chunk: this.stats.store ? chunk : null  
  }

  this.lastTime = time;

  this.stats.chunks.push(statObj); 
  this.push(chunk);

  cb();
}

StatStream.prototype._flush = function(cb){
  if(this.stats.store){
    this.stats.store = Buffer.concat(this.stats.chunks.map(mapChunks));
  }
  this.stats.chunkCount = this.stats.chunks.length;
  this.stats.time = this._getTime(); 
  this.stats.byteCount = this.stats.chunks.reduce(reduceBytes, 0);
  cb();
  }

function mapChunks(v){
  return v.chunk;
}

 function reduceBytes(a,b){
   return a + b.bytes;
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
    time: 0,
    store: null 
  }

  results[label] = this.stats;

  this.initialTime = null;
  this.lastTime = 0;
  if(obj && obj.store) this.stats.store = new Buffer(0);

}

module.exports = StatStream;

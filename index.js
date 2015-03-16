var PassThrough = require('readable-stream/passthrough');
var inherits = require('inherits');

var results = {};
var objMode = {objectMode: true}

inherits(StatStream, PassThrough);

StatStream.prototype._transform = function(chunk, enc, cb){
  if(!this.initialTime) this.initialTime = process.hrtime();
  var time = this._getTime();

  var statObj = {
    time: time - this.lastTime,
    len: this._obj ? 1 : chunk.length,
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
  this.stats.len = this.stats.chunks.reduce(reduceLen, 0);
  cb();
  }

function mapChunks(v){
  return v.chunk;
}

 function reduceLen(a,b){
   return a + b.len;
 } 

StatStream.prototype._getTime = function(){
  if(this.initialTime === null) return 0;
  var diff = process.hrtime(this.initialTime);
  return diff[0]*1000 + diff[1]/1e6;
}

StatStream.getResults = function(label){
  return results[label];
}

StatStream.obj = function(label, obj){
  if(obj) obj.objectMode = true;
  else obj = objMode;
  return new StatStream(label, obj); 
}

function StatStream(label, obj){
  if(!label) throw new Error("Must provide a label for stats.");
  if(!(this instanceof StatStream)) return new StatStream(label, obj);
  PassThrough.call(this, obj);

  if(obj&&obj.objectMode) this._obj = 1;

  this.stats = {
    label: label,
    chunks: [],
    chunkCount: 0,
    len: 0,
    time: 0,
    store: null 
  }

  results[label] = this.stats;

  this.initialTime = null;
  this.lastTime = 0;
  if(obj && obj.store) this.stats.store = new Buffer(0);

}

module.exports = StatStream;

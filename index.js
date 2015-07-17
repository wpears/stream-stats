var PassThrough = require('readable-stream/passthrough');
var Writable = require('readable-stream/writable');
var inherits = require('inherits');

var results = {};
var objMode = {objectMode: true}

inherits(StatStream, PassThrough);


StatStream.prototype._transform = function(chunk, enc, cb){
  if(this.initialTime === null) this.initialTime = process.hrtime();
  var time = this._getTime();
  var currTime = time - this.lastTime;
  var statObj;
  
  if(this._obj){
    statObj = {
      time: currTime,
      len: 1,
      chunk: this._store ? chunk : null
    }
  }else{
    statObj = {
      time: currTime,
      len: chunk.length,
      chunk: this._store ? chunk : null 
    }
  } 

  this.lastTime = time;

  this.stats.chunks.push(statObj); 
  this.push(chunk);

  cb();
}


StatStream.prototype._flush = function(cb){
  var chunks = this.stats.chunks;
  if(this._store){
    if(this._obj) this.stats.store = chunks.map(mapObjChunks).join('');
    else this.stats.store = Buffer.concat(chunks.map(mapChunks))
  }
  this.stats.chunkCount = chunks.length;
  this.stats.time = this._getTime(); 
  this.stats.len = chunks.reduce(reduceLen, 0);
  cb();
}


StatStream.prototype._getTime = function(){
  if(this.initialTime === null) return 0;
  var diff = process.hrtime(this.initialTime);
  return diff[0]*1000 + diff[1]/1e6;
}


StatStream.prototype.sink = function(){
  var sinkStream = new Writable({objectMode: this._obj});
  sinkStream._write = empty;
  this.pipe(sinkStream);
  return this;
}

StatStream.prototype.getResult = function(){
  return this.stats;
} 


function mapObjChunks(v){
  return JSON.stringify(v.chunk);
}

function mapChunks(v){
  return v.chunk;
}

function reduceLen(a,b){
  return a + b.len;
} 

function empty(data,enc,cb){return cb();}


StatStream.getResult = function(label){
  return results[label];
}


StatStream.obj = function(label, obj){
  if(typeof label === 'object'){
    obj = label;
    label = '';
  }
  
  if(obj) obj.objectMode = true;
  else obj = objMode;
  return new StatStream(label, obj); 
}


function StatStream(label, obj){
  if(typeof label === 'object'){
    obj = label;
    label = '';
  }
  if(!label) label = '';
  if(!(this instanceof StatStream)) return new StatStream(label, obj);
  PassThrough.call(this, obj);

  if(obj){
    if(obj.objectMode) this._obj = 1;
    if(obj.store) this._store = 1;
  }

  this.initialTime = null;
  this.lastTime = 0;

  this.stats = {
    label: label,
    chunks: [],
    chunkCount: 0,
    len: 0,
    time: 0,
    store: null 
  }

  if(label) results[label] = this.stats;
}


module.exports = StatStream;

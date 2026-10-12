import assert from 'node:assert/strict';
import {Raster} from '../art/pixel/raster.mjs';
import {decodePng} from '../art/blue/native-format.mjs';
function type(bytes){return bytes[25];}
const small=new Raster(128,64);for(let y=0;y<small.height;y++)for(let x=0;x<small.width;x++){const i=(y*small.width+x)*4,c=(x+y)%5;small.data.set([c*41,255-c*37,c*19,c===0?0:255],i);}
const packed=small.png();assert.equal(type(packed),3);assert.deepEqual(decodePng(packed).data,small.data);
const forced=small.png({indexed:false});assert.equal(type(forced),6);assert.deepEqual(decodePng(forced).data,small.data);
const many=new Raster(257,1);for(let x=0;x<257;x++)many.data.set([x&255,x>>8,17,255],x*4);const fallback=many.png();assert.equal(type(fallback),6);assert.deepEqual(decodePng(fallback).data,many.data);
console.log('Lossless PNG selection checked with transparent palette, forced RGBA and >256-color fallback.');

// Offline native-art format conversion. This module never loads or runs a game.
import { inflateSync, gunzipSync, gzipSync } from 'node:zlib';

export function decodePng(bytes, { transparentIndexZero = false } = {}) {
  if (!bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw Error('Invalid PNG signature.');
  let width=0,height=0,depth=0,type=0,palette=null,transparency=null;
  const compressed=[];
  for(let offset=8;offset<bytes.length;){
    const length=bytes.readUInt32BE(offset),name=bytes.toString('ascii',offset+4,offset+8),data=bytes.subarray(offset+8,offset+8+length);
    if(offset+length+12>bytes.length)throw Error('Truncated PNG chunk.');
    if(name==='IHDR'){
      width=data.readUInt32BE(0);height=data.readUInt32BE(4);depth=data[8];type=data[9];
      if(!width||!height||width>8192||height>8192||data[10]||data[11]||data[12])throw Error('Unsupported PNG dimensions or compression.');
    }else if(name==='PLTE'){
      palette=[];for(let index=0;index<data.length;index+=3)palette.push([data[index],data[index+1],data[index+2]]);
    }else if(name==='tRNS')transparency=data;
    else if(name==='IDAT')compressed.push(data);
    offset+=length+12;
  }
  const channels={0:1,2:3,3:1,4:2,6:4}[type];
  if(!channels||!(type===3?[1,2,4,8].includes(depth):depth===8))throw Error('Unsupported native PNG color format.');
  if(type===3&&!palette)throw Error('Indexed PNG has no palette.');
  const stride=Math.ceil(width*channels*depth/8),bpp=Math.max(1,Math.ceil(channels*depth/8));
  const raw=inflateSync(Buffer.concat(compressed),{maxOutputLength:(stride+1)*height});
  if(raw.length!==(stride+1)*height)throw Error('PNG data length mismatch.');
  const unfiltered=Buffer.alloc(stride*height);
  for(let y=0;y<height;y++){
    const filter=raw[y*(stride+1)];if(filter>4)throw Error('Unsupported PNG row filter.');
    for(let x=0;x<stride;x++){
      const left=x>=bpp?unfiltered[y*stride+x-bpp]:0,above=y?unfiltered[(y-1)*stride+x]:0,upperLeft=y&&x>=bpp?unfiltered[(y-1)*stride+x-bpp]:0;
      let prediction=0;
      if(filter===1)prediction=left;
      else if(filter===2)prediction=above;
      else if(filter===3)prediction=Math.floor((left+above)/2);
      else if(filter===4){const p=left+above-upperLeft,a=Math.abs(p-left),b=Math.abs(p-above),c=Math.abs(p-upperLeft);prediction=a<=b&&a<=c?left:b<=c?above:upperLeft;}
      unfiltered[y*stride+x]=(raw[y*(stride+1)+x+1]+prediction)&255;
    }
  }
  const data=Buffer.alloc(width*height*4),indices=type===3?new Uint8Array(width*height):null;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const target=(y*width+x)*4,source=y*stride+x*channels;
    if(type===3){
      const bit=x*depth,index=(unfiltered[y*stride+(bit>>3)]>>(8-depth-bit%8))&((1<<depth)-1),color=palette[index];
      if(!color)throw Error('PNG palette index is out of bounds.');
      indices[y*width+x]=index;data[target]=color[0];data[target+1]=color[1];data[target+2]=color[2];data[target+3]=transparentIndexZero&&index===0?0:transparency?.[index]??255;
    }else if(type===2||type===6){
      data[target]=unfiltered[source];data[target+1]=unfiltered[source+1];data[target+2]=unfiltered[source+2];data[target+3]=type===6?unfiltered[source+3]:255;
    }else{
      data[target]=data[target+1]=data[target+2]=unfiltered[source];data[target+3]=type===4?unfiltered[source+1]:255;
    }
  }
  return{width,height,data,indices,palette};
}

/** Reproduce the DS display bit expansion seen in the archived Blue press PNGs. */
export function blueChannel(value){const five=value>>3;return(five<<3)|(five>>3);}

export function readTarGzip(bytes){
  const archive=gunzipSync(bytes,{maxOutputLength:64*1024*1024}),files=new Map();
  for(let offset=0;offset+512<=archive.length;){
    const header=archive.subarray(offset,offset+512);if(header.every(value=>value===0))break;
    const name=header.toString('utf8',0,100).replace(/\0.*$/s,''),size=parseInt(header.toString('ascii',124,136).replace(/\0.*$/s,'').trim(),8),kind=header[156];
    if(!/^[A-Za-z0-9_./-]+$/.test(name)||name.startsWith('/')||name.split('/').includes('..')||files.has(name)||![0,48].includes(kind)||!Number.isSafeInteger(size)||size<0||offset+512+size>archive.length)throw Error('Unsafe or malformed native source archive.');
    files.set(name,archive.subarray(offset+512,offset+512+size));offset+=512+Math.ceil(size/512)*512;
  }
  return files;
}

export function writeTarGzip(files){
  const chunks=[];
  for(const[name,data]of [...files].sort(([left],[right])=>left.localeCompare(right))){
    if(Buffer.byteLength(name)>99||!/^[A-Za-z0-9_./-]+$/.test(name)||name.startsWith('/')||name.split('/').includes('..'))throw Error('Unsafe archive member name.');
    const header=Buffer.alloc(512);header.write(name);header.write('0000644\0',100);header.write('0000000\0',108);header.write('0000000\0',116);header.write(data.length.toString(8).padStart(11,'0')+'\0',124);header.write('00000000000\0',136);header.fill(32,148,156);header[156]=48;header.write('ustar\0',257);header.write('00',263);
    const sum=header.reduce((total,value)=>total+value,0);header.write(sum.toString(8).padStart(6,'0')+'\0 ',148);
    chunks.push(header,data,Buffer.alloc((512-data.length%512)%512));
  }
  chunks.push(Buffer.alloc(1024));return gzipSync(Buffer.concat(chunks),{level:9});
}

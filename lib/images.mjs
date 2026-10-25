// Accept bounded JPEG/PNG files only. Strip EXIF, comments, and PNG text/location chunks.
export function sanitizeImage(value) {
  const m=typeof value==='string' && value.match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!m) throw new Error('Choose a JPEG or PNG image.');
  const b=Buffer.from(m[2],'base64');
  if(b.length>2*1024*1024 || b.length<24) throw new Error('Use an image smaller than 2 MB.');
  if(m[1]==='png') {
    if(b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a') throw new Error('This PNG could not be read.');
    let p=8, foundHeader=false, foundEnd=false; const parts=[b.subarray(0,8)];
    while(p+12<=b.length) {
      const len=b.readUInt32BE(p), type=b.toString('ascii',p+4,p+8);
      if(len>b.length || p+12+len>b.length) throw new Error('This PNG is incomplete.');
      if(type==='IHDR') { if(len!==13) throw new Error('Invalid image header.'); checkSize(b.readUInt32BE(p+8),b.readUInt32BE(p+12));foundHeader=true; }
      if(!['eXIf','tEXt','iTXt','zTXt'].includes(type)) parts.push(b.subarray(p,p+12+len));
      p+=12+len;
      if(type==='IEND') { foundEnd=true;break; }
    }
    if(!foundHeader||!foundEnd) throw new Error('This PNG is incomplete.');
    return { mime:'image/png', bytes:Buffer.concat(parts) };
  }
  if(b[0]!==255||b[1]!==216||b.at(-2)!==255||b.at(-1)!==217) throw new Error('This JPEG could not be read.');
  const parts=[b.subarray(0,2)]; let p=2, sized=false, scanned=false;
  while(p+4<=b.length) {
    if(b[p]!==255) throw new Error('Invalid JPEG structure.');
    const marker=b[p+1];
    if(marker===0xda) { parts.push(b.subarray(p));scanned=true;break; }
    const len=b.readUInt16BE(p+2);
    if(len<2||p+2+len>b.length) throw new Error('This JPEG is incomplete.');
    if([0xc0,0xc1,0xc2].includes(marker)) { checkSize(b.readUInt16BE(p+7),b.readUInt16BE(p+5));sized=true; }
    if(marker!==0xe1 && marker!==0xfe && !(marker>=0xe3&&marker<=0xef)) parts.push(b.subarray(p,p+2+len));
    p+=2+len;
  }
  if(!sized||!scanned) throw new Error('This JPEG could not be read.');
  return { mime:'image/jpeg', bytes:Buffer.concat(parts) };
}
function checkSize(w,h) { if(!w||!h||w>4096||h>4096||w*h>16000000) throw new Error('Resize the photo to at most 4096 pixels per side.'); }

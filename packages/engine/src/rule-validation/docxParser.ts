import * as zlib from 'zlib';

export function extractTextFromDocx(buffer: Buffer): string {
  let offset = 0;
  while (offset < buffer.length - 30) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) {
      offset++;
      continue;
    }
    
    const compressionMethod = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraFieldLength = buffer.readUInt16LE(offset + 28);
    
    if (offset + 30 + fileNameLength > buffer.length) {
      break;
    }
    
    const fileName = buffer.toString('utf8', offset + 30, offset + 30 + fileNameLength);
    const dataOffset = offset + 30 + fileNameLength + extraFieldLength;
    
    if (fileName === 'word/document.xml') {
      if (dataOffset + compressedSize > buffer.length) {
        break;
      }
      const compressedData = buffer.subarray(dataOffset, dataOffset + compressedSize);
      let xmlContent = '';
      try {
        if (compressionMethod === 8) {
          xmlContent = zlib.inflateRawSync(compressedData).toString('utf8');
        } else if (compressionMethod === 0) {
          xmlContent = compressedData.toString('utf8');
        } else {
          continue;
        }
      } catch (err) {
        console.error('QAMate Docx Inflation Error:', err);
        return '';
      }
      
      const paragraphMatches = xmlContent.match(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g);
      if (paragraphMatches) {
        return paragraphMatches.map(p => {
          const tMatches = p.match(/<w:t\b[^>]*>([^<]*)<\/w:t>/g);
          if (tMatches) {
            return tMatches.map(t => {
              const textVal = t.match(/<w:t\b[^>]*>([^<]*)<\/w:t>/);
              return textVal ? textVal[1] : '';
            }).join('');
          }
          return '';
        }).join('\n');
      }
      
      const textMatches = xmlContent.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
      if (textMatches) {
        return textMatches.map(t => t.replace(/<[^>]+>/g, '')).join(' ');
      }
      return '';
    }
    
    offset = dataOffset + compressedSize;
  }
  return '';
}

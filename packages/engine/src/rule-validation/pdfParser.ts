import * as zlib from 'zlib';

export function extractTextFromPdf(buffer: Buffer): string {
  const content = buffer.toString('binary');
  const streams: { start: number; end: number }[] = [];
  
  let searchPos = 0;
  while (true) {
    const streamStartIdx = content.indexOf('stream', searchPos);
    if (streamStartIdx === -1) break;
    
    let dataStart = streamStartIdx + 6;
    if (content.charCodeAt(dataStart) === 13 && content.charCodeAt(dataStart + 1) === 10) {
      dataStart += 2;
    } else if (content.charCodeAt(dataStart) === 10) {
      dataStart += 1;
    }
    
    const streamEndIdx = content.indexOf('endstream', dataStart);
    if (streamEndIdx === -1) break;
    
    const dictStart = Math.max(0, streamStartIdx - 200);
    const precedingDict = content.substring(dictStart, streamStartIdx);
    
    if (precedingDict.includes('/FlateDecode') || precedingDict.includes('/Length')) {
      streams.push({ start: dataStart, end: streamEndIdx });
    }
    searchPos = streamEndIdx + 9;
  }
  
  let extractedText = '';
  for (const str of streams) {
    const streamBytes = buffer.subarray(str.start, str.end);
    try {
      const decompressed = zlib.inflateSync(streamBytes).toString('utf8');
      
      const tjMatches = decompressed.match(/\(([^)]*)\)\s*T[jJ]/g);
      if (tjMatches) {
        extractedText += tjMatches.map(m => {
          const run = m.match(/\(([^)]*)\)/);
          return run ? cleanPdfString(run[1]) : '';
        }).join(' ') + '\n';
      }
      
      const tjArrayMatches = decompressed.match(/\[([\s\S]*?)\]\s*TJ/g);
      if (tjArrayMatches) {
        extractedText += tjArrayMatches.map(m => {
          const inner = m.match(/\[([\s\S]*?)\]/);
          if (!inner) return '';
          const runs = inner[1].match(/\(([^)]*)\)/g);
          return runs ? runs.map(r => cleanPdfString(r.slice(1, -1))).join('') : '';
        }).join(' ') + '\n';
      }
    } catch {
      // ignore
    }
  }
  
  if (extractedText.trim().length === 0) {
    const rawTextParts = content.match(/\(([^)]+)\)/g);
    if (rawTextParts && rawTextParts.length > 5) {
      extractedText = rawTextParts
        .map(t => cleanPdfString(t.slice(1, -1)))
        .filter(t => t.length > 2 && /^[a-zA-Z0-9\s.,;:'"?!()\-–—_]+$/.test(t))
        .join(' ');
    }
  }
  
  return extractedText;
}

function cleanPdfString(str: string): string {
  return str
    .replace(/\\([0-7]{3})/g, (m, octal) => String.fromCharCode(parseInt(octal, 8)))
    .replace(/\\r/g, '\r')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .trim();
}

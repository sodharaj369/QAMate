import { describe, it, expect } from 'vitest';
import * as zlib from 'zlib';
import { extractTextFromDocx } from '../src/rule-validation/docxParser.js';
import { extractTextFromPdf } from '../src/rule-validation/pdfParser.js';

function buildMockDocx(contentXml: string): Buffer {
  const fileBytes = Buffer.from(contentXml, 'utf8');
  const fileNameBytes = Buffer.from('word/document.xml', 'utf8');
  
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0); // PK\x03\x04
  header.writeUInt16LE(10, 4); // version
  header.writeUInt16LE(0, 6); // flags
  header.writeUInt16LE(0, 8); // compression method (STORED)
  header.writeUInt16LE(0, 10); // time
  header.writeUInt16LE(0, 12); // date
  header.writeUInt32LE(0, 14); // crc (ignored)
  header.writeUInt32LE(fileBytes.length, 18); // compressed size
  header.writeUInt32LE(fileBytes.length, 22); // uncompressed size
  header.writeUInt16LE(fileNameBytes.length, 26); // file name length
  header.writeUInt16LE(0, 28); // extra field length
  
  return Buffer.concat([header, fileNameBytes, fileBytes]);
}

function buildMockPdf(text: string, useFlate: boolean): Buffer {
  if (useFlate) {
    const streamContent = `BT /F1 12 Tf 50 700 Td (${text}) Tj ET`;
    const compressed = zlib.deflateSync(Buffer.from(streamContent, 'utf8'));
    const streamHeader = `/Filter /FlateDecode /Length ${compressed.length}\nstream\n`;
    const streamFooter = '\nendstream';
    return Buffer.concat([
      Buffer.from(streamHeader, 'binary'),
      compressed,
      Buffer.from(streamFooter, 'binary')
    ]);
  } else {
    return Buffer.from(`stream\n(${text}) Tj\n(line 2) Tj\n(line 3) Tj\n(line 4) Tj\n(line 5) Tj\n(line 6) Tj\nendstream`, 'utf8');
  }
}

describe('Document Extractor Tests', () => {
  it('should parse text from a valid stored DOCX XML stream', () => {
    const mockXml = `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p>
          <w:r>
            <w:t>Hello, this is a mock DOCX requirement specification.</w:t>
          </w:r>
        </w:p>
        <w:p>
          <w:r>
            <w:t>Another paragraph here.</w:t>
          </w:r>
        </w:p>
      </w:body>
    </w:document>`;
    
    const buffer = buildMockDocx(mockXml);
    const result = extractTextFromDocx(buffer);
    expect(result).toContain('Hello, this is a mock DOCX requirement specification.');
    expect(result).toContain('Another paragraph here.');
    expect(result).toContain('\n');
  });

  it('should parse text from a FlateDecoded PDF stream', () => {
    const text = 'Business Rule validation engine constraint check';
    const buffer = buildMockPdf(text, true);
    const result = extractTextFromPdf(buffer);
    expect(result).toContain(text);
  });

  it('should parse text from a raw PDF content fallback', () => {
    const text = 'Fallback text rule VAL-006 warning';
    const buffer = buildMockPdf(text, false);
    const result = extractTextFromPdf(buffer);
    expect(result).toContain(text);
  });
});

import { extractTextFromPdf } from './packages/engine/dist/rule-validation/pdfParser.js';

const text = 'Fallback text rule VAL-006 warning';
const buffer = Buffer.from(`stream\n(${text}) Tj\nendstream`, 'utf8');

const content = buffer.toString('binary');
console.log('content:', content);
const rawTextParts = content.match(/\(([^)]+)\)/g);
console.log('rawTextParts:', rawTextParts);
if (rawTextParts) {
  const parts = rawTextParts.map(t => {
    const cleaned = t.slice(1, -1);
    const resolved = cleaned
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
    console.log(`cleaned: "${cleaned}", resolved: "${resolved}"`);
    const regex = /^[a-zA-Z0-9\s.,;:'"?!()\-–—_]+$/;
    console.log('test:', regex.test(resolved));
    return resolved;
  });
}

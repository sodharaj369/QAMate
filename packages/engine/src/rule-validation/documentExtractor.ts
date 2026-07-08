import * as fs from 'fs';
import * as path from 'path';
import { extractTextFromDocx } from './docxParser.js';
import { extractTextFromPdf } from './pdfParser.js';

export interface IDocumentExtractor {
  extractText(filePath: string): Promise<string>;
}

export class DefaultDocumentExtractor implements IDocumentExtractor {
  public async extractText(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
      }
      
      const buffer = fs.readFileSync(filePath);
      
      if (ext === '.docx') {
        return extractTextFromDocx(buffer);
      }
      
      if (ext === '.pdf') {
        return extractTextFromPdf(buffer);
      }
      
      if (ext === '.md' || ext === '.txt' || ext === '.json' || ext === '.feature') {
        return buffer.toString('utf8');
      }
      
      throw new Error(`Unsupported file extension: ${ext}`);
    } catch (err: any) {
      throw new Error(`Failed to extract text from ${path.basename(filePath)}: ${err.message}`);
    }
  }
}

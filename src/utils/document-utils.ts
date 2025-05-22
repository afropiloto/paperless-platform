import * as crypto from 'crypto';
import * as pdfParse from 'pdf-parse';

export function isValidDataUrl(dataUrl: string): boolean {
  const dataUrlPattern = /^data:([a-zA-Z]+\/[a-zA-Z0-9+.-]+)?(;[a-zA-Z-]+=[a-zA-Z0-9-]+)*(;base64)?,([a-zA-Z0-9!$&',()*+;=\-._~:@/?%\s]*?)$/;
  return dataUrlPattern.test(dataUrl);
}

export function fileToDataUrl(file: Express.Multer.File): string {
  const fileBuffer = file.buffer;
  const base64 = fileBuffer.toString('base64');

  return `data:${file.mimetype};base64,${base64}`;
}

export function fileBufferToDataUrl(fileBuffer: Buffer, mimeType: string): string {
  const base64 = fileBuffer.toString('base64');

  return `data:${mimeType};base64,${base64}`;
}


export function computeDocumentHashFromDataUrl(dataUrl: string): string {
  try {
    // Parse the data URL to extract the base64-encoded data
    // Data URLs have the format: data:[<mediatype>][;base64],<data>
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

    if (!matches || matches.length !== 3) {
      throw new Error('Invalid data URL format');
    }

    // Extract the base64 data portion
    const base64Data = matches[2];

    // Convert base64 to binary data
    const binaryData = Buffer.from(base64Data, 'base64');

    // Create SHA-256 hash from the binary data
    const hash = crypto.createHash('sha256');
    hash.update(binaryData);

    // Return the hash as a hexadecimal string
    return hash.digest('hex');
  } catch (error) {
    console.error('Error hashing data URL:', error);
    throw error;
  };
}


export async function extractDocumentTrackingId(dataUrl: string): Promise<string> {
  // Extract the base64 data from the data URL
  const base64Data = dataUrl.split(",")[1];
  if (!base64Data) {
    console.error("Invalid data URL format");
    throw new Error('Invalid data URL format');
  }
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");

    // Extract text from PDF using the direct module
    const options = {
      max: 1, // Only parse the first page
      pagerender: null // Default render callback
    };
    const data = await pdfParse(buffer, options);

    const pdfText = data.text;


    // Look for the document ID in the text content
    const documentIdMatch = pdfText.match(/Document Tracking ID: ([a-f0-9-]+)/);
    return documentIdMatch ? documentIdMatch[1] : null
  } catch (error) {
    throw new Error(`Failed to extract Document Tracking ID. ${error.message}`);
  }
}
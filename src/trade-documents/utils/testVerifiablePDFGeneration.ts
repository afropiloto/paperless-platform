import { generateQRCode, generateVerifiablePDF } from './document-generation';
import path from 'path';
import fs from 'fs/promises';
import { Logger } from '@nestjs/common';

const logger = new Logger('testVerifiablePDFGeneration');

async function convertFileToDataUrl(filePath: string): Promise<string> {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const mimeType = getMimeType(filePath);
    const base64Data = fileBuffer.toString('base64');
    return `data:${mimeType};base64,${base64Data}`;
  } catch (error) {
    logger.error('Error converting file to data URL:', error);
    throw error;
  }
}

function getMimeType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case '.pdf':
      return 'application/pdf';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.txt':
      return 'text/plain';
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
}

async function testVerifiablePDFGeneration(
  sourceFilePath: string,
  accountName: string,
  documentTrackingId: string,
  qrCodeContent: string,
  outputDir: string = 'test-output'
): Promise<void> {
  try {
    // Create output directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });

    // Convert source file to data URL
    const dataUrl = await convertFileToDataUrl(sourceFilePath);

    // Generate QR code
    const qrCode = await generateQRCode(qrCodeContent);

    // Generate verifiable PDF
    const verifiablePdfBytes = await generateVerifiablePDF(
      dataUrl,
      accountName,
      documentTrackingId,
      qrCode
    );

    // Save the verifiable PDF
    const outputFileName = `verifiable_${path.basename(sourceFilePath)}`;
    const outputPath = path.join(outputDir, outputFileName);
    await fs.writeFile(outputPath, verifiablePdfBytes);

  } catch (error) {
    logger.error('Error in test harness:', error);
    throw error;
  }
}

// Example usage
async function main() {
  const sourceFilePath = process.argv[2] || "C:/Users/billm/Downloads/invoice_example.pdf";
  const accountName = process.argv[3] || 'Target Testing Ltd';
  const documentTrackingId = process.argv[4] || 'c029432d-1c07-4b4b-b609-7a7eabc90dda';
  const outputDir = process.argv[5] || 'test-output';
  const qrCodeContent = process.argv[6] || 'https://ai.paiperless.com/verify/c029432d-1c07-4b4b-b609-7a7eabc90dda';

  if (!sourceFilePath || !accountName || !documentTrackingId) {
    console.log('Usage: ts-node testVerifiablePDF.ts <sourceFilePath> <accountName> <documentTrackingId> [outputDir]');
    process.exit(1);
  }

  try {
    await testVerifiablePDFGeneration(
      sourceFilePath,
      accountName,
      documentTrackingId,
      qrCodeContent,
      outputDir
    );
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  main();
}

export { testVerifiablePDFGeneration }; 
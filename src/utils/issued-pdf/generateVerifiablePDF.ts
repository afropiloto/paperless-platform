import { PDFDocument, PDFImage, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import path from 'path';
import fs from 'fs/promises';
import { Logger } from '@nestjs/common';
import { FileData } from 'src/types/trade-documents.types';

export async function generateVerifiablePDF(
  sourceFile: FileData,
  accountName: string,
  issueDate: Date,
  documentTrackingId: string,
  qrCode: Uint8Array,
) {
  const logger = new Logger(generateVerifiablePDF.name);

  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();

    // Define header and footer dimensions
    const headerHeight = 75; // Reduced header height
    const footerHeight = 50;
    const contentHeight = height - headerHeight - footerHeight;

    // Load and embed the logo
    const logoPath = path.join(
      process.cwd(),
      'public',
      'paiperless-logo-horizontal.png',
    );
    const logoBytes = await fs.readFile(logoPath);
    const logo = await pdfDoc.embedPng(logoBytes);

    // Calculate logo dimensions (maintain aspect ratio)
    const logoWidth = 150; // Reduced logo width
    const logoHeight = (logo.height * logoWidth) / logo.width;

    // Embed QR code
    const qrCodeImage = await pdfDoc.embedPng(qrCode);
    const qrSize = 80; // Reduced QR code size

    // Process the data URL
    const binaryData = sourceFile.buffer;

    // Check if the data URL is a PDF
    if (sourceFile.mimetype === 'application/pdf') {
      const existingPdfDoc = await PDFDocument.load(binaryData);
      const existingPages = await pdfDoc.copyPages(
        existingPdfDoc,
        existingPdfDoc.getPageIndices(),
      );

      // Remove the initial page we created
      pdfDoc.removePage(0);
      // Add each page from the existing PDF with proper scaling
      for (let i = 0; i < existingPages.length; i++) {
        const existingPage = existingPages[i];
        const newPage = pdfDoc.addPage();
        const { width: pageWidth, height: pageHeight } = newPage.getSize();

        // Embed the existing page
        const embeddedPage = await pdfDoc.embedPdf(existingPdfDoc, [i]);
        const embeddedPageObj = embeddedPage[0];

        // Calculate scaling factor to fit content within available space
        const scaleX = (pageWidth - 80) / embeddedPageObj.width;
        const scaleY = (contentHeight - 80) / embeddedPageObj.height;
        const scale = Math.min(scaleX, scaleY);

        // Calculate centered position
        const scaledWidth = embeddedPageObj.width * scale;
        const scaledHeight = embeddedPageObj.height * scale;
        const x = (pageWidth - scaledWidth) / 2;
        const y = (contentHeight - scaledHeight) / 2 + footerHeight;

        // Draw the existing page content with scaling and positioning
        newPage.drawPage(embeddedPageObj, {
          x,
          y,
          width: scaledWidth,
          height: scaledHeight,
        });

        // Add header and footer to each page
        await addHeaderAndFooter(
          newPage,
          accountName,
          issueDate,
          documentTrackingId,
          qrCodeImage,
          logo,
        );
      }
    } else {
      // Handle non-PDF content (images, text, etc.)
      const { width: pageWidth, height: pageHeight } = page.getSize();

      if (sourceFile.mimetype.startsWith('image')) {
        // Handle image content
        const imageType = sourceFile.mimetype.split('/')[1];
        let image;

        switch (imageType) {
          case 'jpeg':
          case 'jpg':
            image = await pdfDoc.embedJpg(binaryData);
            break;
          case 'png':
            image = await pdfDoc.embedPng(binaryData);
            break;
          default:
            throw new Error(`Unsupported image type: ${imageType}`);
        }

        // Calculate scaling factor to fit image within available space
        const scaleX = (pageWidth - 100) / image.width;
        const scaleY = (contentHeight - 100) / image.height;
        const scale = Math.min(scaleX, scaleY);

        // Calculate centered position
        const scaledWidth = image.width * scale;
        const scaledHeight = image.height * scale;
        const x = (pageWidth - scaledWidth) / 2;
        const y = (contentHeight - scaledHeight) / 2 + footerHeight;

        // Draw the image with scaling and positioning
        page.drawImage(image, {
          x,
          y,
          width: scaledWidth,
          height: scaledHeight,
        });
      } else if (sourceFile.mimetype.startsWith('text')) {
        // Handle text content
        const text = Buffer.from(binaryData).toString('utf-8');
        const textFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Calculate text dimensions and position
        const fontSize = 12;
        const lineHeight = fontSize * 1.2;
        const maxWidth = pageWidth - 100;
        const maxHeight = contentHeight - 100;

        // Split text into lines that fit within maxWidth
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = textFont.widthOfTextAtSize(testLine, fontSize);

          if (testWidth <= maxWidth) {
            currentLine = testLine;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        }
        if (currentLine) {
          lines.push(currentLine);
        }

        // Draw text lines
        let y = pageHeight - headerHeight - 50; // Start below header
        for (const line of lines) {
          if (y < footerHeight + 50) break; // Stop if we reach footer area

          const textWidth = textFont.widthOfTextAtSize(line, fontSize);
          const x = (pageWidth - textWidth) / 2;

          page.drawText(line, {
            x,
            y,
            size: fontSize,
            font: textFont,
            color: rgb(0, 0, 0),
          });

          y -= lineHeight;
        }
      } else {
        throw new Error(`Unsupported content type: ${sourceFile.mimetype}`);
      }

      // Add header and footer to the first page
      await addHeaderAndFooter(
        page,
        accountName,
        issueDate,
        documentTrackingId,
        qrCodeImage,
        logo,
      );
    }

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    return {
      buffer: pdfBytes,
      originalname: sourceFile.originalname,
      mimetype: 'application/pdf',
      size: pdfBytes.length,
    } as FileData
    
  } catch (error) {
    logger.error('Error generating verifiable PDF:', error);
    throw error;
  }
}

async function addHeaderAndFooter(
  page: PDFPage,
  accountName: string,
  issueDate: Date,
  documentTrackingId: string,
  qrCodeImage: PDFImage,
  logo: PDFImage,
): Promise<void> {
  const { width, height } = page.getSize();
  const smallFont = await page.doc.embedFont(StandardFonts.Helvetica);

  // Calculate column widths
  const columnWidth = width / 3;
  const startY = height - 20; // Start 20 points from top
  const logoWidth = 150;
  const logoHeight = (logo.height * logoWidth) / logo.width;
  const qrSize = 75;

  // Column 1: Logo and "Issued by" text
  page.drawImage(logo, {
    x: 50,
    y: startY - logoHeight,
    width: logoWidth,
    height: logoHeight,
  });

  page.drawText('Verifiable on Paiperless', {
    x: 50,
    y: startY - logoHeight - 15,
    size: 8,
    font: smallFont,
    color: rgb(0, 0, 0),
  });

  // Column 2: Company name and issue date
  const centerX = columnWidth + columnWidth / 2;
  page.drawText(`Issued by: ${accountName}`, {
    x: centerX - 50,
    y: startY - 20,
    size: 8,
    font: smallFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Issued on: ${issueDate.toLocaleString()}`, {
    x: centerX - 50,
    y: startY - 35,
    size: 8,
    font: smallFont,
    color: rgb(0, 0, 0),
  });

  // Column 3: QR code
  page.drawImage(qrCodeImage, {
    x: width - qrSize - 50,
    y: startY - qrSize,
    width: qrSize,
    height: qrSize,
  });

  // Add footer
  page.drawText(`Document Tracking ID: ${documentTrackingId}`, {
    x: 50,
    y: 30,
    size: 8,
    font: smallFont,
    color: rgb(0, 0, 0),
  });
}
import QRCode from "qrcode";
import {PDFDocument, PDFImage, rgb, StandardFonts} from "pdf-lib";
import crypto from 'crypto';
/*
  Set of functions to generate trade documents for issuing
 */


async function generateQRCode(documentTrackingUrl: string, width: number): Promise<string> {
  const qrCodeDataUrl = QRCode.toDataURL(documentTrackingUrl, {
    width: width,
    margin: 0
  });
  return qrCodeDataUrl.split(",")[1];
}


export interface HeaderConfiguration {
  qrCodeWidth: number;
  fontSize: number;
}

async function generateVerifiablePDF(tradeDocumentDataUrl: string, accountName: string, documentTrackingId: string, qrCode: any, fileType: string, headerConfiguration: HeaderConfiguration) {
  // Extract the base64 data from the dataurl
  const base64Data = tradeDocumentDataUrl.split(",")[1];
  const buffer = Buffer.from(base64Data, "base64");

  const currentDate = new Date().toLocaleString();
  const headerText = `Issued by Voy Finance via Paiperless`;
  const registeredByText = `Registered by: ${accountName}`
  const dateText = `Date: ${currentDate}`;
  const footerText = `Document Tracking ID: ${documentTrackingId}`;
  let pdfDoc: PDFDocument;

  const addHeaderWithQR = async (page: any) => {
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const qrCodeImage = await pdfDoc.embedPng(Buffer.from(qrCode, "base64"));
    const qrDimensions = headerConfiguration.qrCodeWidth;

    // Draw text on the left
    const pageWidth = page.getWidth()
    const pageHeight = page.getHeight()
    const headerSectionWidth = pageWidth / 4

    page.drawText(headerText, {
      x: 50,
      y: pageHeight - 20,
      size: headerConfiguration.fontSize,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    page.drawText(registeredByText, {
      // x: 50 + headerSectionWidth,
      // y: pageHeight - 40,
      x: 50,
      y: pageHeight - 40,
      size: headerConfiguration.fontSize,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    page.drawText(dateText, {
      // x: 50 + (headerSectionWidth * 2),
      // y: pageHeight - 40,
      x: 50,
      y: pageHeight - 60,
      size: headerConfiguration.fontSize,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Draw QR code on the right
    page.drawImage(qrCodeImage, {
      x: pageWidth - qrDimensions - 50,
      y: pageHeight - qrDimensions - 20,
      width: qrDimensions,
      height: qrDimensions,
    });

    // Draw footer with document ID at the bottom of the page
    page.drawText(footerText, {
      x: 50,
      y: 30,
      size: headerConfiguration.fontSize,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });
  };

  if (fileType === "application/pdf") {
    // ToDo: Need to test this out with different Documents - may need to convert pages into images, scale and insert
    //  these to ensure the Paiperless header doesn't overwrite the original document headers.
    // If it's already a PDF, load it and add headers
    pdfDoc = await PDFDocument.load(buffer);

    // Add header to each page
    const pages = pdfDoc.getPages();
    for (const page of pages) {
      await addHeaderWithQR(page);
    }
  } else if (fileType.startsWith("image/")) {
    // Create a new PDF and embed the image
    pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // US Letter size

    // Add header with QR code
    await addHeaderWithQR(page);

    let image: PDFImage;
    if (fileType === "image/jpeg") {
      image = await pdfDoc.embedJpg(buffer);
    } else if (fileType === "image/png") {
      image = await pdfDoc.embedPng(buffer);
    } else {
      throw new Error("Unsupported image format");
    }

    const { width, height } = image.scale(1);
    const aspectRatio = width / height;

    // Calculate dimensions to fit the page while maintaining aspect ratio
    const maxWidth = 500;
    const maxHeight = 620;
    let drawWidth = maxWidth;
    let drawHeight = drawWidth / aspectRatio;

    if (drawHeight > maxHeight) {
      drawHeight = maxHeight;
      drawWidth = drawHeight * aspectRatio;
    }

    // Center the image on the page
    const x = (page.getWidth() - drawWidth) / 2;
    const y = (page.getHeight() - drawHeight - 80) / 2;

    page.drawImage(image, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  } else if (fileType === "text/plain") {
    // Create a new PDF with the text content
    pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const text = buffer.toString("utf-8");

    // Add header with QR code
    await addHeaderWithQR(page);

    // Draw the text content below the header
    page.drawText(text, {
      x: 50,
      y: page.getHeight() - 100,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0),
      lineHeight: 16,
      maxWidth: page.getWidth() - 100,
    });
  } else {
    throw new Error("Unsupported file type");
  }

  // Save the PDF to a buffer
  const pdfBytes = await pdfDoc.save();

  // Convert to base64 and create data URL
  return `data:application/pdf;base64,${Buffer.from(pdfBytes).toString("base64")}`
}


const computeVerifiableHash = (dataUrl: string) => {
  return crypto.createHash("sha256").update(dataUrl.replace(/(\r\n|\r|\n)/g, "")).digest("hex")
}

export interface VerifiableTradeDocument {
  dataUrl: string;
  documentHash: string;
}
export async function generateVerifiableDocument(documentTrackingId: string, accountName: string, fileType: string, dataUrl: string,headerConfiguration: HeaderConfiguration) {

  // Generate QR code
  const qrCodeBase64 = await generateQRCode(documentTrackingId, headerConfiguration.qrCodeWidth);


  // Embed verification information and document into new PDF
  const verifiableDataUrl = await generateVerifiablePDF(dataUrl, accountName, documentTrackingId, qrCodeBase64, fileType, headerConfiguration)

  // Compute Hash
  const documentHash = computeVerifiableHash(verifiableDataUrl)

  return {dataUrl:verifiableDataUrl, documentHash} as VerifiableTradeDocument;

}
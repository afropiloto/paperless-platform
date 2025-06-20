import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PromissoryNote } from './types/promissory-note.interface';

@Injectable()
export class PromissoryNotePdfService {
  private readonly logger = new Logger(PromissoryNotePdfService.name);

  private formatDate(date: Date): string {
    try {
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return date.toLocaleDateString();
    } catch (error) {
      this.logger.error(`Failed to format date: ${error.message}`);
      return 'Invalid Date';
    }
  }

  async generatePromissoryNotePdf(promissoryNote: PromissoryNote): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
        });

        // Collect PDF chunks
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Add title
        doc.fontSize(20)
           .text('PROMISSORY NOTE', { align: 'center' })
           .moveDown(2);

        // Add date
        doc.fontSize(12)
           .text(`Date: ${this.formatDate(promissoryNote.issueDate)}`)
           .moveDown();

        // Add parties
        doc.text('BORROWER:')
           .moveDown(0.5)
           .text(promissoryNote.borrower.name)
           .text(promissoryNote.borrower.address)
           .moveDown();

        doc.text('LENDER:')
           .moveDown(0.5)
           .text(promissoryNote.lender.name)
           .text(promissoryNote.lender.address)
           .moveDown(2);

        // Add amount and currency
        doc.text(`PRINCIPAL AMOUNT: ${promissoryNote.currency} ${promissoryNote.amount.toLocaleString()}`)
           .moveDown();

        // Add interest rate
        doc.text(`INTEREST RATE: ${promissoryNote.interestRate}% per annum`)
           .moveDown();

        // Add payment terms
        doc.text('PAYMENT TERMS:')
           .moveDown(0.5)
           .text(promissoryNote.paymentTerms)
           .moveDown();

        // Add special conditions if any
        if (promissoryNote.specialConditions) {
          doc.text('SPECIAL CONDITIONS:')
             .moveDown(0.5)
             .text(promissoryNote.specialConditions)
             .moveDown();
        }

        // Add maturity date
        doc.text(`MATURITY DATE: ${this.formatDate(promissoryNote.maturityDate)}`)
           .moveDown(2);

        // Add signature blocks
        doc.text('BORROWER SIGNATURE:')
           .moveDown(2)
           .text('_____________________________')
           .text(promissoryNote.borrower.name)
           .moveDown(2);

        doc.text('LENDER SIGNATURE:')
           .moveDown(2)
           .text('_____________________________')
           .text(promissoryNote.lender.name)
           .moveDown(2);

        // Add date of signing
        doc.text('DATE:')
           .moveDown(2)
           .text('_____________________________')
           .moveDown();

        // Finalize the PDF
        doc.end();
      } catch (error) {
        this.logger.error(`Failed to generate PDF: ${error.message}`);
        reject(error);
      }
    });
  }
} 
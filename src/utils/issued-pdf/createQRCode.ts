import QRCode from 'qrcode';
import { Logger } from '@nestjs/common';


export async function createQRCode(content: string): Promise<Uint8Array> {
    const logger = new Logger(createQRCode.name);
    try {
        // Generate QR code as PNG buffer
        const qrCodeBuffer = await QRCode.toBuffer(content, {
            type: 'png',
            margin: 1,
            scale: 8,
            errorCorrectionLevel: 'H'
        });

        return new Uint8Array(qrCodeBuffer);
    } catch (error) {
        logger.error('Error generating QR code:', error);
        throw error;
    }
} 
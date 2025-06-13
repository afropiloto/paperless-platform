import { Controller, Get, Logger, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import * as fs from 'fs';

@Controller()
export class AppController {
    private readonly logger = new Logger(AppController.name);
    private readonly didFilePath: string;

    constructor() {
        this.didFilePath = process.env.DID_FILE_PATH || 'public/did.json';
    }

    @Get('.well-known/did.json')
    async getDidDocument(@Res() res: Response) {
        const filePath = join(process.cwd(), this.didFilePath);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        res.setHeader('Content-Type', 'application/json');
        res.send(fileContent);
    }
} 
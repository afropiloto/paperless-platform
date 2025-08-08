import * as fs from 'fs/promises';
import * as path from 'path';
import { StoredEmail } from './dummy-email.storage';

export interface DiskStorageConfig {
  enabled: boolean;
  directory: string;
  format: 'json' | 'html' | 'both';
  includeMetadata: boolean;
}

export class DummyEmailDiskStorage {
  private readonly config: DiskStorageConfig;

  constructor(config: Partial<DiskStorageConfig> = {}) {
    this.config = {
      enabled: false,
      directory: './dummy-emails',
      format: 'both',
      includeMetadata: true,
      ...config,
    };
  }

  async writeEmailToDisk(email: StoredEmail): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      // Ensure directory exists
      await this.ensureDirectoryExists();

      const timestamp = email.sentAt.toISOString().replace(/[:.]/g, '-');
      const baseFilename = `${timestamp}-${email.id}`;
      const basePath = path.join(this.config.directory, baseFilename);

      // Write based on format preference
      if (this.config.format === 'json' || this.config.format === 'both') {
        await this.writeJsonFile(basePath, email);
      }

      if (this.config.format === 'html' || this.config.format === 'both') {
        await this.writeHtmlFile(basePath, email);
      }

      console.log(`📁 Dummy email written to disk: ${basePath}`);
    } catch (error) {
      console.error(`Failed to write email to disk: ${error.message}`);
      // Don't throw - disk storage is optional
    }
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.access(this.config.directory);
    } catch {
      await fs.mkdir(this.config.directory, { recursive: true });
    }
  }

  private async writeJsonFile(basePath: string, email: StoredEmail): Promise<void> {
    const jsonPath = `${basePath}.json`;
    const emailData = this.config.includeMetadata ? email : {
      to: email.to,
      subject: email.subject,
      htmlContent: email.htmlContent,
      textContent: email.textContent,
      replyTo: email.replyTo,
      cc: email.cc,
      bcc: email.bcc,
    };

    await fs.writeFile(jsonPath, JSON.stringify(emailData, null, 2), 'utf8');
  }

  private async writeHtmlFile(basePath: string, email: StoredEmail): Promise<void> {
    const htmlPath = `${basePath}.html`;
    
    const htmlContent = this.generateHtmlPreview(email);
    await fs.writeFile(htmlPath, htmlContent, 'utf8');
  }

  private generateHtmlPreview(email: StoredEmail): string {
    const recipients = Array.isArray(email.to) ? email.to.join(', ') : email.to;
    const cc = email.cc ? (Array.isArray(email.cc) ? email.cc.join(', ') : email.cc) : '';
    const bcc = email.bcc ? (Array.isArray(email.bcc) ? email.bcc.join(', ') : email.bcc) : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dummy Email: ${email.subject}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        .header { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 20px; 
            border-left: 4px solid #007bff; 
        }
        .metadata { 
            background: #e9ecef; 
            padding: 15px; 
            border-radius: 4px; 
            margin-bottom: 20px; 
            font-size: 14px; 
        }
        .metadata table { 
            width: 100%; 
            border-collapse: collapse; 
        }
        .metadata td { 
            padding: 4px 8px; 
            border-bottom: 1px solid #dee2e6; 
        }
        .metadata td:first-child { 
            font-weight: bold; 
            width: 120px; 
        }
        .content { 
            background: white; 
            padding: 20px; 
            border: 1px solid #dee2e6; 
            border-radius: 4px; 
        }
        .text-content { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 4px; 
            margin-top: 20px; 
            white-space: pre-wrap; 
            font-family: monospace; 
        }
        .badge { 
            display: inline-block; 
            background: #007bff; 
            color: white; 
            padding: 2px 8px; 
            border-radius: 12px; 
            font-size: 12px; 
            margin-left: 10px; 
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📧 Dummy Email Preview</h1>
        <p>This is a preview of an email that would have been sent by the dummy provider.</p>
        <span class="badge">DUMMY EMAIL</span>
    </div>

    <div class="metadata">
        <table>
            <tr>
                <td>Email ID:</td>
                <td>${email.id}</td>
            </tr>
            <tr>
                <td>Sent At:</td>
                <td>${email.sentAt.toISOString()}</td>
            </tr>
            <tr>
                <td>Provider:</td>
                <td>${email.provider}</td>
            </tr>
            <tr>
                <td>To:</td>
                <td>${recipients}</td>
            </tr>
            ${cc ? `<tr><td>CC:</td><td>${cc}</td></tr>` : ''}
            ${bcc ? `<tr><td>BCC:</td><td>${bcc}</td></tr>` : ''}
            ${email.replyTo ? `<tr><td>Reply-To:</td><td>${email.replyTo}</td></tr>` : ''}
            <tr>
                <td>Subject:</td>
                <td><strong>${email.subject}</strong></td>
            </tr>
        </table>
    </div>

    <div class="content">
        <h2>HTML Content:</h2>
        ${email.htmlContent}
    </div>

    ${email.textContent ? `
    <div class="text-content">
        <h2>Text Content:</h2>
        ${email.textContent}
    </div>
    ` : ''}

    <div style="margin-top: 30px; text-align: center; color: #6c757d; font-size: 14px;">
        <p>Generated by Dummy Email Provider for testing purposes</p>
        <p>File generated at: ${new Date().toISOString()}</p>
    </div>
</body>
</html>`;
  }

  getConfig(): DiskStorageConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<DiskStorageConfig>): void {
    Object.assign(this.config, newConfig);
  }
}

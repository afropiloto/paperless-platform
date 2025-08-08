import { DummyEmailDiskStorage, DiskStorageConfig } from './dummy-email-disk-storage';
import { StoredEmail } from './dummy-email.storage';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs module
jest.mock('fs/promises');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('DummyEmailDiskStorage', () => {
  let diskStorage: DummyEmailDiskStorage;
  let testEmail: StoredEmail;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create test email
    testEmail = {
      id: 'dummy-1234567890-abc123',
      to: 'test@example.com',
      subject: 'Test Email',
      htmlContent: '<h1>Test Content</h1>',
      textContent: 'Test Content',
      sentAt: new Date('2024-01-01T12:00:00.000Z'),
      provider: 'dummy',
    };

    // Mock fs.access to simulate directory exists
    mockedFs.access.mockResolvedValue(undefined);
    mockedFs.writeFile.mockResolvedValue(undefined);
  });

  describe('constructor', () => {
    it('should use default configuration when no config provided', () => {
      diskStorage = new DummyEmailDiskStorage();
      const config = diskStorage.getConfig();

      expect(config.enabled).toBe(false);
      expect(config.directory).toBe('./dummy-emails');
      expect(config.format).toBe('both');
      expect(config.includeMetadata).toBe(true);
    });

    it('should merge provided configuration with defaults', () => {
      const customConfig: Partial<DiskStorageConfig> = {
        enabled: true,
        directory: './custom-emails',
        format: 'html',
      };

      diskStorage = new DummyEmailDiskStorage(customConfig);
      const config = diskStorage.getConfig();

      expect(config.enabled).toBe(true);
      expect(config.directory).toBe('./custom-emails');
      expect(config.format).toBe('html');
      expect(config.includeMetadata).toBe(true); // Default value
    });
  });

  describe('writeEmailToDisk', () => {
    beforeEach(() => {
      diskStorage = new DummyEmailDiskStorage({ enabled: true });
    });

    it('should not write files when disabled', async () => {
      diskStorage.updateConfig({ enabled: false });
      
      await diskStorage.writeEmailToDisk(testEmail);

      expect(mockedFs.writeFile).not.toHaveBeenCalled();
    });

    it('should create directory if it does not exist', async () => {
      mockedFs.access.mockRejectedValueOnce(new Error('Directory not found'));

      await diskStorage.writeEmailToDisk(testEmail);

      expect(mockedFs.mkdir).toHaveBeenCalledWith('./dummy-emails', { recursive: true });
    });

    it('should write both JSON and HTML files when format is "both"', async () => {
      await diskStorage.writeEmailToDisk(testEmail);

      expect(mockedFs.writeFile).toHaveBeenCalledTimes(2);
      
      // Check JSON file call
      const jsonCall = mockedFs.writeFile.mock.calls.find(call => 
        call[0].toString().endsWith('.json')
      );
      expect(jsonCall).toBeDefined();
      
      // Check HTML file call
      const htmlCall = mockedFs.writeFile.mock.calls.find(call => 
        call[0].toString().endsWith('.html')
      );
      expect(htmlCall).toBeDefined();
    });

    it('should write only JSON file when format is "json"', async () => {
      diskStorage.updateConfig({ format: 'json' });

      await diskStorage.writeEmailToDisk(testEmail);

      expect(mockedFs.writeFile).toHaveBeenCalledTimes(1);
      expect(mockedFs.writeFile.mock.calls[0][0].toString()).toMatch(/\.json$/);
    });

    it('should write only HTML file when format is "html"', async () => {
      diskStorage.updateConfig({ format: 'html' });

      await diskStorage.writeEmailToDisk(testEmail);

      expect(mockedFs.writeFile).toHaveBeenCalledTimes(1);
      expect(mockedFs.writeFile.mock.calls[0][0].toString()).toMatch(/\.html$/);
    });

    it('should include metadata in JSON when includeMetadata is true', async () => {
      await diskStorage.writeEmailToDisk(testEmail);

      const jsonCall = mockedFs.writeFile.mock.calls.find(call => 
        call[0].toString().endsWith('.json')
      );
      expect(jsonCall).toBeDefined();

      const jsonContent = JSON.parse(jsonCall![1] as string);
      expect(jsonContent.id).toBe(testEmail.id);
      expect(jsonContent.sentAt).toBeDefined();
      expect(jsonContent.provider).toBe(testEmail.provider);
    });

    it('should exclude metadata in JSON when includeMetadata is false', async () => {
      diskStorage.updateConfig({ includeMetadata: false });

      await diskStorage.writeEmailToDisk(testEmail);

      const jsonCall = mockedFs.writeFile.mock.calls.find(call => 
        call[0].toString().endsWith('.json')
      );
      expect(jsonCall).toBeDefined();

      const jsonContent = JSON.parse(jsonCall![1] as string);
      expect(jsonContent.id).toBeUndefined();
      expect(jsonContent.sentAt).toBeUndefined();
      expect(jsonContent.provider).toBeUndefined();
      expect(jsonContent.to).toBe(testEmail.to);
      expect(jsonContent.subject).toBe(testEmail.subject);
    });

    it('should generate HTML with email content and metadata', async () => {
      await diskStorage.writeEmailToDisk(testEmail);

      const htmlCall = mockedFs.writeFile.mock.calls.find(call => 
        call[0].toString().endsWith('.html')
      );
      expect(htmlCall).toBeDefined();

      const htmlContent = htmlCall![1] as string;
      expect(htmlContent).toContain('Dummy Email Preview');
      expect(htmlContent).toContain(testEmail.subject);
      expect(htmlContent).toContain(testEmail.htmlContent);
      expect(htmlContent).toContain(testEmail.textContent);
      expect(htmlContent).toContain(testEmail.id);
    });

    it('should handle errors gracefully without throwing', async () => {
      mockedFs.writeFile.mockRejectedValueOnce(new Error('Disk full'));

      // Should not throw
      await expect(diskStorage.writeEmailToDisk(testEmail)).resolves.toBeUndefined();
    });
  });

  describe('configuration management', () => {
    beforeEach(() => {
      diskStorage = new DummyEmailDiskStorage();
    });

    it('should return a copy of the configuration', () => {
      const config1 = diskStorage.getConfig();
      const config2 = diskStorage.getConfig();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Should be different objects
    });

    it('should update configuration correctly', () => {
      const newConfig: Partial<DiskStorageConfig> = {
        enabled: true,
        directory: './new-directory',
        format: 'html',
        includeMetadata: false,
      };

      diskStorage.updateConfig(newConfig);
      const config = diskStorage.getConfig();

      expect(config.enabled).toBe(true);
      expect(config.directory).toBe('./new-directory');
      expect(config.format).toBe('html');
      expect(config.includeMetadata).toBe(false);
    });

    it('should merge partial configuration updates', () => {
      const originalConfig = diskStorage.getConfig();
      
      diskStorage.updateConfig({ enabled: true });
      const updatedConfig = diskStorage.getConfig();

      expect(updatedConfig.enabled).toBe(true);
      expect(updatedConfig.directory).toBe(originalConfig.directory);
      expect(updatedConfig.format).toBe(originalConfig.format);
      expect(updatedConfig.includeMetadata).toBe(originalConfig.includeMetadata);
    });
  });
});

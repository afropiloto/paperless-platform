import { SendEmailOptions } from '../../types';

export interface StoredEmail extends SendEmailOptions {
  id: string;
  sentAt: Date;
  provider: string;
}

export class DummyEmailStorage {
  private emails: StoredEmail[] = [];

  async store(email: Omit<StoredEmail, 'id'>): Promise<void> {
    const emailWithId: StoredEmail = {
      ...email,
      id: this.generateId(),
    };
    this.emails.push(emailWithId);
  }

  async getAll(): Promise<StoredEmail[]> {
    return [...this.emails];
  }

  async clear(): Promise<void> {
    this.emails = [];
  }

  async findByRecipient(email: string): Promise<StoredEmail[]> {
    return this.emails.filter(e => {
      const toEmails = Array.isArray(e.to) ? e.to : [e.to];
      const ccEmails = e.cc ? (Array.isArray(e.cc) ? e.cc : [e.cc]) : [];
      const bccEmails = e.bcc ? (Array.isArray(e.bcc) ? e.bcc : [e.bcc]) : [];
      
      return [...toEmails, ...ccEmails, ...bccEmails].includes(email);
    });
  }

  async findBySubject(subject: string): Promise<StoredEmail[]> {
    return this.emails.filter(e => e.subject.includes(subject));
  }

  async findById(id: string): Promise<StoredEmail | undefined> {
    return this.emails.find(e => e.id === id);
  }

  async getCount(): Promise<number> {
    return this.emails.length;
  }

  private generateId(): string {
    return `dummy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

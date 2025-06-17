import { PromissoryNotePartyDto } from '../dto/deal-processing-response.dto';
import { SignaturesDto } from '../dto/deal-processing-response.dto';

export interface PromissoryNote {
  id: string;
  dealId: string;
  borrower: PromissoryNotePartyDto;
  lender: PromissoryNotePartyDto;
  amount: number;
  currency: string;
  issueDate: Date;
  maturityDate: Date;
  interestRate: number;
  paymentTerms: string;
  specialConditions: string;
  createdAt: Date;
  updatedAt: Date;
  signatures?: SignaturesDto;
} 
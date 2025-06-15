import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ChecklistTemplate, ChecklistItemTemplate } from './checklist-template.entity';
import { ChecklistItemStatus } from '../../types/deal-desk.types';

@Entity()
export class ChecklistInstance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  loanId: string; // UUID or string

  @ManyToOne(() => ChecklistTemplate)
  checklistTemplate: ChecklistTemplate;
}

@Entity()
export class Completion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ChecklistInstance)
  checklistInstance: ChecklistInstance;

  @ManyToOne(() => ChecklistItemTemplate)
  questionTemplate: ChecklistItemTemplate;

  @Column({
    type: 'text',
    default: ChecklistItemStatus.NOT_STARTED,
  })
  status: ChecklistItemStatus
}
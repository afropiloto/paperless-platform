import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { IsInt, Min } from 'class-validator';

@Entity()
export class ChecklistTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  version: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => SectionTemplate, (section) => section.checklistTemplate)
  sections: SectionTemplate[];
}

@Entity()
export class SectionTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  guidance: string;

  @Column()
  @IsInt()
  @Min(1)
  position: number;

  @ManyToOne(() => ChecklistTemplate, (checklist) => checklist.sections)
  checklistTemplate: ChecklistTemplate;

  @OneToMany(() => ChecklistItemTemplate, (question) => question.sectionTemplate)
  items: ChecklistItemTemplate[];
}

@Entity()
export class ChecklistItemTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  guidance: string;

  @Column()
  @IsInt()
  @Min(1)
  position: number;

  @ManyToOne(() => SectionTemplate, (section) => section.items)
  sectionTemplate: SectionTemplate;
}
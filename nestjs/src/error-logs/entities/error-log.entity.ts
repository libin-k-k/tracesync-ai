import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'error_logs' })
export class ErrorLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  tenant_id!: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  project_id!: string;

  @Column({ type: 'text' })
  error_message!: string;

  @Column({ type: 'longtext' })
  stack_trace!: string;

  @Column({ type: 'text' })
  ai_solution!: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;
}

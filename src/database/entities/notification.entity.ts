import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { NotificationType } from '../../common/enums';
import { BaseEntity } from './base.entity';
import { Loan } from './loan.entity';
import { User } from './user.entity';

@Entity({ name: 'notifications' })
export class Notification extends BaseEntity {
  @ManyToOne(() => User, (user) => user.notifications, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Loan, (loan) => loan.notifications, { nullable: true })
  @JoinColumn({ name: 'loan_id' })
  loan: Loan | null;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @Column({ name: 'scheduled_for', type: 'timestamptz', nullable: true })
  scheduledFor: Date | null;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null;
}

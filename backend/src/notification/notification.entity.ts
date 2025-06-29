import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { NotificationType, NotificationPriority } from '../common/enums/roles.enum';

// Re-export for backward compatibility
export { NotificationType, NotificationPriority };

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'enum', enum: NotificationPriority, default: NotificationPriority.MEDIUM })
  priority: NotificationPriority;

  @ManyToOne(() => User, { nullable: true })
  recipient: User; // Usuario específico (null = broadcast)

  @ManyToOne(() => User)
  sender: User; // Quien envía la notificación

  @Column({ default: false })
  isRead: boolean;

  @Column('json', { nullable: true })
  data: any; // Datos adicionales (IDs relacionados, etc.)

  @CreateDateColumn()
  createdAt: Date;

  @Column('timestamp', { nullable: true })
  readAt: Date;
}

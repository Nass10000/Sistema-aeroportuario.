import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationPriority } from './notification.entity';
import { User } from '../user/user.entity';
import { CreateNotificationDto } from '../dto/create-notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async create(
    title: string,
    message: string,
    type: NotificationType,
    sender: User,
    recipient?: User,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
    data?: any,
  ) {
    const notification = this.notificationRepository.create({
      title,
      message,
      type,
      sender,
      recipient,
      priority,
      data,
    });
    return this.notificationRepository.save(notification);
  }

  async findByUser(userId: number, unreadOnly: boolean = false) {
    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.sender', 'sender')
      .where('notification.recipient IS NULL OR notification.recipient.id = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC');

    if (unreadOnly) {
      query.andWhere('notification.isRead = false');
    }

    return query.getMany();
  }

  async markAsRead(id: number, userId: number) {
    return this.notificationRepository.update(
      { id, recipient: { id: userId } },
      { isRead: true, readAt: new Date() }
    );
  }

  async markAllAsRead(userId: number) {
    return this.notificationRepository.update(
      { recipient: { id: userId }, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }

  // Notificaciones específicas del negocio
  async notifyStaffShortage(operation: any, station: any, sender: User) {
    return this.create(
      'Personal Insuficiente',
      `La operación ${operation.flightNumber} en ${station.name} necesita más personal`,
      NotificationType.STAFF_SHORTAGE,
      sender,
      station.manager,
      NotificationPriority.HIGH,
      { operationId: operation.id, stationId: station.id }
    );
  }

  async notifyScheduleChange(assignment: any, sender: User) {
    return this.create(
      'Cambio de Horario',
      `Tu asignación para ${assignment.operation.flightNumber} ha sido modificada`,
      NotificationType.SCHEDULE_CHANGE,
      sender,
      assignment.user,
      NotificationPriority.MEDIUM,
      { assignmentId: assignment.id }
    );
  }

  async createFromDto(createNotificationDto: CreateNotificationDto, sender: User) {
    const { title, message, type, recipientId, priority } = createNotificationDto;
    
    let recipient: User | undefined;
    if (recipientId) {
      // En un caso real, buscarías el usuario por ID
      // recipient = await this.userService.findOne(recipientId);
    }
    
    return this.create(
      title,
      message,
      type,
      sender,
      recipient,
      priority || NotificationPriority.MEDIUM
    );
  }

  async notifyNewAssignment(assignment: any, sender: User) {
    return this.create(
      'Nueva Asignación',
      `Has sido asignado a ${assignment.operation.flightNumber} el ${assignment.startTime}`,
      NotificationType.ASSIGNMENT,
      sender,
      assignment.user,
      NotificationPriority.MEDIUM,
      { assignmentId: assignment.id }
    );
  }
}

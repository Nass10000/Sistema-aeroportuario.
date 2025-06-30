// src/notification/notification.gateway.ts
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/notifications', cors: true })
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {
    // En producción verificar token; aquí simplificamos extrayendo userId de query params
    const userId = client.handshake.query.userId as string;
    if (userId) {
      client.join(`user_${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    // Limpieza si es necesario
  }

  // Método para enviar notificación de asignación a un usuario
  sendAssignmentNotification(userId: number, payload: any) {
    this.server.to(`user_${userId}`).emit('newAssignment', payload);
  }

  // Método genérico para cualquier evento
  emitToUser(userId: number, event: string, payload: any): void {
    this.server.to(`user_${userId}`).emit(event, payload);
  }
}
// ... other imports and code
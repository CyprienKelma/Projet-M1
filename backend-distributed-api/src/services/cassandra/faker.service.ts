import { Injectable, Inject } from '@nestjs/common';
import { Client } from 'cassandra-driver';
import { Message } from '../../models/cassandra/message.model';
import { Notification } from '../../models/cassandra/notification.model';

@Injectable()
export class FakerService {
  constructor(@Inject('CASSANDRA_CLIENT') private cassandraClient: Client) {}

  async generatefakeMessages(conversationId: string, count: number) {
    const query = `
      INSERT INTO messages (conversation_id, message_id, sender_id, content, created_at)
      VALUES (?, ?, ?, ?, ?)`;
    const messages = [];
    for (let i = 0; i < count; i++) {
      const message: Message = {
        conversation_id: conversationId,
        message_id: `${conversationId}-${i}`,
        sender_id: Math.floor(Math.random() * 100),
        content: `Message ${i + 1} in conversation ${conversationId}`,
        created_at: new Date(),
      };
      messages.push(message);
    }
    await Promise.all(
      messages.map((message) =>
        this.cassandraClient.execute(query, [
          message.conversation_id,
          message.message_id,
          message.sender_id,
          message.content,
          message.created_at,
        ]),
      ),
    );
    console.log(
      `Inserted ${count} fake messages for conversation ${conversationId}`,
    );
  }

  async generateFakeNotifications(userId: number, count: number) {
    const query = `
      INSERT INTO notifications (user_id, notification_id, type, content, created_at)
      VALUES (?, ?, ?, ?, ?)`;
    const notifications = [];
    for (let i = 0; i < count; i++) {
      const notification: Notification = {
        user_id: userId,
        notification_id: `${userId}-${i}`,
        type: `Type ${Math.floor(Math.random() * 5)}`,
        message: `Notification ${i + 1} for user ${userId}`,
        read: Math.random() < 0.5,
        created_at: new Date(),
      };
      notifications.push(notification);
    }
    await Promise.all(
      notifications.map((notification) =>
        this.cassandraClient.execute(query, [
          notification.user_id,
          notification.notification_id,
          notification.type,
          notification.message,
          notification.read,
          notification.created_at,
        ]),
      ),
    );
    console.log(`Inserted ${count} fake notifications for user ${userId}`);
  }
}

import { Injectable, Inject } from '@nestjs/common';
import { Client, types } from 'cassandra-driver';
import { Message } from '../../models/cassandra/message.model';
import { Notification } from '../../models/cassandra/notification.model';

@Injectable()
export class FakerService {
  constructor(@Inject('CASSANDRA_CLIENT') private cassandraClient: Client) {}

  async generatefakeMessages(conversationId: string, count: number) {
    const query = `
       INSERT INTO messages (conversation_id, message_id, sender_id, content, created_at)
       VALUES (?, ?, ?, ?, ?)`;

    try {
      for (let i = 0; i < count; i++) {
        // Generate a proper integer for sender_id
        const senderId = Math.floor(Math.random() * 100);

        await this.cassandraClient.execute(
          query,
          [
            conversationId,
            `${conversationId}-${i}`,
            types.Integer.fromNumber(senderId), // Use Cassandra's Integer type
            `Message ${i + 1} in conversation ${conversationId}`,
            new Date(),
          ],
          { prepare: true },
        );
      }

      console.log(
        `Inserted ${count} fake messages for conversation ${conversationId}`,
      );
    } catch (error) {
      console.error('Error generating messages:', error);
      throw error;
    }
  }

  async generateFakeNotifications(userId: number, count: number) {
    const query = `
        INSERT INTO notifications (user_id, notification_id, type, message, read, created_at)
        VALUES (?, ?, ?, ?, ?, ?)`;

    try {
      for (let i = 0; i < count; i++) {
        // Use individual executions to isolate errors
        const id = i;

        await this.cassandraClient.execute(
          query,
          [
            // Force Int32 type for user_id
            types.Integer.fromNumber(parseInt(userId.toString())),
            `${userId}-${id}`, // notification_id as string
            `Type ${Math.floor(Math.random() * 5)}`, // type as string
            `Notification ${id + 1} for user ${userId}`, // message as string
            !!Math.round(Math.random()), // read as boolean
            new Date(), // created_at as date
          ],
          { prepare: true },
        );
      }

      console.log(`Inserted ${count} fake notifications for user ${userId}`);
    } catch (error) {
      console.error('Error generating notifications:', error);
      throw error;
    }
  }
}

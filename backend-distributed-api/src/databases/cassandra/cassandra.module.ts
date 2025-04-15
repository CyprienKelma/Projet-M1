import { Module } from '@nestjs/common';
import { CassandraProvider } from './cassandra.provider';
import { MessageService } from '../../services/cassandra/message.service';
import { NotificationService } from '../../services/cassandra/notification.service';
import { FakerService } from '../../services/cassandra/faker.service';

@Module({
  providers: [
    ...CassandraProvider,
    MessageService,
    NotificationService,
    FakerService,
  ],
  exports: [
    ...CassandraProvider,
    MessageService,
    NotificationService,
    FakerService,
  ],
})
export class CassandraModule {}

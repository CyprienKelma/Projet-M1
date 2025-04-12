import { Module } from '@nestjs/common';
import { DatabaseProvider } from './postgres.provider';
import { UserService } from '../../services/postgres/user.service';
import { GroupService } from '../../services/postgres/group.service';
import { FakerService } from '../../services/postgres/faker.service';

@Module({
  providers: [...DatabaseProvider, UserService, GroupService, FakerService],
  exports: [...DatabaseProvider, UserService, GroupService, FakerService],
})
export class PostgresModule {}

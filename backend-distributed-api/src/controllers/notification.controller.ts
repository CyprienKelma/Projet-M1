import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { NotificationService } from '../services/cassandra/notification.service';
import { NotificationDto } from '../shared/dto/notification.dto';
import { FakerService } from '../services/cassandra/faker.service';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly fakerService: FakerService,
  ) {}

  @Get(':userId')
  getNotifications(@Param('userId') userId: string) {
    return this.notificationService.getNotifications(Number(userId));
  }

  @Post()
  create(@Body() notificationDto: NotificationDto) {
    return this.notificationService.create(notificationDto);
  }

  @Post('seed')
  generate(@Body() body: { userId: number; count: number }) {
    return this.fakerService.generateFakeNotifications(body.userId, body.count);
  }

  @Post('reset')
  async reset() {
    await this.notificationService.reset();
    return { message: 'Notification table cleared' };
  }
}

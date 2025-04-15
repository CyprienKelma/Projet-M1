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
  generate(@Body() body: { userId: number | string; count: number }) {
    // Ensure userId is a proper integer
    const userIdInt =
      typeof body.userId === 'number'
        ? body.userId
        : parseInt(String(body.userId), 10);

    if (isNaN(userIdInt)) {
      throw new Error('Invalid userId: must be a number');
    }

    return this.fakerService.generateFakeNotifications(userIdInt, body.count);
  }

  @Post('reset')
  async reset() {
    await this.notificationService.reset();
    return { message: 'Notification table cleared' };
  }
}

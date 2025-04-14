import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MessageService } from '../services/cassandra/message.service';
import { MessageDto } from '../shared/dto/message.dto';
import { FakerService } from '../services/cassandra/faker.service';

@Controller('messages')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly fakerService: FakerService,
  ) {}

  @Get(':conversationId')
  getMessages(@Param('conversationId') conversationId: string) {
    return this.messageService.getMessages(conversationId);
  }

  @Post()
  create(@Body() messageDto: MessageDto) {
    return this.messageService.create(messageDto);
  }

  @Post('seed')
  generate(@Body() body: { conversationId: string; count: number }) {
    return this.fakerService.generatefakeMessages(
      body.conversationId,
      body.count,
    );
  }

  @Post('reset')
  async reset() {
    await this.messageService.reset();
    return { message: 'Message table cleared' };
  }
}

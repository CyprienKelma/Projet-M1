import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UserService } from '../services/postgres/user.service';
import { UserDto } from '../shared/dto/user.dto';
import { FakerService } from '../services/postgres/faker.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly fakerService: FakerService,
  ) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.userService.findOne(id);
  }

  @Post()
  create(@Body() userDto: UserDto) {
    return this.userService.create(userDto);
  }

  @Post('seed')
  generate(@Body() body: { count: number }) {
    return this.fakerService.generateFakeUsers(body.count);
  }

  @Post('reset')
  async reset() {
    await this.userService.reset();
    return { message: 'User table cleared' };
  }
}

import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { GroupService } from '../services/postgres/group.service';
import { FakerService } from '../services/postgres/faker.service';

@Controller('groups')
export class GroupController {
  constructor(
    private readonly groupService: GroupService,
    private readonly fakerService: FakerService,
  ) {}

  @Get()
  findAll() {
    return this.groupService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.groupService.findOne(id);
  }

  @Post()
  create(@Body() body: { name: string; description: string }) {
    return this.groupService.create(body);
  }

  @Post('seed')
  generate(@Body() body: { groupCount: number; usersPerGroup: number }) {
    return this.fakerService.generateGroupsWithUsers(
      body.groupCount,
      body.usersPerGroup,
    );
  }
}

import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { User } from '../../models/postgres/user.entity';
import { Group } from '../../models/postgres/group.entity';

@Injectable()
export class FakerService {
  constructor(
    @Inject('POSTGRES_DATA_SOURCE')
    private readonly dataSource: DataSource,
  ) {}

  async generateFakeUsers(count = 10) {
    const userRepository = this.dataSource.getRepository(User);

    const users = Array.from({ length: count }).map(() => {
      const user = new User();
      user.firstName = faker.person.firstName();
      user.lastName = faker.person.lastName();
      user.email = faker.internet.email();
      user.password = faker.internet.password();
      return user;
    });

    await userRepository.save(users);
    console.log(`✅ Inserted ${count} fake users`);
    return users;
  }

  async generateGroupsWithUsers(groupCount = 3, usersPerGroup = 5) {
    const groupRepo = this.dataSource.getRepository(Group);
    const userRepo = this.dataSource.getRepository(User);

    for (let i = 0; i < groupCount; i++) {
      const group = new Group();
      group.name = faker.company.name();
      group.description = faker.company.catchPhrase();

      // Create users inline
      const users: User[] = [];

      for (let j = 0; j < usersPerGroup; j++) {
        const user = new User();
        user.firstName = faker.person.firstName();
        user.lastName = faker.person.lastName();
        user.email = faker.internet.email();
        user.password = faker.internet.password();
        users.push(user);
      }

      group.users = users;

      await groupRepo.save(group); // will cascade and insert users
      console.log(
        `✅ Group "${group.name}" with ${users.length} users created`,
      );

      return group;
    }
  }
}

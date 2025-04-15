import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../../models/postgres/user.entity';
import { UserDto } from '../../shared/dto/user.dto';

@Injectable()
export class UserService {
  private userRepository;

  constructor(@Inject('POSTGRES_DATA_SOURCE') private dataSource: DataSource) {
    this.userRepository = this.dataSource.getRepository(User);
  }

  async findAll() {
    return this.userRepository.find();
  }

  async findOne(id: number) {
    return this.userRepository.findOneBy({ id });
  }

  async create(userDto: UserDto) {
    const user = this.userRepository.create(userDto);
    return this.userRepository.save(user);
  }

  async reset(): Promise<void> {
    // Use raw SQL with CASCADE to clear constraints
    await this.dataSource.query(
      'TRUNCATE TABLE users, groups_users_user CASCADE',
    );
    console.log('✅ User table cleared');
  }
}

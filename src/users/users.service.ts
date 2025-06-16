import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async updateProfile(id: string, updateData: { name?: string; email?: string }): Promise<User> {
    const user = await this.findById(id);
    
    if (updateData.name) {
      user.name = updateData.name;
    }
    
    if (updateData.email) {
      user.email = updateData.email;
    }

    return this.userRepository.save(user);
  }
} 
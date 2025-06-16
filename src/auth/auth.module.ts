import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { User } from '../users/entities/user.entity';
import { UserToken } from '../users/entities/user-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserToken])],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {} 
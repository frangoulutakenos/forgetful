import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserToken } from '../users/entities/user-token.entity';
import { GoogleUserDto, CreateTokenDto } from './dto/auth.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserToken)
    private tokenRepository: Repository<UserToken>,
  ) {}

  async validateGoogleUser(googleUser: GoogleUserDto): Promise<User> {
    // Buscar usuario existente por Google ID
    let user = await this.userRepository.findOne({
      where: { googleId: googleUser.googleId }
    });

    if (!user) {
      // Crear nuevo usuario si no existe
      user = this.userRepository.create({
        googleId: googleUser.googleId,
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.avatarUrl || null,
      });
      user = await this.userRepository.save(user);
    } else {
      // Actualizar información del usuario existente
      user.email = googleUser.email;
      user.name = googleUser.name;
      user.avatarUrl = googleUser.avatarUrl || null;
      user = await this.userRepository.save(user);
    }

    return user;
  }

  async createToken(userId: string, tokenName: string): Promise<string> {
    // Generar token aleatorio seguro
    const token = randomBytes(32).toString('hex');

    // Crear registro de token
    const userToken = this.tokenRepository.create({
      token,
      name: tokenName,
      userId,
    });

    await this.tokenRepository.save(userToken);
    return token;
  }

  async validateToken(token: string): Promise<User | null> {
    const userToken = await this.tokenRepository.findOne({
      where: { token, isActive: true },
      relations: ['user'],
    });

    if (!userToken || !userToken.user.isActive) {
      return null;
    }

    // Actualizar última vez usado
    userToken.lastUsedAt = new Date();
    await this.tokenRepository.save(userToken);

    return userToken.user;
  }

  async revokeToken(token: string, userId: string): Promise<boolean> {
    const result = await this.tokenRepository.update(
      { token, userId, isActive: true },
      { isActive: false }
    );

    return (result.affected || 0) > 0;
  }

  async getUserTokens(userId: string): Promise<UserToken[]> {
    return this.tokenRepository.find({
      where: { userId, isActive: true },
      select: ['id', 'name', 'createdAt', 'lastUsedAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async revokeAllUserTokens(userId: string): Promise<number> {
    const result = await this.tokenRepository.update(
      { userId, isActive: true },
      { isActive: false }
    );

    return result.affected || 0;
  }
} 
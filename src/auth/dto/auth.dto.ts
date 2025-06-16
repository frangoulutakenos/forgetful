import { IsString, IsEmail, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleUserDto {
  @ApiProperty({ description: 'Google ID del usuario' })
  @IsString()
  googleId: string;

  @ApiProperty({ description: 'Email del usuario' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Nombre completo del usuario' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'URL del avatar', required: false })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class CreateTokenDto {
  @ApiProperty({ description: 'Nombre del token/cliente', example: 'Claude Web' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'ID del usuario' })
  @IsUUID()
  userId: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Token de acceso permanente' })
  token: string;

  @ApiProperty({ description: 'Información del usuario' })
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
  };
} 
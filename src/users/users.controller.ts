import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: any;
}

@ApiTags('users')
@Controller('users')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ 
    summary: 'Obtener perfil del usuario',
    description: 'Devuelve la información completa del perfil del usuario autenticado'
  })
  @ApiResponse({ status: 200, description: 'Perfil del usuario obtenido exitosamente' })
  @ApiResponse({ status: 401, description: 'Token no válido o no proporcionado' })
  async getProfile(@Req() req: AuthenticatedRequest) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('profile')
  @ApiOperation({ 
    summary: 'Actualizar perfil del usuario',
    description: 'Actualiza la información del perfil del usuario autenticado'
  })
  @ApiBody({
    description: 'Datos del perfil a actualizar',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nombre del usuario', example: 'Juan Pérez' },
        email: { type: 'string', description: 'Email del usuario', example: 'juan@example.com' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Perfil actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'Token no válido o no proporcionado' })
  async updateProfile(@Body() updateData: { name?: string; email?: string }, @Req() req: AuthenticatedRequest) {
    return this.usersService.updateProfile(req.user.id, updateData);
  }
} 
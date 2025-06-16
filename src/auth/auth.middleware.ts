import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

// Extender la interfaz Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        avatarUrl: string | null;
      };
    }
  }
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Rutas que no requieren autenticación
    const publicRoutes = [
      '/auth/google',
      '/auth/google/callback',
      '/tasks/status',
      '/', // Root endpoint
    ];

    // Verificar si es una ruta pública
    if (publicRoutes.some(route => req.path.startsWith(route))) {
      return next();
    }

    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de autorización requerido');
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    try {
      // Validar token y obtener usuario
      const user = await this.authService.validateToken(token);
      
      if (!user) {
        throw new UnauthorizedException('Token inválido o expirado');
      }

      // Agregar usuario al request
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      };

      next();
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }
} 
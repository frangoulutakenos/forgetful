import { Controller, Get, Post, Body, Req, Res, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { GoogleUserDto, CreateTokenDto, TokenResponseDto, UserTokenDto } from './dto/auth.dto';
import { Request, Response } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @ApiOperation({ 
    summary: 'Iniciar autenticación con Google',
    description: 'Redirige al usuario a Google OAuth para autenticación'
  })
  @ApiQuery({ name: 'redirect_uri', required: false, description: 'URL de redirección después del login' })
  @ApiResponse({ status: 302, description: 'Redirección a Google OAuth' })
  googleAuth(@Query('redirect_uri') redirectUri: string, @Res() res: Response) {
    const googleAuthUrl = `https://accounts.google.com/oauth2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&` +
      `response_type=code&` +
      `scope=email profile&` +
      `state=${encodeURIComponent(redirectUri || 'default')}`;
    
    res.redirect(googleAuthUrl);
  }

  @Get('google/callback')
  @ApiOperation({ 
    summary: 'Callback de Google OAuth',
    description: 'Procesa la respuesta de Google OAuth y crea/actualiza usuario'
  })
  @ApiQuery({ name: 'code', required: true, description: 'Código de autorización de Google' })
  @ApiQuery({ name: 'state', required: false, description: 'Estado de redirección' })
  @ApiResponse({ status: 302, description: 'Redirección con token de autenticación' })
  @ApiResponse({ status: 400, description: 'Error en la autenticación' })
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response
  ) {
    try {
      if (!code) {
        return res.status(400).json({ error: 'Authorization code not provided' });
      }

      // Intercambiar código por tokens con Google
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        }),
      });

      const tokens = await tokenResponse.json();

      if (!tokens.access_token) {
        return res.status(400).json({ error: 'Failed to get access token' });
      }

      // Obtener información del usuario de Google
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      const googleUser = await userResponse.json();

      // Validar/crear usuario en nuestra base de datos
      const user = await this.authService.validateGoogleUser({
        googleId: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
      });

      // Crear token permanente
      const token = await this.authService.createToken(user.id, 'Web Login');

      // Redirigir con token
      const redirectUrl = state !== 'default' ? decodeURIComponent(state) : '/dashboard';
      const finalUrl = `${redirectUrl}?token=${token}&user=${encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
      }))}`;

      res.redirect(finalUrl);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }

  @Get('me')
  @ApiOperation({ 
    summary: 'Obtener información del usuario actual',
    description: 'Devuelve la información del usuario basada en el token de autorización'
  })
  @ApiBearerAuth()
  @ApiHeader({ name: 'Authorization', description: 'Bearer token', required: true })
  @ApiResponse({ status: 200, description: 'Información del usuario', type: Object })
  @ApiResponse({ status: 401, description: 'Token no válido o no proporcionado' })
  async getCurrentUser(@Req() req: Request) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return { error: 'Token not provided' };
    }

    const user = await this.authService.validateToken(token);
    
    if (!user) {
      return { error: 'Invalid token' };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    };
  }

  @Get('tokens')
  @ApiOperation({ 
    summary: 'Listar tokens activos del usuario',
    description: 'Devuelve todos los tokens activos del usuario actual'
  })
  @ApiBearerAuth()
  @ApiHeader({ name: 'Authorization', description: 'Bearer token', required: true })
  @ApiResponse({ status: 200, description: 'Lista de tokens activos', type: Object })
  @ApiResponse({ status: 401, description: 'Token no válido o no proporcionado' })
  async getUserTokens(@Req() req: Request) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return { error: 'Token not provided' };
    }

    const user = await this.authService.validateToken(token);
    
    if (!user) {
      return { error: 'Invalid token' };
    }

    const tokens = await this.authService.getUserTokens(user.id);
    return { tokens };
  }

  @Post('revoke')
  @ApiOperation({ 
    summary: 'Revocar token',
    description: 'Revoca el token actual o un token específico'
  })
  @ApiBearerAuth()
  @ApiHeader({ name: 'Authorization', description: 'Bearer token', required: true })
  @ApiResponse({ status: 200, description: 'Token revocado exitosamente' })
  @ApiResponse({ status: 401, description: 'Token no válido o no proporcionado' })
  async revokeToken(@Req() req: Request, @Body() body: { tokenId?: number }) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return { error: 'Token not provided' };
    }

    const user = await this.authService.validateToken(token);
    
    if (!user) {
      return { error: 'Invalid token' };
    }

    if (body.tokenId) {
      // Revocar token específico por ID (necesitaríamos implementar este método)
      return { error: 'Token ID revocation not implemented yet' };
    } else {
      await this.authService.revokeToken(token, user.id);
    }

    return { message: 'Token revoked successfully' };
  }
}

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
  @ApiQuery({ name: 'client_type', required: false, description: 'Tipo de cliente: macos, mcp, web', enum: ['macos', 'mcp', 'web'] })
  @ApiQuery({ name: 'redirect_uri', required: false, description: 'URL de redirección personalizada' })
  @ApiResponse({ status: 302, description: 'Redirección a Google OAuth' })
  googleAuth(
    @Res() res: Response,
    @Query('client_type') clientType?: string,
    @Query('redirect_uri') redirectUri?: string
  ) {
    // Preparar el state parameter con información del cliente
    const stateData = {
      client_type: clientType || 'web',
      custom_redirect_uri: redirectUri || null,
      timestamp: Date.now()
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&` +
      `response_type=code&` +
      `scope=openid email profile&` +
      `state=${encodeURIComponent(state)}`;
    
    res.redirect(googleAuthUrl);
  }

  @Get('google/callback')
  @ApiOperation({ 
    summary: 'Callback de Google OAuth',
    description: 'Procesa la respuesta de Google OAuth y crea/actualiza usuario'
  })
  @ApiQuery({ name: 'code', required: true, description: 'Código de autorización de Google' })
  @ApiQuery({ name: 'state', required: false, description: 'Estado de redirección con información del cliente' })
  @ApiResponse({ status: 200, description: 'Autenticación exitosa - Respuesta JSON' })
  @ApiResponse({ status: 302, description: 'Autenticación exitosa - Redirección' })
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

      // Decodificar el state parameter para obtener información del cliente
      let clientType = 'web';
      let customRedirectUri = null;
      
      if (state) {
        try {
          const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
          clientType = stateData.client_type || 'web';
          customRedirectUri = stateData.custom_redirect_uri;
        } catch (error) {
          console.warn('Failed to parse state parameter:', error);
        }
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
      const token = await this.authService.createToken(user.id, `${clientType} Login`);

      // Preparar datos de usuario para respuesta
      const userInfo = {
        id: user.id,
        email: user.email,
        name: user.name,
      };

      // Responder según el tipo de cliente
      switch (clientType) {
        case 'macos':
          // Fase 1: Respuesta JSON para desarrollo
          return res.json({
            success: true,
            token: token,
            user: userInfo,
            client_type: 'macos',
            message: 'Authentication successful for macOS app',
            instructions: 'Copy this token to your macOS app for authentication',
            expires_in: '30 days'
          });

        case 'mcp':
          // Respuesta JSON para Cliente Claude/MCP
          return res.json({
            success: true,
            token: token,
            user: userInfo,
            client_type: 'mcp',
            message: 'OAuth authentication successful for MCP client',
            access_token: token, // Alias para compatibilidad
            token_type: 'Bearer'
          });

        case 'web':
        default:
          // Respuesta para API/Web normal
          if (customRedirectUri) {
            // Si hay redirect URI personalizado, redirigir
            const redirectUrl = `${customRedirectUri}?token=${token}&user=${encodeURIComponent(JSON.stringify(userInfo))}`;
            return res.redirect(redirectUrl);
          } else {
            // Si no hay frontend, respuesta JSON
            return res.json({
              success: true,
              token: token,
              user: userInfo,
              client_type: 'web',
              message: 'Authentication successful',
              expires_in: '30 days'
            });
          }
      }
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

  @Get('oauth-guide')
  @ApiOperation({ 
    summary: 'Guía de integración OAuth',
    description: 'Documentación completa para integrar con el sistema OAuth de TinyTasks'
  })
  @ApiResponse({ status: 200, description: 'Documentación de OAuth' })
  async oauthGuide() {
    return {
      title: 'TinyTasks OAuth Integration Guide',
      version: '2.0.0',
      description: 'Guía para integrar con el sistema OAuth de TinyTasks',
      endpoints: {
        start_oauth: {
          url: '/auth/google',
          method: 'GET',
          description: 'Iniciar flujo OAuth',
          parameters: {
            client_type: {
              type: 'string',
              required: false,
              options: ['macos', 'mcp', 'web'],
              default: 'web',
              description: 'Tipo de cliente que solicita autenticación'
            },
            redirect_uri: {
              type: 'string',
              required: false,
              description: 'URI de redirección personalizada (solo para client_type=web)'
            }
          }
        },
        callback: {
          url: '/auth/google/callback',
          method: 'GET',
          description: 'Callback de OAuth (manejado automáticamente por Google)',
          note: 'Este endpoint procesa la respuesta OAuth y devuelve datos apropiados según client_type'
        }
      },
      client_types: {
        macos: {
          description: 'Aplicación macOS de TinyTasks',
          flow: 'GET /auth/google?client_type=macos',
          response: 'JSON con token y datos de usuario para integración manual',
          example_url: '/auth/google?client_type=macos'
        },
        mcp: {
          description: 'Integración con servidor Claude MCP',
          flow: 'GET /auth/google?client_type=mcp',
          response: 'JSON con token para uso del servidor MCP',
          example_url: '/auth/google?client_type=mcp'
        },
        web: {
          description: 'Aplicaciones web y uso general de API',
          flow: 'GET /auth/google?client_type=web[&redirect_uri=url_personalizada]',
          response: 'Respuesta JSON o redirección a URI personalizada',
          example_url: '/auth/google?client_type=web&redirect_uri=https://miapp.com/callback'
        }
      },
      examples: {
        macos_development: {
          step1: 'Visitar: https://forgetful-production-a037.up.railway.app/auth/google?client_type=macos',
          step2: 'Completar OAuth de Google en el navegador',
          step3: 'Copiar el token de la respuesta JSON',
          step4: 'Usar token en la app macOS: Authorization: Bearer TU_TOKEN'
        },
        mcp_integration: {
          step1: 'Configurar servidor MCP para llamar: /auth/google?client_type=mcp',
          step2: 'Extraer token de la respuesta',
          step3: 'Almacenar token para futuras llamadas API',
          step4: 'Usar en requests API: Authorization: Bearer TU_TOKEN'
        },
        web_with_redirect: {
          step1: 'Redirigir usuario a: /auth/google?client_type=web&redirect_uri=TU_CALLBACK',
          step2: 'Usuario completa OAuth',
          step3: 'Usuario es redirigido a TU_CALLBACK?token=...&user=...',
          step4: 'Extraer token de parámetros URL'
        }
      },
      testing: {
        health_check: '/auth/health (si existe)',
        validate_token: '/auth/me (requiere Authorization: Bearer TOKEN)',
        api_endpoints: '/tasks, /users, etc. (todos requieren token válido)'
      }
    };
  }
}

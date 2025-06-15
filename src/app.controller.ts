import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('api')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get API status' })
  @ApiResponse({ status: 200, description: 'API is running' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'API health status' })
  getHealth() {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: 'TinyTasks API is running successfully'
    };
  }

  @Post('auth/register')
  @ApiOperation({ summary: 'Register user (demo)' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  register(@Body() body: any) {
    return {
      message: 'User registered successfully (demo mode)',
      user: { id: '123', email: body.email },
      access_token: 'demo-jwt-token'
    };
  }

  @Post('auth/login')
  @ApiOperation({ summary: 'Login user (demo)' })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  login(@Body() body: any) {
    return {
      message: 'User logged in successfully (demo mode)',
      user: { id: '123', email: body.email },
      access_token: 'demo-jwt-token'
    };
  }
}

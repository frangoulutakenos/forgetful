import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { TasksService, CreateTaskDto, UpdateTaskDto } from './tasks.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: any;
}

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Obtener todas las tareas del usuario',
    description: 'Devuelve todas las tareas del usuario autenticado, con filtro opcional por estado'
  })
  @ApiQuery({ name: 'status', required: false, enum: ['completed', 'pending'], description: 'Filtrar por estado de la tarea' })
  @ApiResponse({ status: 200, description: 'Lista de tareas obtenida exitosamente' })
  @ApiResponse({ status: 401, description: 'Token no válido o no proporcionado' })
  async findAll(@Query('status') status: string, @Req() req: AuthenticatedRequest) {
    return this.tasksService.findAll(req.user, status);
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Obtener estadísticas de tareas',
    description: 'Devuelve estadísticas de las tareas del usuario (total, completadas, pendientes, porcentaje)'
  })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
  @ApiResponse({ status: 401, description: 'Token no válido o no proporcionado' })
  async getStats(@Req() req: AuthenticatedRequest) {
    return this.tasksService.getStats(req.user);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Obtener una tarea específica',
    description: 'Devuelve una tarea específica del usuario por su ID'
  })
  @ApiParam({ name: 'id', description: 'ID de la tarea' })
  @ApiResponse({ status: 200, description: 'Tarea obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  @ApiResponse({ status: 401, description: 'Token no válido o no proporcionado' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.tasksService.findOne(id, req.user);
  }

  @Post()
  @ApiOperation({ 
    summary: 'Crear una nueva tarea',
    description: 'Crea una nueva tarea para el usuario autenticado'
  })
  @ApiBody({
    description: 'Datos de la nueva tarea',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Título de la tarea', example: 'Completar proyecto' },
        detail: { type: 'string', description: 'Descripción detallada', example: 'Finalizar la implementación del módulo de autenticación' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Prioridad de la tarea', example: 'high' }
      },
      required: ['title']
    }
  })
  @ApiResponse({ status: 201, description: 'Tarea creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'Token no válido o no proporcionado' })
  async create(@Body() createTaskDto: CreateTaskDto, @Req() req: AuthenticatedRequest) {
    return this.tasksService.create(createTaskDto, req.user);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Actualizar una tarea',
    description: 'Actualiza los datos de una tarea específica del usuario'
  })
  @ApiParam({ name: 'id', description: 'ID de la tarea' })
  @ApiBody({
    description: 'Datos a actualizar de la tarea',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Título de la tarea' },
        detail: { type: 'string', description: 'Descripción detallada' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Prioridad de la tarea' },
        isDone: { type: 'boolean', description: 'Estado de completado de la tarea' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Tarea actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  @ApiResponse({ status: 401, description: 'Token no válido o no proporcionado' })
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Req() req: AuthenticatedRequest) {
    return this.tasksService.update(id, updateTaskDto, req.user);
  }

  @Patch(':id/toggle')
  @ApiOperation({ 
    summary: 'Alternar estado de completado de una tarea',
    description: 'Cambia el estado de completado de una tarea (de pendiente a completada o viceversa)'
  })
  @ApiParam({ name: 'id', description: 'ID de la tarea' })
  @ApiResponse({ status: 200, description: 'Estado de la tarea alternado exitosamente' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  @ApiResponse({ status: 401, description: 'Token no válido o no proporcionado' })
  async toggle(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.tasksService.toggle(id, req.user);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Eliminar una tarea',
    description: 'Elimina permanentemente una tarea del usuario'
  })
  @ApiParam({ name: 'id', description: 'ID de la tarea' })
  @ApiResponse({ status: 200, description: 'Tarea eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  @ApiResponse({ status: 401, description: 'Token no válido o no proporcionado' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.tasksService.remove(id, req.user);
  }
} 
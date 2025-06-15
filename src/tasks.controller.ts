import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from "@nestjs/swagger";
import { TasksService } from "./tasks/tasks.service";
import { CreateTaskDto, UpdateTaskDto } from "./tasks/dto/task.dto";

@ApiTags("tasks")
@Controller("tasks")
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get("status")
  @ApiOperation({ 
    summary: "Obtener estado del servicio",
    description: "Devuelve el estado actual del servicio y el tipo de almacenamiento (memoria o base de datos)"
  })
  @ApiResponse({ 
    status: 200, 
    description: "Estado del servicio obtenido exitosamente",
    schema: {
      example: {
        message: "Service status",
        mode: "database",
        status: "connected",
        timestamp: "2025-06-15T03:26:52.643Z"
      }
    }
  })
  getStatus() {
    const status = this.tasksService.getStatus();
    return {
      message: "Service status",
      ...status,
      timestamp: new Date().toISOString()
    };
  }

  @Get("stats")
  @ApiOperation({ 
    summary: "Obtener estadísticas de tareas",
    description: "Devuelve estadísticas completas: total, completadas, pendientes y tasa de completación"
  })
  @ApiResponse({ 
    status: 200, 
    description: "Estadísticas obtenidas exitosamente",
    schema: {
      example: {
        message: "Statistics retrieved successfully (using database)",
        stats: {
          total: 5,
          completed: 2,
          pending: 3,
          completionRate: 40
        },
        mode: "database",
        dbStatus: "connected",
        timestamp: "2025-06-15T03:26:59.026Z"
      }
    }
  })
  async getTaskStats() {
    const stats = await this.tasksService.getStats("123");
    const status = this.tasksService.getStatus();
    return {
      message: `Statistics retrieved successfully (using ${status.mode})`,
      stats,
      mode: status.mode,
      dbStatus: status.status,
      timestamp: new Date().toISOString()
    };
  }

  @Get()
  @ApiOperation({ 
    summary: "Obtener todas las tareas",
    description: "Devuelve todas las tareas, opcionalmente filtradas por estado"
  })
  @ApiQuery({ 
    name: "status", 
    required: false, 
    enum: ["completed", "pending"],
    description: "Filtrar tareas por estado de completado"
  })
  @ApiResponse({ 
    status: 200, 
    description: "Tareas obtenidas exitosamente",
    schema: {
      example: {
        message: "Tasks retrieved successfully (using database)",
        tasks: [
          {
            id: "cb1deb64-47c0-4b5d-93c3-051a5d90a177",
            title: "Completar documentación",
            detail: "Escribir documentación completa",
            priority: "high",
            isDone: false,
            userId: "123",
            createdAt: "2025-06-15T06:27:08.236Z",
            updatedAt: "2025-06-15T06:27:08.236Z"
          }
        ],
        total: 1,
        mode: "database",
        dbStatus: "connected",
        timestamp: "2025-06-15T03:26:59.228Z"
      }
    }
  })
  async getAllTasks(@Query("status") status?: string) {
    const tasks = await this.tasksService.findAll(status, "123");
    const serviceStatus = this.tasksService.getStatus();
    return {
      message: `Tasks retrieved successfully (using ${serviceStatus.mode})`,
      tasks,
      total: tasks.length,
      mode: serviceStatus.mode,
      dbStatus: serviceStatus.status,
      timestamp: new Date().toISOString()
    };
  }

  @Post()
  @ApiOperation({ 
    summary: "Crear nueva tarea",
    description: "Crea una nueva tarea con los datos proporcionados"
  })
  @ApiBody({ type: CreateTaskDto })
  @ApiResponse({ 
    status: 201, 
    description: "Tarea creada exitosamente",
    schema: {
      example: {
        message: "Task created successfully (using database)",
        task: {
          id: "a91ea068-2480-462e-ac9e-dca24f36441d",
          title: "Nueva tarea",
          detail: "Descripción de la tarea",
          priority: "medium",
          isDone: false,
          userId: "123",
          createdAt: "2025-06-15T06:27:34.064Z",
          updatedAt: "2025-06-15T06:27:34.064Z"
        },
        mode: "database",
        dbStatus: "connected",
        timestamp: "2025-06-15T03:27:33.782Z"
      }
    }
  })
  async createTask(@Body() createTaskDto: CreateTaskDto) {
    const task = await this.tasksService.create({
      title: createTaskDto.title,
      detail: createTaskDto.detail,
      priority: createTaskDto.priority,
      userId: createTaskDto.userId || "123"
    });
    const status = this.tasksService.getStatus();
    return {
      message: `Task created successfully (using ${status.mode})`,
      task,
      mode: status.mode,
      dbStatus: status.status,
      timestamp: new Date().toISOString()
    };
  }

  @Get(":id")
  @ApiOperation({ 
    summary: "Obtener tarea por ID",
    description: "Devuelve una tarea específica por su ID único"
  })
  @ApiParam({ 
    name: "id", 
    description: "ID único de la tarea",
    example: "cb1deb64-47c0-4b5d-93c3-051a5d90a177"
  })
  @ApiResponse({ 
    status: 200, 
    description: "Tarea encontrada exitosamente"
  })
  @ApiResponse({ 
    status: 404, 
    description: "Tarea no encontrada"
  })
  async getTask(@Param("id") id: string) {
    try {
      const task = await this.tasksService.findOne(id, "123");
      const status = this.tasksService.getStatus();
      if (!task) {
        return {
          message: "Task not found",
          error: "Not Found",
          statusCode: 404
        };
      }
      return {
        message: `Task retrieved successfully (using ${status.mode})`,
        task,
        mode: status.mode,
        dbStatus: status.status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        message: "Task not found",
        error: "Not Found",
        statusCode: 404
      };
    }
  }

  @Patch(":id")
  @ApiOperation({ 
    summary: "Actualizar tarea",
    description: "Actualiza los campos especificados de una tarea existente"
  })
  @ApiParam({ 
    name: "id", 
    description: "ID único de la tarea a actualizar",
    example: "cb1deb64-47c0-4b5d-93c3-051a5d90a177"
  })
  @ApiBody({ type: UpdateTaskDto })
  @ApiResponse({ 
    status: 200, 
    description: "Tarea actualizada exitosamente"
  })
  @ApiResponse({ 
    status: 404, 
    description: "Tarea no encontrada"
  })
  async updateTask(@Param("id") id: string, @Body() updateTaskDto: UpdateTaskDto) {
    try {
      const task = await this.tasksService.update(id, updateTaskDto, "123");
      const status = this.tasksService.getStatus();
      return {
        message: `Task updated successfully (using ${status.mode})`,
        task,
        mode: status.mode,
        dbStatus: status.status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        message: "Task not found",
        error: "Not Found",
        statusCode: 404
      };
    }
  }

  @Patch(":id/toggle")
  @ApiOperation({ 
    summary: "Alternar estado de completado",
    description: "Cambia el estado de completado de una tarea (de completada a pendiente o viceversa)"
  })
  @ApiParam({ 
    name: "id", 
    description: "ID único de la tarea",
    example: "cb1deb64-47c0-4b5d-93c3-051a5d90a177"
  })
  @ApiResponse({ 
    status: 200, 
    description: "Estado de la tarea alternado exitosamente"
  })
  @ApiResponse({ 
    status: 404, 
    description: "Tarea no encontrada"
  })
  async toggleTask(@Param("id") id: string) {
    try {
      const task = await this.tasksService.toggle(id, "123");
      const status = this.tasksService.getStatus();
      return {
        message: `Task status toggled successfully (using ${status.mode})`,
        task,
        mode: status.mode,
        dbStatus: status.status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        message: "Task not found",
        error: "Not Found",
        statusCode: 404
      };
    }
  }

  @Delete(":id")
  @ApiOperation({ 
    summary: "Eliminar tarea",
    description: "Elimina permanentemente una tarea del sistema"
  })
  @ApiParam({ 
    name: "id", 
    description: "ID único de la tarea a eliminar",
    example: "cb1deb64-47c0-4b5d-93c3-051a5d90a177"
  })
  @ApiResponse({ 
    status: 200, 
    description: "Tarea eliminada exitosamente"
  })
  @ApiResponse({ 
    status: 404, 
    description: "Tarea no encontrada"
  })
  async deleteTask(@Param("id") id: string) {
    try {
      const deletedTask = await this.tasksService.remove(id, "123");
      const status = this.tasksService.getStatus();
      return {
        message: `Task deleted successfully (using ${status.mode})`,
        deletedTask,
        mode: status.mode,
        dbStatus: status.status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        message: "Task not found",
        error: "Not Found",
        statusCode: 404
      };
    }
  }
}
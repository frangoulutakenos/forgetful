import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Task } from "./entities/task.entity";

export interface CreateTaskDto {
  title: string;
  detail?: string;
  priority?: string;
  userId: string;
}

export interface UpdateTaskDto {
  title?: string;
  detail?: string;
  priority?: string;
  isDone?: boolean;
}

// Datos de fallback en memoria
let memoryTasks = [
  { id: "1", title: "Completar documentación de la API", detail: "Escribir documentación completa", priority: "high", isDone: false, createdAt: new Date(), updatedAt: new Date(), userId: "123" },
  { id: "2", title: "Revisar código de la aplicación", detail: "Hacer code review y optimizaciones", priority: "medium", isDone: true, createdAt: new Date(), updatedAt: new Date(), userId: "123" },
  { id: "3", title: "Configurar base de datos", detail: null, priority: "low", isDone: false, createdAt: new Date(), updatedAt: new Date(), userId: "123" }
];

@Injectable()
export class TasksService implements OnModuleInit {
  private useDatabase = false;
  private dbStatus = "checking";

  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async onModuleInit() {
    await this.checkDatabaseConnection();
  }

  private async checkDatabaseConnection() {
    try {
      console.log("🔗 Verificando conexión a la base de datos...");
      await this.tasksRepository.query("SELECT 1");
      console.log("✅ Base de datos conectada correctamente");
      this.useDatabase = true;
      this.dbStatus = "connected";
      
      // Migrar datos de memoria a DB si está vacía
      const count = await this.tasksRepository.count();
      if (count === 0) {
        console.log("📦 Migrando datos iniciales a la base de datos...");
        for (const task of memoryTasks) {
          await this.tasksRepository.save({
            title: task.title,
            detail: task.detail,
            priority: task.priority,
            isDone: task.isDone,
            userId: task.userId
          });
        }
        console.log("✅ Datos iniciales migrados");
      }
    } catch (error) {
      console.log("⚠️  Base de datos no disponible:", error.message);
      console.log("🔄 Usando datos en memoria como fallback");
      this.useDatabase = false;
      this.dbStatus = "memory_fallback";
    }
  }

  getStatus() {
    return {
      mode: this.useDatabase ? "database" : "memory",
      status: this.dbStatus
    };
  }

  async findAll(status?: string, userId?: string): Promise<any[]> {
    if (!this.useDatabase) {
      let filtered = [...memoryTasks];
      if (status === "completed") filtered = memoryTasks.filter(task => task.isDone);
      if (status === "pending") filtered = memoryTasks.filter(task => !task.isDone);
      return filtered;
    }

    const query = this.tasksRepository.createQueryBuilder("task");
    if (userId) query.where("task.userId = :userId", { userId });
    if (status === "completed") query.andWhere("task.isDone = :isDone", { isDone: true });
    else if (status === "pending") query.andWhere("task.isDone = :isDone", { isDone: false });
    return query.getMany();
  }

  async findOne(id: string, userId?: string): Promise<any | null> {
    if (!this.useDatabase) {
      return memoryTasks.find(t => t.id === id) || null;
    }

    const query = this.tasksRepository.createQueryBuilder("task").where("task.id = :id", { id });
    if (userId) query.andWhere("task.userId = :userId", { userId });
    return query.getOne();
  }

  async create(createTaskDto: CreateTaskDto): Promise<any> {
    if (!this.useDatabase) {
      const newTask = {
        id: (memoryTasks.length + 1).toString(),
        title: createTaskDto.title,
        detail: createTaskDto.detail || null,
        priority: createTaskDto.priority || "medium",
        isDone: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: createTaskDto.userId
      };
      memoryTasks.push(newTask);
      return newTask;
    }

    const task = this.tasksRepository.create({
      title: createTaskDto.title,
      detail: createTaskDto.detail || null,
      priority: createTaskDto.priority || "medium",
      userId: createTaskDto.userId
    });
    return this.tasksRepository.save(task);
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId?: string): Promise<any> {
    if (!this.useDatabase) {
      const taskIndex = memoryTasks.findIndex(t => t.id === id);
      if (taskIndex === -1) throw new Error("Task not found");
      Object.assign(memoryTasks[taskIndex], updateTaskDto, { updatedAt: new Date() });
      return memoryTasks[taskIndex];
    }

    const task = await this.findOne(id, userId);
    if (!task) throw new Error("Task not found");
    Object.assign(task, updateTaskDto);
    return this.tasksRepository.save(task);
  }

  async toggle(id: string, userId?: string): Promise<any> {
    if (!this.useDatabase) {
      const taskIndex = memoryTasks.findIndex(t => t.id === id);
      if (taskIndex === -1) throw new Error("Task not found");
      memoryTasks[taskIndex].isDone = !memoryTasks[taskIndex].isDone;
      memoryTasks[taskIndex].updatedAt = new Date();
      return memoryTasks[taskIndex];
    }

    const task = await this.findOne(id, userId);
    if (!task) throw new Error("Task not found");
    task.isDone = !task.isDone;
    return this.tasksRepository.save(task);
  }

  async remove(id: string, userId?: string): Promise<any> {
    if (!this.useDatabase) {
      const taskIndex = memoryTasks.findIndex(t => t.id === id);
      if (taskIndex === -1) throw new Error("Task not found");
      return memoryTasks.splice(taskIndex, 1)[0];
    }

    const task = await this.findOne(id, userId);
    if (!task) throw new Error("Task not found");
    await this.tasksRepository.remove(task);
    return task;
  }

  async getStats(userId?: string): Promise<any> {
    if (!this.useDatabase) {
      const total = memoryTasks.length;
      const completed = memoryTasks.filter(task => task.isDone).length;
      const pending = total - completed;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { total, completed, pending, completionRate };
    }

    const query = this.tasksRepository.createQueryBuilder("task");
    if (userId) query.where("task.userId = :userId", { userId });
    const total = await query.getCount();
    const completedQuery = this.tasksRepository.createQueryBuilder("task");
    if (userId) completedQuery.where("task.userId = :userId", { userId });
    const completed = await completedQuery.andWhere("task.isDone = :isDone", { isDone: true }).getCount();
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, completionRate };
  }
}
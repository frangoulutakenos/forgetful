// Clean TasksService

import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Task } from "./entities/task.entity";
import { User } from "../users/entities/user.entity";

export interface CreateTaskDto {
  title: string;
  detail?: string;
  priority?: string;
}

export interface UpdateTaskDto {
  title?: string;
  detail?: string;
  priority?: string;
  isDone?: boolean;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async findAll(user: User, status?: string): Promise<Task[]> {
    const query = this.tasksRepository.createQueryBuilder("task")
      .where("task.userId = :userId", { userId: user.id });
    
    if (status === "completed") {
      query.andWhere("task.isDone = :isDone", { isDone: true });
    } else if (status === "pending") {
      query.andWhere("task.isDone = :isDone", { isDone: false });
    }
    
    return query.orderBy("task.createdAt", "DESC").getMany();
  }

  async findOne(id: string, user: User): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id, userId: user.id }
    });
    
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    
    return task;
  }

  async create(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const task = this.tasksRepository.create({
      title: createTaskDto.title,
      detail: createTaskDto.detail || null,
      priority: createTaskDto.priority || "medium",
      userId: user.id
    });
    
    return this.tasksRepository.save(task);
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, user: User): Promise<Task> {
    const task = await this.findOne(id, user);
    Object.assign(task, updateTaskDto);
    return this.tasksRepository.save(task);
  }

  async toggle(id: string, user: User): Promise<Task> {
    const task = await this.findOne(id, user);
    task.isDone = !task.isDone;
    return this.tasksRepository.save(task);
  }

  async remove(id: string, user: User): Promise<Task> {
    const task = await this.findOne(id, user);
    await this.tasksRepository.remove(task);
    return task;
  }

  async getStats(user: User): Promise<any> {
    const total = await this.tasksRepository.count({
      where: { userId: user.id }
    });
    
    const completed = await this.tasksRepository.count({
      where: { userId: user.id, isDone: true }
    });
    
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, pending, completionRate };
  }
}

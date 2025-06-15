import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsIn, IsBoolean } from "class-validator";

export class CreateTaskDto {
  @ApiProperty({
    description: "Título de la tarea",
    example: "Completar documentación de la API",
    minLength: 1,
    maxLength: 255
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: "Descripción detallada de la tarea",
    example: "Escribir documentación completa con ejemplos",
    required: false
  })
  @IsOptional()
  @IsString()
  detail?: string;

  @ApiProperty({
    description: "Prioridad de la tarea",
    enum: ["low", "medium", "high"],
    example: "high",
    default: "medium"
  })
  @IsOptional()
  @IsIn(["low", "medium", "high"])
  priority?: string;

  @ApiProperty({
    description: "ID del usuario propietario",
    example: "123",
    default: "123"
  })
  @IsString()
  userId: string;
}

export class UpdateTaskDto {
  @ApiProperty({
    description: "Título de la tarea",
    example: "Completar documentación actualizada",
    required: false
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: "Descripción detallada de la tarea",
    example: "Documentación con nuevos endpoints",
    required: false
  })
  @IsOptional()
  @IsString()
  detail?: string;

  @ApiProperty({
    description: "Prioridad de la tarea",
    enum: ["low", "medium", "high"],
    example: "medium",
    required: false
  })
  @IsOptional()
  @IsIn(["low", "medium", "high"])
  priority?: string;

  @ApiProperty({
    description: "Estado de completado de la tarea",
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isDone?: boolean;
}
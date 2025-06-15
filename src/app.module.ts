import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks/tasks.service";
import { Task } from "./tasks/entities/task.entity";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get("DATABASE_URL");
        console.log("🔗 Configurando conexión a Railway PostgreSQL...");
        console.log("📍 URL configurada:", databaseUrl ? "Sí" : "No");
        
        return {
          type: "postgres",
          url: databaseUrl,
          entities: [Task],
          synchronize: true,
          ssl: {
            rejectUnauthorized: false
          },
          connectTimeoutMS: 30000,
          acquireTimeoutMS: 30000,
          timeout: 30000,
          retryAttempts: 5,
          retryDelay: 5000,
          extra: {
            connectionLimit: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 30000,
          }
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Task]),
  ],
  controllers: [AppController, TasksController],
  providers: [AppService, TasksService],
})
export class AppModule {}
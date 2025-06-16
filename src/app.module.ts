import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks/tasks.service";
import { Task } from "./tasks/entities/task.entity";
import { User } from "./users/entities/user.entity";
import { UserToken } from "./users/entities/user-token.entity";
import { AuthController } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";
import { AuthMiddleware } from "./auth/auth.middleware";

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
          entities: [Task, User, UserToken],
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
    TypeOrmModule.forFeature([Task, User, UserToken]),
  ],
  controllers: [AppController, TasksController, AuthController],
  providers: [AppService, TasksService, AuthService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes('*'); // Aplicar a todas las rutas
  }
}
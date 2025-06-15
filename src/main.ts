import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle("TinyTasks API")
    .setDescription("API completa para gestión de tareas con PostgreSQL")
    .setVersion("1.0")
    .addTag("tasks", "Operaciones CRUD para tareas")
    .addTag("status", "Estado del sistema y estadísticas")
    .addServer("http://localhost:3000", "Servidor de desarrollo")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document, {
    customSiteTitle: "TinyTasks API Documentation",
    customfavIcon: "https://nestjs.com/img/logo_text.svg",
    customJs: [
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js",
    ],
    customCssUrl: [
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css",
    ],
  });

  console.log("🚀 Aplicación iniciada en http://localhost:3000");
  console.log("📚 Documentación Swagger disponible en http://localhost:3000/api");
  
  const port = process.env.PORT || 3000; await app.listen(port, "0.0.0.0");
}
bootstrap();
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TasksService } from '../tasks/tasks.service';

async function cleanupDatabase() {
  console.log('🧹 Iniciando limpieza de base de datos...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const tasksService = app.get(TasksService);

  try {
    // Obtener todas las tareas existentes
    const allTasks = await tasksService.findAll(undefined, '123'); // Usuario por defecto
    console.log(`📊 Tareas encontradas: ${allTasks.length}`);

    // Eliminar todas las tareas una por una
    for (const task of allTasks) {
      await tasksService.remove(task.id, '123');
      console.log(`🗑️  Eliminada tarea: ${task.title}`);
    }

    console.log('✅ Limpieza completada exitosamente');
    console.log('🎯 La base de datos está lista para el sistema OAuth');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await app.close();
  }
}

// Ejecutar script si se llama directamente
if (require.main === module) {
  cleanupDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

export { cleanupDatabase }; 
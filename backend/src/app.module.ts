import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TodoController } from "./todo.controller";
import { TodoService } from "./todo.service";
import { Todo } from "./todo.orm-entity";

@Module({
  imports: [
    // TypeORM forRoot is a trusted method; false positive from strict ESLint rules.

    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "db",
      port: parseInt(process.env.DB_PORT || "5432", 10),
      username: process.env.DB_USER || "taskuser",
      password: process.env.DB_PASS || "taskpass",
      database: process.env.DB_NAME || "taskmanager",
      entities: [Todo],
      synchronize: false,
      autoLoadEntities: true,
    }),

    // TypeORM forFeature is a trusted method; false positive from strict ESLint rules.

    TypeOrmModule.forFeature([Todo]),
  ],
  controllers: [AppController, TodoController],
  providers: [AppService, TodoService],
})
export class AppModule {}

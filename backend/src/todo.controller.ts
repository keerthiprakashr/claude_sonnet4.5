import { Controller, Get, Post, Delete, Body, Param } from "@nestjs/common";
import { AppLogger } from "./logger";
import { TodoService } from "./todo.service";
// Removed unused imports: TodoItem, TodoStatus, TodoPriority (not referenced in this file)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { TodoItem } from "./todo.entity";
// Removed unused imports: TodoStatus, TodoPriority (not referenced in this file)

@Controller("todos")
export class TodoController {
  private logger = AppLogger.getInstance();
  constructor(private readonly todoService: TodoService) {}

  @Post()
  async create(@Body() todo: Omit<any, "id">) {
    this.logger.log("Received request to create todo", todo);
    return this.todoService.create(todo);
  }

  @Get()
  async findAll() {
    this.logger.log("Received request to fetch all todos");
    return this.todoService.findAll();
  }

  @Delete(":id")
  async delete(@Param("id") id: string) {
    this.logger.log("Received request to delete todo", { id });
    return { success: await this.todoService.delete(id) };
  }
}

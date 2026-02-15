import { Controller, Get, Post, Delete, Body, Param } from "@nestjs/common";
import { TodosService } from "./todos.service";
import { CreateTodoDto } from "./dto/create-todo.dto";
import { Todo } from "./entities/todo.entity"; // Adjusted import path

// Controller = API Layer (Layered Architecture, SRP)
// Uses Dependency Injection for service (DI Pattern, DIP)
@Controller("todos")
export class TodosController {
  constructor(private readonly todosService: TodosService) {} // DI Pattern

  // RESTful endpoint (RESTful API, Layered Architecture)
  @Get()
  findAll(): Todo[] {
    console.log('🔍 DEBUG: Hot reload test - Finding all todos');
    // Explicitly type the return value for safety
    return this.todosService.findAll();
  }

  // Uses DTO for validation (DTO Pattern, ISP)
  @Post()
  create(@Body() createTodoDto: CreateTodoDto): Todo {
    // Explicitly type the return value for safety
    return this.todosService.create(createTodoDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string): { success: boolean } {
    // Return a typed object for safety
    return { success: this.todosService.remove(id) };
  }
}

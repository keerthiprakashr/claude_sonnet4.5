import { Injectable } from "@nestjs/common";
import { CreateTodoDto, StatusEnum } from "./dto/create-todo.dto";
import { Todo } from "./entities/todo.entity";
import { v4 as uuidv4 } from "uuid";

// Service = Business Logic Layer (Layered Architecture, SRP)
// Injectable = Singleton Pattern (by default in NestJS), DI Pattern
@Injectable()
export class TodosService {
  // Repository Pattern: abstracts data access (could be a DB or in-memory)
  private todos: Todo[] = [];

  findAll(): Todo[] {
    return this.todos;
  }

  create(createTodoDto: CreateTodoDto): Todo {
    // DTO Pattern: input validation and transformation
    const todo: Todo = {
      // ...populate fields...
      ...createTodoDto,
      id: uuidv4(),
      createdAt: new Date(),
      title: createTodoDto.item, // Map 'item' to 'title'
      completed: createTodoDto.status === StatusEnum.Completed, // Derive 'completed' from 'status' using enum
    };
    this.todos.push(todo);
    return todo;
  }

  remove(id: string): boolean {
    const idx = this.todos.findIndex((t) => t.id === id);
    if (idx >= 0) {
      this.todos.splice(idx, 1);
      return true;
    }
    return false;
  }
}

// TypeORM repository and methods are trusted; these are false positives from strict ESLint rules.
import { Injectable } from "@nestjs/common";
import { AppLogger } from "./logger";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Todo } from "./todo.orm-entity";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepo: Repository<Todo>,
  ) {}

  private logger = AppLogger.getInstance();

  // TypeORM repository methods are trusted; disables are for false positives from strict ESLint rules.

  async create(todo: Omit<Todo, "id">): Promise<Todo> {
    const newTodo = this.todoRepo.create({ ...todo, id: uuidv4() });
    this.logger.log("Creating new todo", { item: todo.item });

    return this.todoRepo.save(newTodo);
  }

  async findAll(): Promise<Todo[]> {
    this.logger.log("Fetching all todos");

    return this.todoRepo.find();
  }

  async delete(id: string): Promise<boolean> {
    this.logger.log("Deleting todo", { id });

    const res = await this.todoRepo.delete(id);

    return !!res.affected && res.affected > 0;
  }
}

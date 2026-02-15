// disable prettier for better readability in test files

import { Test, TestingModule } from "@nestjs/testing";
import { TodosService } from "../../src/todos/todos.service";

describe("TodosService (unit)", () => {
  let service: TodosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TodosService],
    }).compile();
    service = module.get<TodosService>(TodosService);
  });

  afterEach(() => {
    // Remove all todos after each test to ensure clean state
    const todos = service.findAll();
    todos.forEach((todo) => service.remove(todo.id));
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should create a todo", () => {
    const todo = service.create({
      item: "Test task",
      status: "pending",
      priority: "low",
      dueDate: "2026-01-12",
    } as any);
    expect(todo).toHaveProperty("id");
    expect(todo.item).toBe("Test task");
    expect(todo.status).toBe("pending");
    expect(todo.priority).toBe("low");
    expect(todo.dueDate).toBe("2026-01-12");
    expect(todo.completed).toBe(false);
  });

  it("should return all todos", () => {
    service.create({
      item: "A",
      status: "pending",
      priority: "low",
      dueDate: "2026-01-12",
    } as any);
    service.create({
      item: "B",
      status: "completed",
      priority: "high",
      dueDate: "2026-01-13",
    } as any);
    const todos = service.findAll();
    expect(todos.length).toBeGreaterThanOrEqual(2);
  });

  it("should remove a todo by id", () => {
    const todo = service.create({
      item: "To be removed",
      status: "pending",
      priority: "low",
      dueDate: "2026-01-12",
    } as any);
    const removed = service.remove(todo.id);
    expect(removed).toBe(true);
    expect(service.findAll().find((t) => t.id === todo.id)).toBeUndefined();
  });
});

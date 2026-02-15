// Set DB_HOST and DB_PORT for test DB connection before any imports
const originalDbPort = process.env.DB_PORT;
const originalDbHost = process.env.DB_HOST;
process.env.DB_PORT = "55432";
process.env.DB_HOST = "localhost";

// disable ESLINT rules for test files as they may involve dynamic data and mocks
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// disable prettier for better readability in test files
/* prettier-ignore */

import request from 'supertest';
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { AppModule } from "../../src/app.module";

describe("Todos API (component)", () => {
  // Restore DB_PORT and DB_HOST after tests
  afterAll(() => {
    if (originalDbPort !== undefined) {
      process.env.DB_PORT = originalDbPort;
    } else {
      delete process.env.DB_PORT;
    }
    if (originalDbHost !== undefined) {
      process.env.DB_HOST = originalDbHost;
    } else {
      delete process.env.DB_HOST;
    }
  });
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("/todos (POST) should create a todo", async () => {
    let createdId: string | undefined;
    try {
      const res = await request(app.getHttpServer()).post("/todos").send({
        item: "Integration test task",
        status: "pending",
        priority: "medium",
        dueDate: "2026-01-15",
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.item).toBe("Integration test task");
      createdId = res.body.id;
    } finally {
      if (createdId) {
        await request(app.getHttpServer()).delete(`/todos/${createdId}`);
      }
    }
  });

  it("/todos (GET) should return todos", async () => {
    const res = await request(app.getHttpServer()).get("/todos");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("/todos/:id (DELETE) should delete a todo", async () => {
    let id: string | undefined;
    try {
      // First, create a todo
      const createRes = await request(app.getHttpServer()).post("/todos").send({
        item: "To be deleted",
        status: "pending",
        priority: "low",
        dueDate: "2026-01-16",
      });
      id = createRes.body.id;
      // Now, delete it
      const deleteRes = await request(app.getHttpServer()).delete(
        `/todos/${id}`,
      );
      expect(deleteRes.status).toBe(200);
    } finally {
      if (id) {
        // Try to delete again in case test failed before deletion
        await request(app.getHttpServer()).delete(`/todos/${id}`);
      }
    }
  });
});

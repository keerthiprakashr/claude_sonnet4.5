import React, { useEffect, useState } from "react";
import axios from "axios";
import Logger from "../logger";
import { TodoList } from "../components/TodoList";

export type TodoItem = {
  id: string;
  status: string;
  item: string;
  priority: string;
  dueDate: string;
  createdAt: string;
};

const API_BASE = "http://localhost:4000/todos"; // Update if backend runs elsewhere

// Container Component (Container/Presentational Pattern, SRP)
// Uses React Hooks for state and side effects (Hooks Pattern)
// Dependency Inversion Principle: API logic can be abstracted
export default function TodoListPage() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState({
    item: "",
    priority: "",
    dueDate: "",
    status: "pending",
  });
  const [loading, setLoading] = useState(false);

  const logger = Logger.getInstance();
  const fetchTodos = async () => {
    setLoading(true);
    try {
      logger.info("Fetching todos from API");
      const res = await axios.get<TodoItem[]>(API_BASE);
      setTodos(res.data);
      logger.info("Fetched todos", res.data);
    } catch (err) {
      logger.error("Failed to fetch todos", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchTodos();
  }, []);

  const handleAddTodo = async () => {
    try {
      logger.info("Adding new todo", newTodo);
      await axios.post(API_BASE, newTodo);
      setNewTodo({ item: "", priority: "", dueDate: "", status: "pending" });
      void fetchTodos();
      logger.info("Added new todo");
    } catch (err) {
      logger.error("Failed to add todo", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_BASE}/${id}`);
      void fetchTodos();
    } catch (err) {
      console.error("Failed to delete todo", err);
    }
  };

  return (
    <main style={{ maxWidth: 600, margin: "auto", padding: 24 }}>
      <h1>Task Manager</h1>
      <section>
        <h2>Add New Task</h2>
        <input
          placeholder="Task description"
          value={newTodo.item}
          onChange={(e) => setNewTodo({ ...newTodo, item: e.target.value })}
        />
        <select
          value={newTodo.priority}
          onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value })}
          style={{ marginRight: 8 }}
        >
          <option value="">Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input
          type="date"
          value={newTodo.dueDate}
          onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
        />
        <select
          value={newTodo.status}
          onChange={(e) => setNewTodo({ ...newTodo, status: e.target.value })}
        >
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
        <button
          onClick={() => {
            void handleAddTodo();
          }}
        >
          Add Task
        </button>
      </section>
      <section>
        <h2>All Tasks</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <TodoList
            todos={todos.map((todo) => ({
              ...todo,
              status: todo.status as "pending" | "completed",
              priority: ["low", "medium", "high"].includes(todo.priority)
                ? (todo.priority as "low" | "medium" | "high")
                : "low",
            }))}
            onDelete={(id) => {
              void handleDelete(id);
            }}
          />
        )}
      </section>
    </main>
  );
}

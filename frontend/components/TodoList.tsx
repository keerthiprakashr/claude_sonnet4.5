// Presentational Component (Component-Based Architecture, SRP)
// Follows Functional Programming principles (stateless, pure)
// Open/Closed Principle: Can be extended via props
import React from "react";
import { Todo } from "../types";

type Props = {
  todos: Todo[];
  onDelete: (id: string) => void;
};

export const TodoList: React.FC<Props> = ({ todos, onDelete }) => (
  <table style={{ width: "100%", borderCollapse: "collapse" }}>
    <thead>
      <tr>
        <th style={{ border: "1px solid #ccc", padding: 8 }}>Status</th>
        <th style={{ border: "1px solid #ccc", padding: 8 }}>Task</th>
        <th style={{ border: "1px solid #ccc", padding: 8 }}>Priority</th>
        <th style={{ border: "1px solid #ccc", padding: 8 }}>Due Date</th>
        <th style={{ border: "1px solid #ccc", padding: 8 }}>Created At</th>
        <th style={{ border: "1px solid #ccc", padding: 8 }}>Delete</th>
      </tr>
    </thead>
    <tbody>
      {todos.map((todo) => (
        <tr key={todo.id}>
          <td style={{ border: "1px solid #ccc", padding: 8 }}>
            {todo.status}
          </td>
          <td style={{ border: "1px solid #ccc", padding: 8 }}>{todo.item}</td>
          <td style={{ border: "1px solid #ccc", padding: 8 }}>
            {todo.priority}
          </td>
          <td style={{ border: "1px solid #ccc", padding: 8 }}>
            {todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : "N/A"}
          </td>
          <td style={{ border: "1px solid #ccc", padding: 8 }}>
            {todo.createdAt ? new Date(todo.createdAt).toISOString() : "N/A"}
          </td>
          <td style={{ border: "1px solid #ccc", padding: 8 }}>
            <button style={{ marginTop: 0 }} onClick={() => onDelete(todo.id)}>
              Delete
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

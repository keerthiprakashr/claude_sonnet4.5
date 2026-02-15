export enum TodoStatus {
  PENDING = "pending",
  COMPLETED = "completed",
}

export enum TodoPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export interface TodoItem {
  id: string;
  item: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate: string; // ISO date string
  createdAt: string; // ISO date string
}

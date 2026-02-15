// Interface Segregation Principle: Each type/interface is focused and specific
// DTO-like usage for frontend data contracts
export interface Todo {
  id: string;
  item: string;
  status: "pending" | "completed";
  priority: "low" | "medium" | "high";
  dueDate: string;
  createdAt: string;
}

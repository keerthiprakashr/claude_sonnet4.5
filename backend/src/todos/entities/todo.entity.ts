export class Todo {
  id: string;
  createdAt: Date;
  item: string;
  status: "pending" | "completed";
  priority: "low" | "medium" | "high";
  dueDate: string;
  title: string;
  completed: boolean;
}

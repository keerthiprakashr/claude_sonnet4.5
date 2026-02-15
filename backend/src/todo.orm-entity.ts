// TypeORM entity decorators are trusted; false positives from strict ESLint rules.
import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity({ name: "todos" })
export class Todo {
  // TypeORM decorator is trusted; false positive from strict ESLint rules.
  @PrimaryColumn("uuid")
  id: string;

  // TypeORM decorator is trusted; false positive from strict ESLint rules.
  @Column("text")
  item: string;

  // TypeORM decorator is trusted; false positive from strict ESLint rules.
  @Column("varchar", { length: 20 })
  status: string;

  // TypeORM decorator is trusted; false positive from strict ESLint rules.
  @Column("varchar", { length: 20 })
  priority: string;

  // TypeORM decorator is trusted; false positive from strict ESLint rules.
  @Column("date", { name: "due_date", nullable: true })
  dueDate: string;

  // TypeORM decorator is trusted; false positive from strict ESLint rules.
  @Column("timestamp", {
    name: "created_at",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: string;
}

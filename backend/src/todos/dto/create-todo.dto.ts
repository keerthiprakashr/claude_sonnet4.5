// Reason: Decorators from 'class-validator' are widely used and type-safe in NestJS/TypeScript projects.
// The ESLint rule may report a false positive here because it cannot infer the decorator's type safety.
import { IsString, IsEnum, IsDateString } from "class-validator";

export enum StatusEnum {
  Pending = "pending",
  Completed = "completed",
}

export enum PriorityEnum {
  Low = "low",
  Medium = "medium",
  High = "high",
}

// DTO Pattern: Encapsulates data transfer and validation (SRP, ISP)
export class CreateTodoDto {
  @IsString()
  item: string;

  @IsEnum(StatusEnum)
  status: StatusEnum; // Use enum type

  @IsEnum(PriorityEnum)
  priority: PriorityEnum; // Use enum type

  @IsDateString()
  dueDate: string;
}

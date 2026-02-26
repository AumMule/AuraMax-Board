export type TaskStatus = "todo" | "doing" | "done";

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  urgency: number; // 1-5
  impact: number;  // 1-5
  createdAt: number;
  statusChangedAt: number;
  checklists: ChecklistItem[];
  description?: string;
}
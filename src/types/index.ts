import { Timestamp } from 'firebase/firestore';

export interface Project {
  id: string;
  name: string;
  color: string; // hex color for project dot
  createdAt: Timestamp;
  updatedAt: Timestamp;
  taskCount: number; // denormalized for performance
  description?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'done';
  dueDate: Timestamp | null;
  projectId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Timestamp;
  order: number;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

// UI State Types
export type ViewType = 'tasks' | 'projects';
export type GroupBy = 'status' | 'project' | 'priority';
export type TaskStatus = Task['status'];
export type TaskPriority = Task['priority'];

// Component Props Types
export interface TaskCardProps {
  task: Task;
  subtasks: Subtask[];
  onTaskClick: (taskId: string) => void;
  onSubtaskToggle: (subtaskId: string) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
}

export interface SidebarProps {
  projects: Project[];
  currentView: string;
  onViewChange: (view: ViewType) => void;
  onProjectSelect: (projectId: string) => void;
}

export interface TaskListProps {
  tasks: Task[];
  groupBy: GroupBy;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
}

// Context Types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export interface AppContextType {
  projects: Project[];
  tasks: Task[];
  currentView: ViewType;
  selectedProjectId: string | null;
  loading: boolean;
  error: string | null;
  showConfirmation: (options: {
    title: string;
    message: string;
    onConfirm: () => void;
  }) => void;
  setCurrentView: (view: ViewType) => void;
  setSelectedProjectId: (projectId: string | null) => void;
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'taskCount'>) => Promise<void>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => Promise<string>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
} 
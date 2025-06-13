import React from 'react';
import { TaskCard } from './TaskCard';
import { useApp } from '../../contexts/AppContext';
import type { Task } from '../../types';
import styles from './TaskList.module.css';

interface TaskListProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => Promise<void>;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onTaskUpdate,
  onTaskDelete,
}) => {
  // Group tasks by status
  const todoTasks = tasks.filter(task => task.status === 'todo');
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress');
  const doneTasks = tasks.filter(task => task.status === 'done');

  return (
    <div className={styles.taskList}>
      <div className={styles.column}>
        <div className={styles.columnHeader}>
          <span className={styles.headerIcon}>📋</span>
          <span className={styles.headerTitle}>To Do</span>
          <span className={styles.taskCount}>({todoTasks.length})</span>
        </div>
        <div className={styles.columnContent}>
          {todoTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onTaskUpdate={onTaskUpdate}
              onTaskDelete={onTaskDelete}
            />
          ))}
        </div>
      </div>

      <div className={styles.column}>
        <div className={styles.columnHeader}>
          <span className={styles.headerIcon}>⏳</span>
          <span className={styles.headerTitle}>In Progress</span>
          <span className={styles.taskCount}>({inProgressTasks.length})</span>
        </div>
        <div className={styles.columnContent}>
          {inProgressTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onTaskUpdate={onTaskUpdate}
              onTaskDelete={onTaskDelete}
            />
          ))}
        </div>
      </div>

      <div className={styles.column}>
        <div className={styles.columnHeader}>
          <span className={styles.headerIcon}>✅</span>
          <span className={styles.headerTitle}>Done</span>
          <span className={styles.taskCount}>({doneTasks.length})</span>
        </div>
        <div className={styles.columnContent}>
          {doneTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onTaskUpdate={onTaskUpdate}
              onTaskDelete={onTaskDelete}
            />
          ))}
        </div>
      </div>
    </div>
  );
}; 
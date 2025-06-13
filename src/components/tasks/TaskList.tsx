import React from 'react';
import { TaskCard } from './TaskCard';
import { useApp } from '../../contexts/AppContext';
import type { Task, TaskStatus } from '../../types';
import styles from './TaskList.module.css';

interface TaskListProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => Promise<void>;
}

interface TaskGroup {
  status: TaskStatus;
  label: string;
  icon: string;
  tasks: Task[];
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, onTaskUpdate, onTaskDelete }) => {
  const { currentView } = useApp();

  const getEmptyMessage = (status: TaskStatus) => {
    switch (currentView) {
      case 'today':
        return {
          'todo': 'No tasks due today',
          'in-progress': 'No tasks in progress today',
          'done': 'No tasks completed today'
        }[status];
      case 'upcoming':
        return {
          'todo': 'No upcoming tasks to do',
          'in-progress': 'No upcoming tasks in progress',
          'done': 'No upcoming tasks completed'
        }[status];
      case 'project':
        return {
          'todo': 'No project tasks to do',
          'in-progress': 'No project tasks in progress',
          'done': 'No project tasks completed'
        }[status];
      case 'all':
      default:
        return {
          'todo': 'No tasks to do',
          'in-progress': 'No tasks in progress',
          'done': 'No completed tasks'
        }[status];
    }
  };

  const getTaskGroups = (): TaskGroup[] => {
    const groups: TaskGroup[] = [
      { status: 'todo', label: 'To Do', icon: '📋', tasks: [] },
      { status: 'in-progress', label: 'In Progress', icon: '⏳', tasks: [] },
      { status: 'done', label: 'Done', icon: '✅', tasks: [] },
    ];

    // Group tasks by status
    tasks.forEach(task => {
      const group = groups.find(g => g.status === task.status);
      if (group) {
        group.tasks.push(task);
      }
    });

    return groups;
  };

  const taskGroups = getTaskGroups();

  return (
    <div className={styles.taskList}>
      {taskGroups.map(group => (
        <div key={group.status} className={styles.taskGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupIcon}>{group.icon}</span>
            <h2 className={styles.groupTitle}>{group.label}</h2>
            <span className={styles.taskCount}>{group.tasks.length}</span>
          </div>
          
          <div className={styles.tasksContainer}>
            {group.tasks.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>
                  {getEmptyMessage(group.status)}
                </p>
              </div>
            ) : (
              group.tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onTaskUpdate={onTaskUpdate}
                  onTaskDelete={onTaskDelete}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}; 
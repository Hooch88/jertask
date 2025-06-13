import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubtasks } from '../../hooks/useFirestore';
import { updateSubtask, createSubtask } from '../../services/firestore';
import type { Task, Subtask } from '../../types';
import styles from './TaskCard.module.css';

interface TaskCardProps {
  task: Task;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onTaskUpdate = () => {},
}) => {
  const { user } = useAuth();
  const { subtasks } = useSubtasks(user?.uid || null, task.id);
  const [expanded, setExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'var(--color-priority-high)';
      case 'medium': return 'var(--color-priority-medium)';  
      case 'low': return 'var(--color-priority-low)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'todo': return '📋';
      case 'in-progress': return '⏳';
      case 'done': return '✅';
      default: return '📋';
    }
  };

  const completedSubtasks = subtasks.filter((subtask: Subtask) => subtask.completed).length;
  const totalSubtasks = subtasks.length;
  const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const handleStatusChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    const statusOrder: Task['status'][] = ['todo', 'in-progress', 'done'];
    const currentIndex = statusOrder.indexOf(task.status);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    const nextStatus = statusOrder[nextIndex];
    
    onTaskUpdate(task.id, { status: nextStatus });
  };

  const handleSubtaskToggle = async (subtaskId: string, completed: boolean) => {
    if (!user?.uid) return;
    
    try {
      await updateSubtask(user.uid, task.id, subtaskId, { completed });
    } catch (error) {
      console.error('Failed to update subtask:', error);
    }
  };

  const handleAddSubtask = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSubtaskTitle.trim() && user?.uid) {
      try {
        await createSubtask(user.uid, task.id, {
          title: newSubtaskTitle.trim(),
          completed: false,
        });
        setNewSubtaskTitle('');
      } catch (error) {
        console.error('Failed to create subtask:', error);
      }
    }
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div className={`${styles.card} ${styles[`status-${task.status}`]}`}>
      <div className={styles.header} onClick={toggleExpanded}>
        <div className={styles.statusSection}>
          <button 
            className={styles.statusButton}
            onClick={handleStatusChange}
            title={`Status: ${task.status}`}
          >
            {getStatusIcon(task.status)}
          </button>
          <div className={styles.taskInfo}>
            <h3 className={styles.title}>{task.title}</h3>
            {task.description && (
              <p className={styles.description}>{task.description}</p>
            )}
          </div>
        </div>
        
        <div className={styles.cardActions}>
          <div 
            className={styles.priorityBadge}
            style={{ backgroundColor: getPriorityColor(task.priority) }}
          >
            {task.priority}
          </div>
          {totalSubtasks > 0 && (
            <button className={styles.expandButton}>
              {expanded ? '▼' : '▶'}
            </button>
          )}
        </div>
      </div>

      {totalSubtasks > 0 && (
        <div className={styles.progress}>
          <div className={styles.progressInfo}>
            <span className={styles.progressText}>
              {completedSubtasks}/{totalSubtasks} subtasks
            </span>
            <span className={styles.progressPercentage}>
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {expanded && (
        <div className={styles.subtasksSection}>
          <div className={styles.subtasksList}>
            {subtasks.map((subtask: Subtask) => (
              <div key={subtask.id} className={styles.subtaskItem}>
                <input
                  type="checkbox"
                  checked={subtask.completed}
                  onChange={(e) => handleSubtaskToggle(subtask.id, e.target.checked)}
                  className={styles.subtaskCheckbox}
                />
                <span className={`${styles.subtaskTitle} ${subtask.completed ? styles.completed : ''}`}>
                  {subtask.title}
                </span>
              </div>
            ))}
          </div>
          <input
            type="text"
            placeholder="Add a subtask..."
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyDown={handleAddSubtask}
            className={styles.subtaskInput}
          />
        </div>
      )}

      {task.dueDate && (
        <div className={styles.footer}>
          <span className={styles.dueDate}>
            📅 {task.dueDate.toDate().toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  );
}; 
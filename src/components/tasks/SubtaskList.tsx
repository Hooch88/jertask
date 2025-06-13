import React, { useState } from 'react';
import type { Task } from '../../types';
import { ContextMenu } from '../common/ContextMenu';
import type { MenuItem } from '../common/ContextMenu';
import { useContextMenu } from '../../hooks/useContextMenu';
import styles from './SubtaskList.module.css';

interface SubtaskListProps {
  subtasks: Task[];
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onConvertToTask: (taskId: string) => void;
}

export const SubtaskList: React.FC<SubtaskListProps> = ({
  subtasks,
  onUpdate,
  onDelete,
  onConvertToTask
}) => {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const {
    isOpen: isContextMenuOpen,
    position: contextMenuPosition,
    handleContextMenu,
    closeMenu
  } = useContextMenu();

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingTitle(e.target.value);
  };

  const handleTitleBlur = (task: Task) => {
    if (editingTitle.trim() !== task.title) {
      onUpdate(task.id, { title: editingTitle.trim() });
    }
    setEditingTaskId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, task: Task) => {
    if (e.key === 'Enter') {
      handleTitleBlur(task);
    } else if (e.key === 'Escape') {
      setEditingTaskId(null);
    }
  };

  const handleStatusChange = (task: Task) => {
    onUpdate(task.id, { status: task.status === 'completed' ? 'incomplete' : 'completed' });
  };

  const handleDelete = (task: Task) => {
    onDelete(task.id);
  };

  const handleConvertToTask = (task: Task) => {
    onConvertToTask(task.id);
  };

  const handleContextMenuClick = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    setSelectedTaskId(taskId);
    handleContextMenu(e);
  };

  const contextMenuItems: MenuItem[] = [
    {
      label: 'Edit',
      icon: '✏️',
      action: () => {
        const task = subtasks.find(t => t.id === selectedTaskId);
        if (task) {
          setEditingTaskId(task.id);
          setEditingTitle(task.title);
        }
      }
    },
    {
      label: 'Convert to Task',
      icon: '↗️',
      action: () => {
        const task = subtasks.find(t => t.id === selectedTaskId);
        if (task) {
          handleConvertToTask(task);
        }
      }
    },
    {
      label: 'Delete',
      icon: '🗑️',
      action: () => {
        const task = subtasks.find(t => t.id === selectedTaskId);
        if (task) {
          handleDelete(task);
        }
      }
    }
  ];

  return (
    <div className={styles.subtaskList}>
      {subtasks.map(task => (
        <div
          key={task.id}
          className={styles.subtaskItem}
          onContextMenu={(e) => handleContextMenuClick(e, task.id)}
        >
          <label className={styles.status}>
            <input
              type="checkbox"
              checked={task.status === 'completed'}
              onChange={() => handleStatusChange(task)}
            />
          </label>

          {editingTaskId === task.id ? (
            <input
              type="text"
              value={editingTitle}
              onChange={handleTitleChange}
              onBlur={() => handleTitleBlur(task)}
              onKeyDown={(e) => handleKeyDown(e, task)}
              autoFocus
              className={styles.titleInput}
            />
          ) : (
            <span 
              className={`${styles.title} ${task.status === 'completed' ? styles.completed : ''}`}
              onClick={() => {
                setEditingTaskId(task.id);
                setEditingTitle(task.title);
              }}
            >
              {task.title}
            </span>
          )}
        </div>
      ))}

      <ContextMenu
        isOpen={isContextMenuOpen}
        position={contextMenuPosition}
        items={contextMenuItems}
        onClose={closeMenu}
      />
    </div>
  );
}; 
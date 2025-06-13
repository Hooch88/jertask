import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubtasks } from '../../hooks/useFirestore';
import { updateSubtask, createSubtask } from '../../services/firestore';
import { ConfirmationModal } from '../common/ConfirmationModal';
import type { Task, Subtask } from '../../types';
import styles from './TaskCard.module.css';
import { Timestamp } from 'firebase/firestore';
import { useApp } from '../../contexts/AppContext';
import { ContextMenu } from '../common/ContextMenu';
import type { MenuItem } from '../common/ContextMenu';
import { useContextMenu } from '../../hooks/useContextMenu';

interface TaskCardProps {
  task: Task;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete?: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onTaskUpdate = () => {},
  onTaskDelete,
}) => {
  const { user } = useAuth();
  const { subtasks } = useSubtasks(user?.uid || null, task.id);
  const [expanded, setExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedPriority, setEditedPriority] = useState(task.priority);
  const [isPrioritySaving, setIsPrioritySaving] = useState(false);
  const [editedDueDate, setEditedDueDate] = useState(task.dueDate ? Timestamp.fromDate(task.dueDate.toDate()).toDate().toISOString().split('T')[0] : '');
  const [isDueDateSaving, setIsDueDateSaving] = useState(false);
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const dueDateInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const { showConfirmation } = useApp();

  const {
    isOpen: isContextMenuOpen,
    position: contextMenuPosition,
    handleContextMenu,
    closeMenu
  } = useContextMenu();

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
      case 'todo':
        return '📋';
      case 'in-progress':
        return '⏳';
      case 'done':
        return '✅';
      default:
        return '📋';
    }
  };

  const handleTitleDoubleClick = () => {
    setIsEditingTitle(true);
    // Focus and select text after the component updates
    setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 0);
  };

  const handleDescriptionClick = () => {
    setIsEditingDescription(true);
    // Focus after the component updates
    setTimeout(() => {
      descriptionInputRef.current?.focus();
    }, 0);
  };

  const handleTitleBlur = () => {
    saveTitle();
  };

  const handleDescriptionBlur = () => {
    saveDescription();
  };

  const completedSubtasks = subtasks.filter((subtask: Subtask) => subtask.completed).length;
  const totalSubtasks = subtasks.length;
  const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const handleStatusChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTaskUpdate) {
      const newStatus = task.status === 'todo' ? 'in-progress' : 
                       task.status === 'in-progress' ? 'done' : 'todo';
      onTaskUpdate(task.id, { status: newStatus });
    }
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

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTaskDelete) {
      setShowDeleteModal(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!onTaskDelete) return;
    
    setIsDeleting(true);
    try {
      await onTaskDelete(task.id);
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handlePriorityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPriority = e.target.value as Task['priority'];
    setEditedPriority(newPriority);
    setIsPrioritySaving(true);
    try {
      if (onTaskUpdate) {
        await onTaskUpdate(task.id, { priority: newPriority });
      }
    } catch (error) {
      setEditedPriority(task.priority); // revert on error
    } finally {
      setIsPrioritySaving(false);
    }
  };

  const handleDueDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditedDueDate(value);
    setIsDueDateSaving(true);
    try {
      const newDueDate = value ? Timestamp.fromDate(new Date(value)) : null;
      if (onTaskUpdate) {
        await onTaskUpdate(task.id, { dueDate: newDueDate });
      }
    } catch (error) {
      setEditedDueDate(task.dueDate ? Timestamp.fromDate(task.dueDate.toDate()).toDate().toISOString().split('T')[0] : '');
    } finally {
      setIsDueDateSaving(false);
    }
  };

  const handleClearDueDate = async () => {
    setEditedDueDate('');
    setIsDueDateSaving(true);
    try {
      if (onTaskUpdate) {
        await onTaskUpdate(task.id, { dueDate: null });
      }
    } catch (error) {
      setEditedDueDate(task.dueDate ? Timestamp.fromDate(task.dueDate.toDate()).toDate().toISOString().split('T')[0] : '');
    } finally {
      setIsDueDateSaving(false);
    }
  };

  // Helper for due date status
  const getDueDateStatus = () => {
    if (!task.dueDate) return { label: 'No due date', color: styles.dueDateNone };
    const date = task.dueDate.toDate();
    if (isToday(date)) return { label: 'Due today', color: styles.dueDateToday };
    if (isPast(date) && !isToday(date)) return { label: `Overdue by ${Math.abs(getDaysDifference(new Date(), date))} day(s)`, color: styles.dueDateOverdue };
    return { label: `Due in ${getDaysDifference(date, new Date())} day(s)`, color: styles.dueDateUpcoming };
  };

  const formatDateForInput = (date: Date) => date.toISOString().split('T')[0];
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };
  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };
  const getDaysDifference = (date1: Date, date2: Date) => {
    const diffTime = date1.setHours(0,0,0,0) - date2.setHours(0,0,0,0);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleDueDateDisplayDoubleClick = () => {
    setIsEditingDueDate(true);
    setTimeout(() => {
      dueDateInputRef.current?.focus();
      dueDateInputRef.current?.select();
    }, 0);
  };

  const handleDueDateInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      await saveDueDate();
    } else if (e.key === 'Escape') {
      cancelDueDateEdit();
    }
  };

  const saveDueDate = async () => {
    setIsDueDateSaving(true);
    try {
      const newDueDate = editedDueDate ? Timestamp.fromDate(new Date(editedDueDate)) : undefined;
      await onTaskUpdate(task.id, { dueDate: newDueDate });
      setIsEditingDueDate(false);
    } catch (error) {
      setEditedDueDate(task.dueDate ? formatDateForInput(task.dueDate.toDate()) : '');
      setIsEditingDueDate(false);
    } finally {
      setIsDueDateSaving(false);
    }
  };

  const cancelDueDateEdit = () => {
    setEditedDueDate(task.dueDate ? formatDateForInput(task.dueDate.toDate()) : '');
    setIsEditingDueDate(false);
  };

  const saveTitle = async () => {
    if (!editedTitle.trim()) return;
    
    setIsSaving(true);
    try {
      if (onTaskUpdate) {
        await onTaskUpdate(task.id, { title: editedTitle.trim() });
      }
      setIsEditingTitle(false);
    } catch (error) {
      setEditedTitle(task.title);
    } finally {
      setIsSaving(false);
    }
  };

  const saveDescription = async () => {
    setIsSaving(true);
    try {
      if (onTaskUpdate) {
        await onTaskUpdate(task.id, { description: editedDescription.trim() });
      }
      setIsEditingDescription(false);
    } catch (error) {
      setEditedDescription(task.description || '');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onTaskDelete) return;
    setIsDeleting(true);
    try {
      await onTaskDelete(task.id);
    } catch (error) {
      // handle error if needed
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const contextMenuItems: MenuItem[] = [
    {
      label: 'Edit',
      icon: '✏️',
      submenu: [
        {
          label: 'Edit Title',
          icon: '📝',
          action: () => setIsEditingTitle(true)
        },
        {
          label: 'Edit Description',
          icon: '📄',
          action: () => setIsEditingDescription(true)
        }
      ]
    },
    {
      label: 'Change Priority',
      icon: '⭐',
      submenu: [
        {
          label: 'High',
          icon: '🔴',
          action: () => onTaskUpdate?.(task.id, { priority: 'high' })
        },
        {
          label: 'Medium',
          icon: '🟡',
          action: () => onTaskUpdate?.(task.id, { priority: 'medium' })
        },
        {
          label: 'Low',
          icon: '🟢',
          action: () => onTaskUpdate?.(task.id, { priority: 'low' })
        }
      ]
    },
    {
      label: 'Change Status',
      icon: '🔄',
      submenu: [
        {
          label: 'To Do',
          icon: '📋',
          action: () => onTaskUpdate?.(task.id, { status: 'todo' })
        },
        {
          label: 'In Progress',
          icon: '⏳',
          action: () => onTaskUpdate?.(task.id, { status: 'in-progress' })
        },
        {
          label: 'Done',
          icon: '✅',
          action: () => onTaskUpdate?.(task.id, { status: 'done' })
        }
      ]
    },
    {
      label: 'Set Due Date',
      icon: '📅',
      action: () => setIsEditingDueDate(true)
    },
    {
      label: 'Delete',
      icon: '🗑️',
      action: () => onTaskDelete?.(task.id)
    }
  ];

  return (
    <div 
      ref={cardRef}
      className={`${styles.card} ${styles[`status-${task.status}`]}`}
      onContextMenu={handleContextMenu}
    >
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
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className={styles.titleInput}
                disabled={isSaving}
              />
            ) : (
              <h3 
                className={styles.title}
                onDoubleClick={handleTitleDoubleClick}
                title="Double-click to edit"
              >
                {task.title}
                <span className={styles.editIcon}>✎</span>
              </h3>
            )}
            
            {isEditingDescription ? (
              <textarea
                ref={descriptionInputRef}
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                className={styles.descriptionInput}
                placeholder="Add a description..."
                disabled={isSaving}
              />
            ) : (
              <div 
                className={styles.description}
                onClick={handleDescriptionClick}
                title="Click to edit"
              >
                {task.description || 'Click to add description'}
                <span className={styles.editIcon}>✎</span>
              </div>
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
        <>
          <div className={styles.metaRow}>
            <div className={styles.prioritySelectorRow}>
              <label htmlFor={`priority-select-${task.id}`} className={styles.priorityLabel}>Priority:</label>
              <select
                id={`priority-select-${task.id}`}
                className={styles.prioritySelect}
                value={editedPriority || task.priority}
                onChange={handlePriorityChange}
                disabled={isPrioritySaving}
                style={{
                  backgroundColor: getPriorityColor(editedPriority || task.priority),
                }}
              >
                <option value="low" className={styles.priorityLow}>Low</option>
                <option value="medium" className={styles.priorityMedium}>Medium</option>
                <option value="high" className={styles.priorityHigh}>High</option>
              </select>
              {isPrioritySaving && <span className={styles.prioritySaving}>Saving...</span>}
            </div>
          </div>
          <div className={styles.subtasksSection}>
            <div className={styles.subtasksHeader}>
              <h4 className={styles.subtasksTitle}>Subtasks</h4>
              {onTaskDelete && (
                <button
                  className={styles.deleteButton}
                  onClick={handleDeleteClick}
                  title="Delete task"
                >
                  Delete Task
                </button>
              )}
            </div>
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
        </>
      )}

      {task.dueDate !== undefined && (
        <div
          className={styles.footer}
          onDoubleClick={handleDueDateDisplayDoubleClick}
          tabIndex={0}
          title="Double-click to edit due date"
          style={{ cursor: 'pointer' }}
        >
          <span className={styles.dueDate}>
            <span className={styles.dueDateIcon}>📅</span>
            {isEditingDueDate ? (
              <>
                <input
                  ref={dueDateInputRef}
                  type="date"
                  className={styles.dueDateInputInline}
                  value={editedDueDate}
                  onChange={handleDueDateChange}
                  onKeyDown={handleDueDateInputKeyDown}
                  onBlur={saveDueDate}
                  disabled={isDueDateSaving}
                  autoFocus
                />
                {editedDueDate && (
                  <button
                    className={styles.clearDueDateButton}
                    onClick={handleClearDueDate}
                    disabled={isDueDateSaving}
                    title="Clear due date"
                    tabIndex={-1}
                  >✕</button>
                )}
                {isDueDateSaving && <span className={styles.dueDateSaving}>Saving...</span>}
              </>
            ) : (
              <>
                {task.dueDate ? formatDateForInput(task.dueDate.toDate()) : <span className={styles.dueDateNone}>No due date</span>}
                <span className={`${styles.dueDateStatus} ${getDueDateStatus().color}`}>{getDueDateStatus().label}</span>
              </>
            )}
          </span>
        </div>
      )}

      <ContextMenu
        isOpen={isContextMenuOpen}
        position={contextMenuPosition}
        items={contextMenuItems}
        onClose={closeMenu}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Task?"
        message="This action cannot be undone."
        warningMessage={subtasks.length > 0 ? `This will also delete ${subtasks.length} subtasks.` : undefined}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
        confirmLabel="Delete Task"
        isLoading={isDeleting}
      />
    </div>
  );
};

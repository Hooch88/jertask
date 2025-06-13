import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubtasks } from '../../hooks/useFirestore';
import { updateSubtask, createSubtask } from '../../services/firestore';
import { ConfirmationModal } from '../common/ConfirmationModal';
import type { Task, Subtask } from '../../types';
import styles from './TaskCard.module.css';
import { Timestamp } from 'firebase/firestore';

interface TaskCardProps {
  task: Task;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete?: (taskId: string) => Promise<void>;
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

  // Reset edited values when task changes
  useEffect(() => {
    setEditedTitle(task.title);
    setEditedDescription(task.description || '');
    setEditedPriority(task.priority);
    setEditedDueDate(task.dueDate ? Timestamp.fromDate(task.dueDate.toDate()).toDate().toISOString().split('T')[0] : '');
  }, [task.title, task.description, task.priority, task.dueDate]);

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

  const handleTitleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await saveTitle();
    } else if (e.key === 'Escape') {
      cancelTitleEdit();
    }
  };

  const handleDescriptionKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      await saveDescription();
    } else if (e.key === 'Escape') {
      cancelDescriptionEdit();
    }
  };

  const saveTitle = async () => {
    if (editedTitle.trim() === task.title) {
      setIsEditingTitle(false);
      return;
    }

    setIsSaving(true);
    try {
      await onTaskUpdate(task.id, { title: editedTitle.trim() });
      setIsEditingTitle(false);
    } catch (error) {
      console.error('Failed to update title:', error);
      setEditedTitle(task.title); // Reset on error
    } finally {
      setIsSaving(false);
    }
  };

  const saveDescription = async () => {
    if (editedDescription === task.description) {
      setIsEditingDescription(false);
      return;
    }

    setIsSaving(true);
    try {
      await onTaskUpdate(task.id, { description: editedDescription.trim() });
      setIsEditingDescription(false);
    } catch (error) {
      console.error('Failed to update description:', error);
      setEditedDescription(task.description || ''); // Reset on error
    } finally {
      setIsSaving(false);
    }
  };

  const cancelTitleEdit = () => {
    setEditedTitle(task.title);
    setIsEditingTitle(false);
  };

  const cancelDescriptionEdit = () => {
    setEditedDescription(task.description || '');
    setIsEditingDescription(false);
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

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteModal(true);
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
      await onTaskUpdate(task.id, { priority: newPriority });
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
      const newDueDate = value ? Timestamp.fromDate(new Date(value)) : undefined;
      await onTaskUpdate(task.id, { dueDate: newDueDate });
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
      await onTaskUpdate(task.id, { dueDate: undefined });
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
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
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
                onKeyDown={handleDescriptionKeyDown}
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

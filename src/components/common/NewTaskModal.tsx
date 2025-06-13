import React, { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useApp } from '../../contexts/AppContext';
import type { Task } from '../../types';
import styles from './NewTaskModal.module.css';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, onClose }) => {
  const { projects, createTask } = useApp();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    priority: 'medium' as Task['priority'],
    dueDate: '',
  });
  const [loading, setLoading] = useState(false);

  // Auto-select first project if available and none selected
  React.useEffect(() => {
    if (projects.length > 0 && !formData.projectId) {
      setFormData(prev => ({ ...prev, projectId: projects[0].id }));
    }
  }, [projects, formData.projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.projectId) return;

    console.log('Creating task with data:', {
      title: formData.title.trim(),
      description: formData.description.trim(),
      projectId: formData.projectId,
      priority: formData.priority,
      status: 'todo',
      dueDate: formData.dueDate ? Timestamp.fromDate(new Date(formData.dueDate)) : undefined,
    });

    setLoading(true);
    try {
      const taskId = await createTask({
        title: formData.title.trim(),
        description: formData.description.trim(),
        projectId: formData.projectId,
        priority: formData.priority,
        status: 'todo',
        dueDate: formData.dueDate ? Timestamp.fromDate(new Date(formData.dueDate)) : undefined,
      });

      console.log('Task created successfully with ID:', taskId);

      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        projectId: projects.length > 0 ? projects[0].id : '',
        priority: 'medium',
        dueDate: '',
      });
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Create New Task</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter task title..."
              className={styles.input}
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter task description..."
              className={styles.textarea}
              rows={3}
            />
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>Project *</label>
              <select
                value={formData.projectId}
                onChange={(e) => handleInputChange('projectId', e.target.value)}
                className={styles.select}
                required
              >
                <option value="">
                  {projects.length > 0 ? 'Select a project' : 'No projects available - Create a project first'}
                </option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className={styles.select}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              className={styles.input}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.createButton}
              disabled={loading || !formData.title.trim() || !formData.projectId}
              title={!formData.projectId ? 'Please select a project first' : ''}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 
import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import styles from './NewTaskModal.module.css'; // Reuse the same styles

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_OPTIONS = [
  '#10b981', // Green
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#f59e0b', // Orange
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
];

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose }) => {
  const { createProject } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    color: COLOR_OPTIONS[0],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      await createProject({
        name: formData.name.trim(),
        color: formData.color,
      });

      // Reset form and close modal
      setFormData({
        name: '',
        color: COLOR_OPTIONS[0],
      });
      onClose();
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
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
          <h2 className={styles.title}>Create New Project</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Project Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter project name..."
              className={styles.input}
              required
              autoFocus
            />
          </div>



          <div className={styles.field}>
            <label className={styles.label}>Color</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleInputChange('color', color)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: formData.color === color ? '3px solid #fff' : '2px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    boxShadow: formData.color === color ? '0 0 0 2px #3b82f6' : 'none',
                  }}
                  title={color}
                />
              ))}
            </div>
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
              disabled={loading || !formData.name.trim()}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 
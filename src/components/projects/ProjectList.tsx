import React, { useState } from 'react';
import type { Project } from '../../types';
import { ContextMenu } from '../common/ContextMenu';
import type { MenuItem } from '../common/ContextMenu';
import { useContextMenu } from '../../hooks/useContextMenu';
import styles from './ProjectList.module.css';

interface ProjectListProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
  onDeleteProject: (projectId: string) => void;
  onCreateTask: (projectId: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  onUpdateProject,
  onDeleteProject,
  onCreateTask
}) => {
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const {
    isOpen: isContextMenuOpen,
    position: contextMenuPosition,
    handleContextMenu,
    closeMenu
  } = useContextMenu();

  const handleProjectClick = (projectId: string) => {
    onSelectProject(projectId);
  };

  const handleEditClick = (project: Project) => {
    setEditingProjectId(project.id);
    setEditingName(project.name);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingName(e.target.value);
  };

  const handleNameBlur = (project: Project) => {
    if (editingName.trim() !== project.name) {
      onUpdateProject(project.id, { name: editingName.trim() });
    }
    setEditingProjectId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, project: Project) => {
    if (e.key === 'Enter') {
      handleNameBlur(project);
    } else if (e.key === 'Escape') {
      setEditingProjectId(null);
    }
  };

  const handleDelete = (project: Project) => {
    onDeleteProject(project.id);
  };

  const handleCreateTask = (project: Project) => {
    onCreateTask(project.id);
  };

  const contextMenuItems: MenuItem[] = [
    {
      label: 'Rename',
      icon: '✏️',
      action: () => {
        const project = projects.find(p => p.id === selectedProjectId);
        if (project) {
          handleEditClick(project);
        }
      }
    },
    {
      label: 'Add Task',
      icon: '➕',
      action: () => {
        const project = projects.find(p => p.id === selectedProjectId);
        if (project) {
          handleCreateTask(project);
        }
      }
    },
    {
      label: 'Delete',
      icon: '🗑️',
      action: () => {
        const project = projects.find(p => p.id === selectedProjectId);
        if (project) {
          handleDelete(project);
        }
      }
    }
  ];

  return (
    <div className={styles.projectList}>
      {projects.map(project => (
        <div
          key={project.id}
          className={`${styles.projectItem} ${project.id === selectedProjectId ? styles.selected : ''}`}
          onClick={() => handleProjectClick(project.id)}
          onContextMenu={handleContextMenu}
        >
          {editingProjectId === project.id ? (
            <input
              type="text"
              value={editingName}
              onChange={handleNameChange}
              onBlur={() => handleNameBlur(project)}
              onKeyDown={(e) => handleKeyDown(e, project)}
              autoFocus
              className={styles.projectNameInput}
            />
          ) : (
            <span className={styles.projectName}>{project.name}</span>
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
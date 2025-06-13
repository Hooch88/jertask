import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { NewProjectModal } from '../common/NewProjectModal';
import type { ViewType } from '../../types';
import styles from './Sidebar.module.css';

export const Sidebar: React.FC = () => {
  const { 
    projects, 
    currentView, 
    selectedProjectId,
    setCurrentView, 
    setSelectedProjectId,
    deleteProject,
    updateProject
  } = useApp();
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editedProjectName, setEditedProjectName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const projectInputRef = useRef<HTMLInputElement>(null);

  const navItems = [
    { id: 'all' as ViewType, label: 'All Tasks', icon: '📋' },
    { id: 'today' as ViewType, label: 'Today', icon: '📅' },
    { id: 'upcoming' as ViewType, label: 'Upcoming', icon: '⏰' },
  ];

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    setSelectedProjectId(null); // Clear project selection when changing views
  };

  const handleProjectSelect = (projectId: string) => {
    setCurrentView('project');
    setSelectedProjectId(projectId);
  };

  const handleProjectNameDoubleClick = (projectId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent project selection
    setEditingProjectId(projectId);
    setEditedProjectName(currentName);
    // Focus and select text after the component updates
    setTimeout(() => {
      projectInputRef.current?.focus();
      projectInputRef.current?.select();
    }, 0);
  };

  const handleProjectNameKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>, projectId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await saveProjectName(projectId);
    } else if (e.key === 'Escape') {
      cancelProjectEdit();
    }
  };

  const saveProjectName = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project || editedProjectName.trim() === project.name) {
      setEditingProjectId(null);
      return;
    }

    setIsSaving(true);
    try {
      await updateProject(projectId, { name: editedProjectName.trim() });
      setEditingProjectId(null);
    } catch (error) {
      console.error('Failed to update project name:', error);
      setEditedProjectName(project.name); // Reset on error
    } finally {
      setIsSaving(false);
    }
  };

  const cancelProjectEdit = () => {
    const project = projects.find(p => p.id === editingProjectId);
    if (project) {
      setEditedProjectName(project.name);
    }
    setEditingProjectId(null);
  };

  const handleProjectNameBlur = (projectId: string) => {
    saveProjectName(projectId);
  };

  const handleDeleteProject = async (projectId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this project? All tasks will also be deleted.')) {
      try {
        await deleteProject(projectId);
      } catch (error) {
        console.error('Failed to delete project:', error);
        alert('Failed to delete project. Please try again.');
      }
    }
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h1 className={styles.logo}>
          <span className={styles.logoIcon}>⚡</span>
          JerTask
        </h1>
      </div>

      <nav className={styles.nav}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Views</h2>
          <ul className={styles.navList}>
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  className={`${styles.navItem} ${
                    currentView === item.id ? styles.navItemActive : ''
                  }`}
                  onClick={() => handleViewChange(item.id)}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Projects</h2>
            <button 
              className={styles.addButton} 
              title="New Project"
              onClick={() => setShowNewProjectModal(true)}
            >
              +
            </button>
          </div>
          <ul className={styles.navList}>
            {projects.map((project) => (
              <li key={project.id}>
                <div className={styles.projectContainer}>
                  <button 
                    className={`${styles.projectItem} ${
                      selectedProjectId === project.id ? styles.projectItemActive : ''
                    }`}
                    onClick={() => handleProjectSelect(project.id)}
                  >
                    <div className={styles.projectInfo}>
                      <span 
                        className={styles.projectDot} 
                        style={{ backgroundColor: project.color }}
                      />
                      {editingProjectId === project.id ? (
                        <input
                          ref={projectInputRef}
                          type="text"
                          value={editedProjectName}
                          onChange={(e) => setEditedProjectName(e.target.value)}
                          onKeyDown={(e) => handleProjectNameKeyDown(e, project.id)}
                          onBlur={() => handleProjectNameBlur(project.id)}
                          className={styles.projectNameInput}
                          disabled={isSaving}
                        />
                      ) : (
                        <span 
                          className={styles.projectName}
                          onDoubleClick={(e) => handleProjectNameDoubleClick(project.id, project.name, e)}
                        >
                          {project.name}
                        </span>
                      )}
                    </div>
                    <span className={styles.taskCount}>{project.taskCount}</span>
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={(e) => handleDeleteProject(project.id, e)}
                    title="Delete project"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <NewProjectModal 
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
      />
    </aside>
  );
}; 
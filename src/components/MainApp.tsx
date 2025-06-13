import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { Layout } from './layout/Layout';
import { TaskList } from './tasks/TaskList';
import { NewTaskModal } from './common/NewTaskModal';
import styles from './MainApp.module.css';

const LoginScreen: React.FC = () => {
  const { signIn, loading } = useAuth();

  return (
    <div className={styles.loginScreen}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <h1 className={styles.appTitle}>
            <span className={styles.logoIcon}>⚡</span>
            JerTask
          </h1>
          <p className={styles.subtitle}>
            A premium task manager for entrepreneurs
          </p>
        </div>
        
        <button 
          onClick={signIn}
          disabled={loading}
          className={styles.signInButton}
        >
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  );
};

const LoadingScreen: React.FC = () => (
  <div className={styles.loadingScreen}>
    <div className={styles.loadingSpinner}>
      <div className={styles.spinner}></div>
      <p className={styles.loadingText}>Loading JerTask...</p>
    </div>
  </div>
);

export const MainApp: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { tasks, loading: appLoading, updateTask, error, currentView, selectedProjectId, projects } = useApp();
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  const getViewTitle = () => {
    switch (currentView) {
      case 'today':
        return 'Today\'s Tasks';
      case 'upcoming':
        return 'Upcoming Tasks';
      case 'project':
        const project = projects.find(p => p.id === selectedProjectId);
        return project ? project.name : 'Project Tasks';
      case 'all':
      default:
        return 'All Tasks';
    }
  };

  const getViewSubtitle = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    
    switch (currentView) {
      case 'today':
        return `${totalTasks} tasks due today • ${completedTasks} completed`;
      case 'upcoming':
        return `${totalTasks} tasks due in the next 7 days • ${completedTasks} completed`;
      case 'project':
        return `${totalTasks} project tasks • ${completedTasks} completed`;
      case 'all':
      default:
        return `${totalTasks} total tasks • ${completedTasks} completed`;
    }
  };

  return (
    <Layout>
      <div className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.titleSection}>
            <h1 className={styles.viewTitle}>{getViewTitle()}</h1>
            <p className={styles.viewSubtitle}>{getViewSubtitle()}</p>
          </div>
          
          <div className={styles.headerActions}>
            <button 
              className={styles.newTaskButton}
              onClick={() => setShowNewTaskModal(true)}
              disabled={projects.length === 0}
              title={projects.length === 0 ? 'Create a project first' : 'Create new task'}
            >
              + New Task
            </button>
            
            {user && (
              <div className={styles.userSection}>
                <span className={styles.welcomeText}>
                  Welcome, {user.displayName || user.email}
                </span>
                {user.photoURL && (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className={styles.profileImage}
                  />
                )}
              </div>
            )}
          </div>
        </header>

        {error && (
          <div className={styles.errorBanner}>
            <span className={styles.errorIcon}>⚠️</span>
            <span className={styles.errorText}>{error}</span>
          </div>
        )}

        {appLoading ? (
          <div className={styles.contentLoading}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Loading tasks...</p>
          </div>
        ) : (
          <TaskList 
            tasks={tasks}
            onTaskUpdate={updateTask}
          />
        )}
      </div>

      <NewTaskModal 
        isOpen={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
      />
    </Layout>
  );
}; 
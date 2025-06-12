import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useProjects, useTasks } from '../hooks/useFirestore';
import { 
  createProject as createProjectService,
  updateProject as updateProjectService,
  deleteProject as deleteProjectService,
  createTask as createTaskService,
  updateTask as updateTaskService,
  deleteTask as deleteTaskService,
} from '../services/firestore';
import { initializeDefaultProjects } from '../services/defaultData';
import type { AppContextType, ViewType, Project, Task } from '../types';

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { projects, loading: projectsLoading } = useProjects(user?.uid || null);
  const { tasks: allTasks, loading: tasksLoading } = useTasks(
    user?.uid || null, 
    selectedProjectId || undefined
  );

  // Filter tasks based on current view
  const getFilteredTasks = useCallback(() => {
    if (!allTasks) return [];

    switch (currentView) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return allTasks.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = task.dueDate.toDate();
          return dueDate >= today && dueDate < tomorrow;
        });

      case 'upcoming':
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        return allTasks.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = task.dueDate.toDate();
          return dueDate > now && dueDate <= nextWeek;
        });

      case 'project':
        return selectedProjectId 
          ? allTasks.filter(task => task.projectId === selectedProjectId)
          : allTasks;

      case 'all':
      default:
        return allTasks;
    }
  }, [allTasks, currentView, selectedProjectId]);

  const tasks = getFilteredTasks();

  const loading = projectsLoading || tasksLoading;

  // Initialize default projects for new users - TEMPORARILY DISABLED
  // const [hasInitialized, setHasInitialized] = useState(false);
  
  // useEffect(() => {
  //   if (user?.uid && !projectsLoading && projects.length === 0 && !hasInitialized) {
  //     setHasInitialized(true);
  //     initializeDefaultProjects(user.uid, projects);
  //   }
  // }, [user?.uid, projectsLoading, hasInitialized]);

  const handleError = (error: unknown, message: string) => {
    console.error(message, error);
    setError(message);
    setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
  };

  const createProject = useCallback(async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'taskCount'>) => {
    if (!user?.uid) throw new Error('User not authenticated');
    
    try {
      await createProjectService(user.uid, projectData);
    } catch (error) {
      handleError(error, 'Failed to create project');
      throw error;
    }
  }, [user?.uid]);

  const updateProject = useCallback(async (projectId: string, updates: Partial<Project>) => {
    if (!user?.uid) throw new Error('User not authenticated');
    
    try {
      await updateProjectService(user.uid, projectId, updates);
    } catch (error) {
      handleError(error, 'Failed to update project');
      throw error;
    }
  }, [user?.uid]);

  const deleteProject = useCallback(async (projectId: string) => {
    if (!user?.uid) throw new Error('User not authenticated');
    
    try {
      await deleteProjectService(user.uid, projectId);
      // If we were viewing this project, switch to 'all' view
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
        setCurrentView('all');
      }
    } catch (error) {
      handleError(error, 'Failed to delete project');
      throw error;
    }
  }, [user?.uid, selectedProjectId]);

  const createTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => {
    if (!user?.uid) throw new Error('User not authenticated');
    
    try {
      console.log('AppContext: Creating task for user:', user.uid, 'with data:', taskData);
      const taskId = await createTaskService(user.uid, taskData);
      console.log('AppContext: Task created with ID:', taskId);
      return taskId;
    } catch (error) {
      console.error('AppContext: Failed to create task:', error);
      handleError(error, 'Failed to create task');
      throw error;
    }
  }, [user?.uid]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    if (!user?.uid) throw new Error('User not authenticated');
    
    try {
      await updateTaskService(user.uid, taskId, updates);
    } catch (error) {
      handleError(error, 'Failed to update task');
      throw error;
    }
  }, [user?.uid]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!user?.uid) throw new Error('User not authenticated');
    
    // Find the task to get its projectId
    const task = tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');
    
    try {
      await deleteTaskService(user.uid, taskId, task.projectId);
    } catch (error) {
      handleError(error, 'Failed to delete task');
      throw error;
    }
  }, [user?.uid, tasks]);

  const value: AppContextType = {
    projects,
    tasks,
    currentView,
    selectedProjectId,
    loading,
    error,
    setCurrentView,
    setSelectedProjectId,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}; 
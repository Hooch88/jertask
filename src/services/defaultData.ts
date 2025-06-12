import { Timestamp } from 'firebase/firestore';
import { createProject } from './firestore';
import type { Project } from '../types';

const DEFAULT_PROJECTS = [
  {
    name: 'Business Tasks',
    color: '#10b981',
  },
  {
    name: 'Website Projects', 
    color: '#3b82f6',
  },
  {
    name: 'RPG Game Development',
    color: '#8b5cf6',
  },
];

export const initializeDefaultProjects = async (userId: string, existingProjects: Project[]) => {
  // Only create defaults if user has no projects
  if (existingProjects.length > 0) {
    console.log('User already has projects, skipping default creation');
    return;
  }

  console.log('Creating default projects for new user:', userId);
  console.log('Default projects to create:', DEFAULT_PROJECTS);
  
  try {
    const projectPromises = DEFAULT_PROJECTS.map(async (project, index) => {
      console.log(`Creating project ${index + 1}:`, project);
      const projectId = await createProject(userId, project);
      console.log(`Project ${index + 1} created with ID:`, projectId);
      return projectId;
    });
    
    const projectIds = await Promise.all(projectPromises);
    console.log('All default projects created successfully:', projectIds);
  } catch (error) {
    console.error('Failed to create default projects:', error);
    throw error;
  }
}; 
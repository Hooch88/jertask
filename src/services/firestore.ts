import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  increment,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Project, Task, Subtask } from '../types';

// Collection references
export const getProjectsCollection = (userId: string) => {
  const collectionRef = collection(db, 'users', userId, 'projects');
  console.log('Getting projects collection for user:', userId, 'path:', `users/${userId}/projects`);
  return collectionRef;
};

export const getTasksCollection = (userId: string) => {
  const collectionRef = collection(db, 'users', userId, 'tasks');
  console.log('Getting tasks collection for user:', userId, 'path:', `users/${userId}/tasks`);
  return collectionRef;
};

export const getSubtasksCollection = (userId: string, taskId: string) => {
  const collectionRef = collection(db, 'users', userId, 'tasks', taskId, 'subtasks');
  console.log('Getting subtasks collection for user:', userId, 'task:', taskId, 'path:', `users/${userId}/tasks/${taskId}/subtasks`);
  return collectionRef;
};

// Project operations
export const createProject = async (userId: string, projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'taskCount'>) => {
  console.log('Firestore: Creating project for user:', userId, 'data:', projectData);
  
  const projectsRef = getProjectsCollection(userId);
  const newProject = {
    ...projectData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    taskCount: 0,
  };
  
  console.log('Firestore: Adding project document:', newProject);
  const docRef = await addDoc(projectsRef, newProject);
  console.log('Firestore: Project created with ID:', docRef.id);
  return docRef.id;
};

export const updateProject = async (userId: string, projectId: string, updates: Partial<Project>) => {
  const projectRef = doc(getProjectsCollection(userId), projectId);
  await updateDoc(projectRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteProject = async (userId: string, projectId: string) => {
  const batch = writeBatch(db);
  
  // Delete the project
  const projectRef = doc(getProjectsCollection(userId), projectId);
  batch.delete(projectRef);
  
  // Delete all tasks in this project
  const tasksQuery = query(
    getTasksCollection(userId),
    where('projectId', '==', projectId)
  );
  const tasksSnapshot = await getDocs(tasksQuery);
  
  for (const taskDoc of tasksSnapshot.docs) {
    batch.delete(taskDoc.ref);
    
    // Delete all subtasks for this task
    const subtasksQuery = query(getSubtasksCollection(userId, taskDoc.id));
    const subtasksSnapshot = await getDocs(subtasksQuery);
    
    for (const subtaskDoc of subtasksSnapshot.docs) {
      batch.delete(subtaskDoc.ref);
    }
  }
  
  await batch.commit();
};

// Task operations
export const createTask = async (userId: string, taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => {
  console.log('Firestore: Creating task for user:', userId, 'data:', taskData);
  
  const batch = writeBatch(db);
  
  // Use timestamp as order to avoid complex queries during development
  const now = Timestamp.now();
  const order = now.toMillis(); // Use timestamp as order for simplicity
  
  // Create the task
  const tasksRef = getTasksCollection(userId);
  const taskRef = doc(tasksRef);
  const newTask = {
    ...taskData,
    createdAt: now,
    updatedAt: now,
    order: order,
  };
  
  console.log('Firestore: Adding task document with ID:', taskRef.id, 'data:', newTask);
  batch.set(taskRef, newTask);
  
  // Increment project task count
  const projectRef = doc(getProjectsCollection(userId), taskData.projectId);
  console.log('Firestore: Updating project task count for project:', taskData.projectId);
  batch.update(projectRef, {
    taskCount: increment(1),
    updatedAt: now,
  });
  
  console.log('Firestore: Committing batch operation...');
  await batch.commit();
  console.log('Firestore: Task created successfully with ID:', taskRef.id);
  return taskRef.id;
};

export const updateTask = async (userId: string, taskId: string, updates: Partial<Task>) => {
  const taskRef = doc(getTasksCollection(userId), taskId);
  await updateDoc(taskRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteTask = async (userId: string, taskId: string, projectId: string) => {
  const batch = writeBatch(db);
  
  // Delete the task
  const taskRef = doc(getTasksCollection(userId), taskId);
  batch.delete(taskRef);
  
  // Delete all subtasks
  const subtasksQuery = query(getSubtasksCollection(userId, taskId));
  const subtasksSnapshot = await getDocs(subtasksQuery);
  
  for (const subtaskDoc of subtasksSnapshot.docs) {
    batch.delete(subtaskDoc.ref);
  }
  
  // Decrement project task count
  const projectRef = doc(getProjectsCollection(userId), projectId);
  batch.update(projectRef, {
    taskCount: increment(-1),
    updatedAt: Timestamp.now(),
  });
  
  await batch.commit();
};

// Subtask operations
export const createSubtask = async (userId: string, taskId: string, subtaskData: Omit<Subtask, 'id' | 'createdAt' | 'order'>) => {
  // Use timestamp as order to avoid complex queries during development
  const now = Timestamp.now();
  const order = now.toMillis(); // Use timestamp as order for simplicity
  
  const subtasksRef = getSubtasksCollection(userId, taskId);
  const newSubtask = {
    ...subtaskData,
    createdAt: now,
    order: order,
  };
  
  const docRef = await addDoc(subtasksRef, newSubtask);
  return docRef.id;
};

export const updateSubtask = async (userId: string, taskId: string, subtaskId: string, updates: Partial<Subtask>) => {
  const subtaskRef = doc(getSubtasksCollection(userId, taskId), subtaskId);
  await updateDoc(subtaskRef, updates);
};

export const deleteSubtask = async (userId: string, taskId: string, subtaskId: string) => {
  const subtaskRef = doc(getSubtasksCollection(userId, taskId), subtaskId);
  await deleteDoc(subtaskRef);
};

// Real-time subscriptions
export const subscribeToProjects = (userId: string, callback: (projects: Project[]) => void) => {
  console.log('Firestore: Setting up projects subscription for user:', userId);
  
  // Use simple query without orderBy to avoid index requirements
  const projectsQuery = query(getProjectsCollection(userId));
  
  return onSnapshot(projectsQuery, (snapshot) => {
    console.log('Firestore: Projects snapshot received, doc count:', snapshot.docs.length);
    const projects = snapshot.docs.map(doc => {
      const project = {
        id: doc.id,
        ...doc.data(),
      } as Project;
      console.log('Firestore: Project found:', project);
      return project;
    });
    
    // Sort on client side to avoid Firestore index requirements
    projects.sort((a, b) => {
      const aTime = a.createdAt?.toMillis() || 0;
      const bTime = b.createdAt?.toMillis() || 0;
      return bTime - aTime; // Most recent first
    });
    
    console.log('Firestore: Calling projects callback with projects:', projects);
    callback(projects);
  }, (error) => {
    console.error('Firestore: Projects subscription error:', error);
  });
};

export const subscribeToTasks = (userId: string, callback: (tasks: Task[]) => void, projectId?: string) => {
  console.log('Firestore: Setting up tasks subscription for user:', userId, 'projectId:', projectId);
  
  // Use simple queries without complex indexes
  let tasksQuery = query(getTasksCollection(userId));
  
  if (projectId) {
    tasksQuery = query(
      getTasksCollection(userId),
      where('projectId', '==', projectId)
    );
  }
  
  return onSnapshot(tasksQuery, (snapshot) => {
    console.log('Firestore: Tasks snapshot received, doc count:', snapshot.docs.length);
    const tasks = snapshot.docs.map(doc => {
      const task = {
        id: doc.id,
        ...doc.data(),
      } as Task;
      console.log('Firestore: Task found:', task);
      return task;
    });
    
    // Sort on client side to avoid Firestore index requirements
    tasks.sort((a, b) => {
      // Primary sort by order (if available)
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      // Fallback to creation time
      const aTime = a.createdAt?.toMillis() || 0;
      const bTime = b.createdAt?.toMillis() || 0;
      return aTime - bTime; // Oldest first for tasks
    });
    
    console.log('Firestore: Calling tasks callback with tasks:', tasks);
    callback(tasks);
  }, (error) => {
    console.error('Firestore: Tasks subscription error:', error);
  });
};

export const subscribeToSubtasks = (userId: string, taskId: string, callback: (subtasks: Subtask[]) => void) => {
  // Use simple query without orderBy to avoid index requirements
  const subtasksQuery = query(getSubtasksCollection(userId, taskId));
  
  return onSnapshot(subtasksQuery, (snapshot) => {
    const subtasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Subtask[];
    
    // Sort on client side to avoid Firestore index requirements
    subtasks.sort((a, b) => {
      // Primary sort by order (if available)
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      // Fallback to creation time
      const aTime = a.createdAt?.toMillis() || 0;
      const bTime = b.createdAt?.toMillis() || 0;
      return aTime - bTime; // Oldest first for subtasks
    });
    
    callback(subtasks);
  });
}; 
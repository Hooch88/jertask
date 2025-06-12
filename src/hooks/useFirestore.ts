import { useState, useEffect } from 'react';
import type { Project, Task, Subtask } from '../types';
import { subscribeToProjects, subscribeToTasks, subscribeToSubtasks } from '../services/firestore';

export const useProjects = (userId: string | null) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToProjects(
      userId,
      (projectsData) => {
        setProjects(projectsData);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId]);

  return { projects, loading, error };
};

export const useTasks = (userId: string | null, projectId?: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToTasks(
      userId,
      (tasksData) => {
        setTasks(tasksData);
        setLoading(false);
      },
      projectId
    );

    return () => {
      unsubscribe();
    };
  }, [userId, projectId]);

  return { tasks, loading, error };
};

export const useSubtasks = (userId: string | null, taskId: string | null) => {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !taskId) {
      setSubtasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToSubtasks(
      userId,
      taskId,
      (subtasksData) => {
        setSubtasks(subtasksData);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId, taskId]);

  return { subtasks, loading, error };
}; 
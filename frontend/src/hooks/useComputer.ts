// hooks/useComputers.ts
import { useState, useEffect } from 'react';
import { apiClient, ApiError, type Computer } from '../lib/api';

export function useComputers() {
  const [computers, setComputers] = useState<Computer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComputers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getComputers();
      setComputers(response.data || []);
    } catch (error) {
      setError(error instanceof ApiError ? error.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComputers();
  }, []);

  const updateStatus = async (computerIds: number[], status: string, statusNote?: string) => {
    try {
      await apiClient.updateComputerStatus(computerIds, status, statusNote);
      await fetchComputers(); // Refresh data
      return true;
    } catch (error) {
      throw error;
    }
  };

  const updateVersion = async (computerIds: number[], version: string) => {
    try {
      await apiClient.updateComputerVersion(computerIds, version);
      await fetchComputers(); // Refresh data
      return true;
    } catch (error) {
      throw error;
    }
  };

  const rebootComputers = async (computerIds: number[]) => {
    try {
      await apiClient.rebootComputers(computerIds);
      return true;
    } catch (error) {
      throw error;
    }
  };

  return {
    computers,
    loading,
    error,
    refetch: fetchComputers,
    updateStatus,
    updateVersion,
    rebootComputers,
  };
}
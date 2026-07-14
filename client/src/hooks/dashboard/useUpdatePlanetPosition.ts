import { useCallback } from 'react';
import type { KeyedMutator } from 'swr';
import { dashboardService } from '../../services/dashboardService';
import type { Planet } from '../../types';

export const useUpdatePlanetPosition = (mutatePlanets: KeyedMutator<Planet[]>) => {
  const handlePlanetPositionUpdate = useCallback(
    async (id: string, pos: { x: number; y: number; z: number }) => {
      try {
        // Optimistic update
        mutatePlanets(
          (current?: Planet[]) =>
            current
              ? current.map((p: Planet) =>
                p._id === id ? { ...p, position: pos } : p,
              )
              : [],
          false,
        );
        await dashboardService.updatePlanetPosition(id, pos);
      } catch (err: unknown) {
        console.error("Failed to update planet position", err);
        mutatePlanets(); // Revert on error
      }
    },
    [mutatePlanets],
  );

  return { handlePlanetPositionUpdate };
};

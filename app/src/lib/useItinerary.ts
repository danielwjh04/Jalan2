import { useCallback, useEffect, useState } from 'react';
import type { Itinerary } from '@shared/status';
import { getItinerary } from './api';

const POLL_MS = 1000;

function isTerminal(itinerary: Itinerary): boolean {
  return itinerary.status === 'CONFIRMED' || itinerary.status === 'FAILED';
}

export function useItinerary(id: string): {
  itinerary: Itinerary | null;
  error: string | null;
  apply: (updated: Itinerary) => void;
} {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async (): Promise<void> => {
      try {
        const next = await getItinerary(id);
        if (!active) return;
        setItinerary(next);
        setError(null);
        if (isTerminal(next)) return;
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : String(cause));
      }
      timer = setTimeout(() => void tick(), POLL_MS);
    };
    void tick();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  const apply = useCallback((updated: Itinerary) => {
    setItinerary(updated);
  }, []);

  return { itinerary, error, apply };
}

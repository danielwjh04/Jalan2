import { useCallback, useEffect, useState } from 'react';
import type { Itinerary } from '@shared/status';
import { getItinerary } from './api';
import { isExpiredItineraryError } from './bookingPresentation';

const POLL_MS = 1000;

function isTerminal(itinerary: Itinerary): boolean {
  return itinerary.status === 'CONFIRMED' || itinerary.status === 'FAILED';
}

export function useItinerary(id: string): {
  itinerary: Itinerary | null;
  error: string | null;
  apply: (updated: Itinerary) => void;
  retry: () => void;
} {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

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
        const message = cause instanceof Error ? cause.message : String(cause);
        setError(message);
        if (isExpiredItineraryError(message)) return;
      }
      timer = setTimeout(() => void tick(), POLL_MS);
    };
    void tick();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [id, refreshToken]);

  const apply = useCallback((updated: Itinerary) => {
    setItinerary(updated);
  }, []);

  const retry = useCallback(() => {
    setItinerary(null);
    setError(null);
    setRefreshToken((value) => value + 1);
  }, []);

  return { itinerary, error, apply, retry };
}

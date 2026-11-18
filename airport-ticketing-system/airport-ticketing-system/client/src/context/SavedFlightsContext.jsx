import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { savedApi } from '../api';
import { useAuth } from './AuthContext';

const SavedFlightsContext = createContext(null);

/** Server-backed "saved flights" list, shared across pages (the course's reading list pattern). */
export function SavedFlightsProvider({ children }) {
  const { user } = useAuth();
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) { setFlights([]); return; }
    setLoading(true);
    try {
      setFlights(await savedApi.list());
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh().catch(() => setFlights([])); }, [refresh]);

  const isSaved = useCallback((id) => flights.some((f) => f._id === id), [flights]);

  const toggle = useCallback(async (flight) => {
    if (isSaved(flight._id)) {
      setFlights((list) => list.filter((f) => f._id !== flight._id));
      await savedApi.remove(flight._id).catch(refresh);
    } else {
      setFlights((list) => [...list, flight]);
      await savedApi.add(flight._id).catch(refresh);
    }
  }, [isSaved, refresh]);

  const value = useMemo(
    () => ({ flights, loading, isSaved, toggle, refresh }),
    [flights, loading, isSaved, toggle, refresh]
  );

  return <SavedFlightsContext.Provider value={value}>{children}</SavedFlightsContext.Provider>;
}

export function useSavedFlights() {
  const context = useContext(SavedFlightsContext);
  if (!context) throw new Error('useSavedFlights must be used inside SavedFlightsProvider');
  return context;
}

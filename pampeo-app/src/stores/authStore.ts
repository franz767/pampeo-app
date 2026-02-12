import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { Perfil, Jugador, Dueno } from '../types/database.types';

interface AuthStore {
  user: User | null;
  session: Session | null;
  perfil: Perfil | null;
  jugador: Jugador | null;
  dueno: Dueno | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setPerfil: (perfil: Perfil | null) => void;
  setJugador: (jugador: Jugador | null) => void;
  setDueno: (dueno: Dueno | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  perfil: null,
  jugador: null,
  dueno: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setPerfil: (perfil) => set({ perfil }),
  setJugador: (jugador) => set({ jugador }),
  setDueno: (dueno) => set({ dueno }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
  reset: () => set({
    user: null,
    session: null,
    perfil: null,
    jugador: null,
    dueno: null,
    loading: false,
    initialized: true,
  }),
}));

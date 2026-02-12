import { useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { Perfil, Jugador, Dueno } from '../types/database.types';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  user: User | null;
  session: Session | null;
  perfil: Perfil | null;
  jugador: Jugador | null;
  dueno: Dueno | null;
  loading: boolean;
  initialized: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    perfil: null,
    jugador: null,
    dueno: null,
    loading: true,
    initialized: false,
  });

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .single();

      let jugador = null;
      let dueno = null;

      if (perfil) {
        if (perfil.rol === 'jugador' || perfil.rol === 'admin') {
          const { data } = await supabase
            .from('jugadores')
            .select('*')
            .eq('perfil_id', userId)
            .single();
          jugador = data;
        }

        if (perfil.rol === 'dueno') {
          const { data } = await supabase
            .from('duenos')
            .select('*')
            .eq('perfil_id', userId)
            .single();
          dueno = data;
        }
      }

      return { perfil, jugador, dueno };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return { perfil: null, jugador: null, dueno: null };
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const userData = await fetchUserData(session.user.id);
        setState({
          user: session.user,
          session,
          ...userData,
          loading: false,
          initialized: true,
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          initialized: true,
        }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const userData = await fetchUserData(session.user.id);
          setState({
            user: session.user,
            session,
            ...userData,
            loading: false,
            initialized: true,
          });
        } else {
          setState({
            user: null,
            session: null,
            perfil: null,
            jugador: null,
            dueno: null,
            loading: false,
            initialized: true,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const signInWithEmail = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true }));
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
    return data;
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    nombreCompleto: string,
    rol: 'jugador' | 'dueno' = 'jugador'
  ) => {
    setState(prev => ({ ...prev, loading: true }));
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre_completo: nombreCompleto,
          rol,
        },
      },
    });
    if (error) {
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
    return data;
  };

  const signInWithGoogle = async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const redirectUrl = makeRedirectUri({
        scheme: 'pampeo',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success') {
          const url = new URL(result.url);
          const params = new URLSearchParams(url.hash.slice(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        }
      }
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true }));
    const { error } = await supabase.auth.signOut();
    if (error) {
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'pampeo://reset-password',
    });
    if (error) throw error;
  };

  const refreshUserData = async () => {
    if (state.user) {
      const userData = await fetchUserData(state.user.id);
      setState(prev => ({ ...prev, ...userData }));
    }
  };

  return {
    ...state,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    resetPassword,
    refreshUserData,
    isAuthenticated: !!state.session,
    isJugador: state.perfil?.rol === 'jugador',
    isDueno: state.perfil?.rol === 'dueno',
    isAdmin: state.perfil?.rol === 'admin',
  };
}

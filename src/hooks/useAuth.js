import { useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { profilesApi } from '../api/profilesApi';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = authApi.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const data = await profilesApi.getById(userId);
    setProfile(data);
    setLoading(false);
  };

  const signUp = authApi.signUpWithEmail;
  const signInWithUsername = authApi.signInWithUsername;
  const signInWithGoogle = authApi.signInWithGoogle;
  const signOut = authApi.signOut;

  const updateProfile = async (updates) => {
    const data = await profilesApi.update(user.id, updates);
    setProfile(data);
    return data;
  };

  return { user, profile, loading, signUp, signInWithUsername, signInWithGoogle, signOut, updateProfile };
}

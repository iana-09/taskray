import { supabase } from '../config/supabase';
import { profilesApi } from './profilesApi';

const cleanUsername = (username) => username.trim().toLowerCase();

const getVerificationParts = (value) => {
  const raw = value.trim();
  try {
    const url = new URL(raw);
    return {
      code: url.searchParams.get('code'),
      token: url.searchParams.get('token'),
      tokenHash: url.searchParams.get('token_hash'),
      type: url.searchParams.get('type'),
    };
  } catch {
    return { token: raw.replace(/\s/g, '') };
  }
};

const getLoginErrorMessage = (error) => {
  const message = error?.message?.toLowerCase() || '';
  if (message.includes('email not confirmed') || message.includes('confirm')) {
    return 'Please verify your email before signing in.';
  }
  if (message.includes('invalid login credentials')) {
    return 'Wrong password, or this email has not finished signup.';
  }
  if (message.includes('too many')) {
    return 'Too many login attempts. Please wait a moment and try again.';
  }
  return error?.message || 'Unable to sign in. Please try again.';
};

export const authApi = {
  getSession() {
    return supabase.auth.getSession();
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },

  async exchangeCodeForSession(code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return data;
  },

  async completePasswordRecoveryFromUrl() {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const code = query.get('code') || hash.get('code');
    const accessToken = hash.get('access_token') || query.get('access_token');
    const refreshToken = hash.get('refresh_token') || query.get('refresh_token');

    if (code) {
      const data = await this.exchangeCodeForSession(code);
      window.history.replaceState({}, '', '/reset-password');
      return data;
    }

    if (accessToken && refreshToken) {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) throw error;
      window.history.replaceState({}, '', '/reset-password');
      return data;
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!session) throw new Error('The recovery link is invalid or expired. Please request a new reset email.');
    return { session, user: session.user };
  },

  async signInWithIdentifier({ username, password }) {
    const identifier = username.trim().toLowerCase();
    let email = identifier;

    if (!identifier.includes('@')) {
      try {
        email = await profilesApi.getLoginEmail(identifier);
        if (!email) throw new Error('Username not found. Please sign up first or use your email.');
      } catch (err) {
        if (!/lookup_login_email/i.test(err.message || '')) {
          throw new Error(err.message || 'Username not found. Please sign up first or use your email.');
        }
        const profile = await profilesApi.getByUsername(identifier, 'email');
        if (!profile) throw new Error('Username not found. Please sign up first or use your email.');
        email = profile.email;
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(getLoginErrorMessage(error));
    return data;
  },

  async signInWithUsername(credentials) {
    return this.signInWithIdentifier(credentials);
  },

  async signUpWithEmail({ name, username, email, password }) {
    const [usernameTaken, emailTaken] = await Promise.all([
      profilesApi.usernameExists(username),
      profilesApi.emailExists(email),
    ]);

    if (usernameTaken) throw new Error('Username is already taken');
    if (emailTaken) throw new Error('Email is already registered');

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
          username: cleanUsername(username),
        },
      },
    });

    if (error) throw error;
    return data;
  },

  async verifySignupCode({ email, token }) {
    const parts = getVerificationParts(token);

    if (parts.code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(parts.code);
      if (error) throw error;
      return data;
    }

    if (parts.tokenHash) {
      const verifyType = parts.type || 'signup';
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: parts.tokenHash,
        type: verifyType,
      });
      if (error) throw error;
      return data;
    }

    const cleanToken = (parts.token || '').replace(/\D/g, '');
    const normalizedEmail = email.trim().toLowerCase();
    const signupResult = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: cleanToken,
      type: 'signup',
    });

    if (!signupResult.error) return signupResult.data;

    const emailResult = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: cleanToken,
      type: 'email',
    });

    if (emailResult.error) throw signupResult.error;
    return emailResult.data;
  },

  async resendSignupCode(email) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
    });

    if (error) throw error;
  },

  async signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });

    if (error) throw error;
  },

  async resetPasswordForEmail(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password?type=recovery`,
    });

    if (error) throw error;
  },

  async updatePassword(password) {
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};

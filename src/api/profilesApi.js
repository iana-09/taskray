import { supabase } from '../config/supabase';

const cleanUsername = (username = '') => username.trim().toLowerCase();
const cleanEmail = (email = '') => email.trim().toLowerCase();

export const profilesApi = {
  async getById(id) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getByUsername(username, columns = '*') {
    const { data, error } = await supabase
      .from('profiles')
      .select(columns)
      .ilike('username', cleanUsername(username))
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getLoginEmail(identifier) {
    const { data, error } = await supabase.rpc('lookup_login_email', {
      login_identifier: cleanUsername(identifier),
    });

    if (error) throw error;
    return data;
  },

  async getByEmail(email, columns = '*') {
    const { data, error } = await supabase
      .from('profiles')
      .select(columns)
      .ilike('email', cleanEmail(email))
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async usernameExists(username, ignoreId) {
    const profile = await this.getByUsername(username, 'id');
    return Boolean(profile && profile.id !== ignoreId);
  },

  async emailExists(email, ignoreId) {
    const profile = await this.getByEmail(email, 'id');
    return Boolean(profile && profile.id !== ignoreId);
  },

  async update(id, updates) {
    const cleanUpdates = {
      ...updates,
      username: updates.username ? cleanUsername(updates.username) : updates.username,
      email: updates.email ? cleanEmail(updates.email) : updates.email,
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id, ...cleanUpdates }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

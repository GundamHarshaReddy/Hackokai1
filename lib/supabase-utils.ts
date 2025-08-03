import { supabase } from './supabase'

/**
 * Supabase utility functions for common database operations
 */

// Authentication helpers
export const auth = {
  // Sign up with email and password
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Get current session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  }
}

// Database helpers
export const db = {
  // Generic CRUD operations
  select: async (table: string, columns = '*', filters?: Record<string, any>) => {
    let query = supabase.from(table).select(columns)
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }
    
    return await query
  },

  insert: async (table: string, data: any) => {
    return await supabase.from(table).insert(data).select()
  },

  update: async (table: string, id: string, data: any) => {
    return await supabase.from(table).update(data).eq('id', id).select()
  },

  delete: async (table: string, id: string) => {
    return await supabase.from(table).delete().eq('id', id)
  },

  // Batch operations
  insertMany: async (table: string, data: any[]) => {
    return await supabase.from(table).insert(data).select()
  },

  // Real-time subscriptions
  subscribe: (table: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`${table}-changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe()
  }
}

// Storage helpers
export const storage = {
  // Upload file
  upload: async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file)
    
    return { data, error }
  },

  // Download file
  download: async (bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path)
    
    return { data, error }
  },

  // Get public URL
  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    
    return data.publicUrl
  },

  // Delete file
  remove: async (bucket: string, paths: string[]) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove(paths)
    
    return { data, error }
  }
}

// Error handling helper
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error)
  
  if (error?.code === 'PGRST116') {
    return 'Resource not found'
  }
  
  if (error?.code === '23505') {
    return 'Resource already exists'
  }
  
  if (error?.code === 'PGRST301') {
    return 'Unauthorized access'
  }
  
  return error?.message || 'An unexpected error occurred'
}

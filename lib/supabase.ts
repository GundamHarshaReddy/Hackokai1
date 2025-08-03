import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Check if we're in a server environment without env vars
const isServer = typeof window === 'undefined'
const hasValidEnvVars = supabaseUrl && supabaseAnonKey

if (!hasValidEnvVars && !isServer) {
  console.warn('Missing Supabase environment variables. Please check your .env.local file.')
}

// Create Supabase client with fallback values for SSR
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
)

// Create admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = isServer && supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Runtime check for valid configuration
const checkSupabaseConfig = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
  }
}

// Database Types based on your complete schema
export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          education_degree: string
          specialization: string
          core_values: string[]
          work_preferences: Record<string, number>
          personality_scores: Record<string, number>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          education_degree: string
          specialization: string
          core_values: string[]
          work_preferences: Record<string, number>
          personality_scores: Record<string, number>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          education_degree?: string
          specialization?: string
          core_values?: string[]
          work_preferences?: Record<string, number>
          personality_scores?: Record<string, number>
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          job_id: string
          contact_name: string
          contact_number: string
          company_name: string
          job_title: string
          job_type: string
          job_description: string
          location: string | null
          salary_stipend: string | null
          key_skills: string[] | null
          qr_code_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          contact_name: string
          contact_number: string
          company_name: string
          job_title: string
          job_type: string
          job_description: string
          location?: string | null
          salary_stipend?: string | null
          key_skills?: string[] | null
          qr_code_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          contact_name?: string
          contact_number?: string
          company_name?: string
          job_title?: string
          job_type?: string
          job_description?: string
          location?: string | null
          salary_stipend?: string | null
          key_skills?: string[] | null
          qr_code_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      student_job_interests: {
        Row: {
          id: string
          student_id: string
          job_id: string
          fitment_score: number | null
          is_interested: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          job_id: string
          fitment_score?: number | null
          is_interested?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          job_id?: string
          fitment_score?: number | null
          is_interested?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Type helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Typed interfaces that match the database schema
export type Student = Tables<'students'>
export type Job = Tables<'jobs'>
export type StudentJobInterest = Tables<'student_job_interests'>
export type User = Tables<'users'>

// Insert types for forms
export type StudentInsert = TablesInsert<'students'>
export type JobInsert = TablesInsert<'jobs'>
export type StudentJobInterestInsert = TablesInsert<'student_job_interests'>

// Database helper functions
export const dbHelpers = {
  // Job operations
  async insertJob(job: JobInsert): Promise<Job> {
    checkSupabaseConfig()
    const { data, error } = await supabase.from("jobs").insert([job]).select().single()

    if (error) {
      console.error("Database error inserting job:", error)
      throw new Error(`Failed to create job: ${error.message}`)
    }
    return data
  },

  async getJobs(): Promise<Job[]> {
    checkSupabaseConfig()
    const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Database error fetching jobs:", error)
      throw new Error(`Failed to fetch jobs: ${error.message}`)
    }
    return data || []
  },

  async getJobByJobId(jobId: string): Promise<Job | null> {
    checkSupabaseConfig()
    const { data, error } = await supabase.from("jobs").select("*").eq("job_id", jobId).single()

    if (error) {
      if (error.code === "PGRST116") return null // Not found
      console.error("Database error fetching job by job_id:", error)
      throw new Error(`Failed to fetch job: ${error.message}`)
    }
    return data
  },

  async getJobById(id: string): Promise<Job | null> {
    checkSupabaseConfig()
    const { data, error } = await supabase.from("jobs").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") return null // Not found
      console.error("Database error fetching job by id:", error)
      throw new Error(`Failed to fetch job: ${error.message}`)
    }
    return data
  },

  async deleteJob(id: string): Promise<void> {
    checkSupabaseConfig()
    const { error } = await supabase.from("jobs").delete().eq("id", id)

    if (error) {
      console.error("Database error deleting job:", error)
      throw new Error(`Failed to delete job: ${error.message}`)
    }
  },

  // Student operations
  async insertStudent(student: StudentInsert): Promise<Student> {
    checkSupabaseConfig()
    
    // Ensure the data is properly formatted
    const studentData = {
      ...student,
      core_values: Array.isArray(student.core_values) ? student.core_values : [],
      work_preferences: typeof student.work_preferences === 'object' ? student.work_preferences : {},
      personality_scores: typeof student.personality_scores === 'object' ? student.personality_scores : {}
    }

    // Use admin client to bypass RLS when inserting students
    const client = supabaseAdmin || supabase
    const { data, error } = await client.from("students").insert([studentData]).select().single()

    if (error) {
      console.error("Database error inserting student:", error)
      throw new Error(`Failed to create student profile: ${error.message}`)
    }
    return data
  },

  async getStudents(): Promise<Student[]> {
    checkSupabaseConfig()
    const { data, error } = await supabase.from("students").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Database error fetching students:", error)
      throw new Error(`Failed to fetch students: ${error.message}`)
    }
    return data || []
  },

  async getStudentByPhone(phone: string): Promise<Student | null> {
    checkSupabaseConfig()
    const { data, error } = await supabase.from("students").select("*").eq("phone", phone).single()

    if (error) {
      if (error.code === "PGRST116") return null // Not found
      console.error("Database error fetching student by phone:", error)
      throw new Error(`Failed to fetch student: ${error.message}`)
    }
    return data
  },

  async getStudentByEmail(email: string): Promise<Student | null> {
    checkSupabaseConfig()
    const { data, error } = await supabase.from("students").select("*").eq("email", email).single()

    if (error) {
      if (error.code === "PGRST116") return null // Not found
      console.error("Database error fetching student by email:", error)
      throw new Error(`Failed to fetch student: ${error.message}`)
    }
    return data
  },

  async getStudentById(id: string): Promise<Student | null> {
    checkSupabaseConfig()
    const { data, error } = await supabase.from("students").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") return null // Not found
      console.error("Database error fetching student by id:", error)
      throw new Error(`Failed to fetch student: ${error.message}`)
    }
    return data
  },

  // Student job interest operations
  async upsertStudentJobInterest(interest: StudentJobInterestInsert): Promise<StudentJobInterest> {
    checkSupabaseConfig()
    const { data, error } = await supabase
      .from("student_job_interests")
      .upsert([interest], {
        onConflict: "student_id,job_id",
        ignoreDuplicates: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error upserting student job interest:", error)
      throw new Error(`Failed to save interest: ${error.message}`)
    }
    return data
  },

  async getStudentJobInterests(studentId: string): Promise<StudentJobInterest[]> {
    checkSupabaseConfig()
    const { data, error } = await supabase.from("student_job_interests").select("*").eq("student_id", studentId)

    if (error) {
      console.error("Database error fetching student interests:", error)
      throw new Error(`Failed to fetch student interests: ${error.message}`)
    }
    return data || []
  },

  async getJobInterests(jobId: string): Promise<StudentJobInterest[]> {
    checkSupabaseConfig()
    const { data, error } = await supabase
      .from("student_job_interests")
      .select(`
        *,
        students (
          name,
          email,
          phone,
          education_degree,
          specialization
        )
      `)
      .eq("job_id", jobId)

    if (error) {
      console.error("Database error fetching job interests:", error)
      throw new Error(`Failed to fetch job interests: ${error.message}`)
    }
    return data || []
  },

  // Analytics
  async getJobStats() {
    checkSupabaseConfig()
    try {
      const [jobsResult, studentsResult, interestsResult] = await Promise.all([
        supabase.from("jobs").select("job_type", { count: "exact" }),
        supabase.from("students").select("id", { count: "exact" }),
        supabase.from("student_job_interests").select("is_interested", { count: "exact" }).eq("is_interested", true),
      ])

      if (jobsResult.error) throw jobsResult.error
      if (studentsResult.error) throw studentsResult.error
      if (interestsResult.error) throw interestsResult.error

      const jobTypes =
        jobsResult.data?.reduce((acc: Record<string, number>, job: { job_type: string }) => {
          acc[job.job_type] = (acc[job.job_type] || 0) + 1
          return acc
        }, {}) || {}

      return {
        totalJobs: jobsResult.count || 0,
        totalStudents: studentsResult.count || 0,
        totalInterests: interestsResult.count || 0,
        internships: jobTypes["Internship"] || 0,
        fullTime: jobTypes["Full-Time"] || 0,
        partTime: jobTypes["Part-Time"] || 0,
        freelance: jobTypes["Freelance"] || 0,
        contract: jobTypes["Contract"] || 0,
      }
    } catch (error) {
      console.error("Database error fetching stats:", error)
      throw new Error(`Failed to fetch statistics: ${error}`)
    }
  },
}

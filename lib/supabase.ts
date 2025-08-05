import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

if (supabaseUrl.includes('your_supabase_project_url_here')) {
  throw new Error('Please update NEXT_PUBLIC_SUPABASE_URL with your actual Supabase project URL in .env.local')
}

if (supabaseAnonKey.includes('your_supabase_anon_key_here')) {
  throw new Error('Please update NEXT_PUBLIC_SUPABASE_ANON_KEY with your actual Supabase anon key in .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface Student {
  id: string
  name: string
  email: string
  phone: string // 10-digit Indian phone number
  education_degree: string
  specialization: string
  core_values: string[]
  work_preferences: {
    independence: number
    structure: number
    pace: number
    innovation: number
    interaction: number
  }
  personality_scores: {
    [key: string]: number
  }
  created_at: string
  updated_at: string
}

export interface CareerRecommendation {
  id: string
  student_id: string
  role: string
  match_score: number
  explanation: string
  job_openings: number
  created_at: string
}

export interface Job {
  id: string
  company_name: string
  job_title: string
  job_description: string
  location: string
  job_type: string
  key_skills: string[]
  created_at: string
  updated_at: string
}

export interface JobApplication {
  id: string
  student_id: string
  job_id: string
  phone: string
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected'
  created_at: string
}

export interface CareerInterest {
  id: string
  student_id: string
  career_role: string
  created_at: string
}

export interface JobInterest {
  id: string
  student_id: string
  job_id: string
  created_at: string
}

// Database Functions
export const dbOperations = {
  // Student operations
  async createStudent(studentData: Omit<Student, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('students')
      .insert([studentData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getStudentByEmail(email: string) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
    return data
  },

  async getStudentByPhone(phone: string) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('phone', phone)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getStudentById(id: string) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async updateStudent(id: string, updates: Partial<Student>) {
    const { data, error } = await supabase
      .from('students')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Career recommendation operations
  async saveCareerRecommendations(studentId: string, recommendations: Omit<CareerRecommendation, 'id' | 'student_id' | 'created_at'>[]) {
    const recommendationsWithStudentId = recommendations.map(rec => ({
      ...rec,
      student_id: studentId
    }))

    const { data, error } = await supabase
      .from('career_recommendations')
      .insert(recommendationsWithStudentId)
      .select()
    
    if (error) throw error
    return data
  },

  async getCareerRecommendations(studentId: string) {
    const { data, error } = await supabase
      .from('career_recommendations')
      .select('*')
      .eq('student_id', studentId)
      .order('match_score', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Job operations
  async createJob(jobData: Omit<Job, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('jobs')
      .insert([jobData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getJobs() {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getJobById(id: string) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async deleteJob(id: string) {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return { success: true }
  },

  async getJobsByCareer(careerType: string) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .ilike('job_title', `%${careerType}%`)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Job application operations
  async createJobApplication(applicationData: Omit<JobApplication, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('job_applications')
      .insert([applicationData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getJobApplications(studentId?: string, jobId?: string) {
    let query = supabase.from('job_applications').select(`
      *,
      students:student_id(*),
      jobs:job_id(*)
    `)
    
    if (studentId) query = query.eq('student_id', studentId)
    if (jobId) query = query.eq('job_id', jobId)
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Admin operations
  async getAllStudents() {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async searchStudentsByPhone(phone: string) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .ilike('phone', `%${phone}%`)
    
    if (error) throw error
    return data
  },

  // Career interests operations
  async addCareerInterest(studentId: string, careerRole: string) {
    const { data, error } = await supabase
      .from('career_interests')
      .insert({
        student_id: studentId,
        career_role: careerRole
      })
      .select()
    
    if (error) throw error
    return data
  },

  async removeCareerInterest(studentId: string, careerRole: string) {
    const { error } = await supabase
      .from('career_interests')
      .delete()
      .match({ student_id: studentId, career_role: careerRole })
    
    if (error) throw error
  },

  async getCareerInterests(studentId: string) {
    const { data, error } = await supabase
      .from('career_interests')
      .select('*')
      .eq('student_id', studentId)
    
    if (error) throw error
    return data
  },

  // Job interests operations
  async addJobInterest(studentId: string, jobId: string) {
    const { data, error } = await supabase
      .from('job_interests')
      .insert({
        student_id: studentId,
        job_id: jobId
      })
      .select()
    
    if (error) throw error
    return data
  },

  async removeJobInterest(studentId: string, jobId: string) {
    const { error } = await supabase
      .from('job_interests')
      .delete()
      .match({ student_id: studentId, job_id: jobId })
    
    if (error) throw error
  },

  async getJobInterests(studentId: string) {
    const { data, error } = await supabase
      .from('job_interests')
      .select('*')
      .eq('student_id', studentId)
    
    if (error) throw error
    return data
  }
}

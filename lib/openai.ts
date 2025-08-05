import OpenAI from 'openai'

// Types for student and job data
interface Student {
  name?: string
  skills?: string[]
  specialization?: string
  experience_level?: string
  interests?: string[]
  core_values?: string[]
  work_preferences?: Record<string, number>
  preferred_company_size?: string
  preferred_work_environment?: string
  career_goals?: string[]
  learning_style?: string
  stress_management?: string
  project_approach?: string
  tech_comfort?: string
  education_degree?: string
  personality_scores?: Record<string, number>
}

interface Job {
  job_title: string
  job_description: string
  company_name: string
  location?: string
  job_type: string
  key_skills?: string[]
}

// Check if OpenAI API key is available (server-side only)
const getOpenAIApiKey = () => {
  // Only access environment variables on server side
  if (typeof window === 'undefined') {
    return process.env.OPENAI_API_KEY
  }
  return null
}

const openaiApiKey = getOpenAIApiKey()
const isOpenAIConfigured = !!openaiApiKey

// Initialize OpenAI with better error handling
let openai: OpenAI | null = null
if (isOpenAIConfigured) {
  try {
    openai = new OpenAI({
      apiKey: openaiApiKey,
    })
  } catch (error) {
    console.error("Failed to initialize OpenAI client:", error)
    openai = null
  }
}

// Enhanced matching logic based on complete assessment data
const generateFallbackRecommendations = (student: Student) => {
  const { education_degree, specialization, core_values, work_preferences, personality_scores } = student

  const recommendations = []

  // Helper function to calculate fitment score based on multiple factors
  const calculateFitmentScore = (
    educationWeight: number, 
    valuesWeight: number, 
    workStyleWeight: number, 
    personalityWeight: number,
    baseScore: number = 50
  ) => {
    let score = baseScore
    
    // Education fit (0-25 points)
    score += educationWeight * 25
    
    // Core values alignment (0-25 points)
    score += valuesWeight * 25
    
    // Work style preferences (0-25 points)
    score += workStyleWeight * 25
    
    // Personality traits (0-25 points)
    score += personalityWeight * 25
    
    // Add some randomness for more realistic variation (±5 points)
    const variation = (Math.random() - 0.5) * 10
    score += variation
    
    return Math.min(Math.max(Math.round(score), 45), 95) // Keep between 45-95%
  }

  // Helper function to create detailed explanations
  const createExplanation = (role: string, educationFit: string, valuesFit: string[], workStyleFit: string, personalityFit: string) => {
    const selectedValues = core_values?.filter((value: string) => valuesFit.includes(value)) || []
    const valuesText = selectedValues.length > 0 ? selectedValues.join(' and ') : 'your core values'
    
    return `Your ${education_degree} in ${specialization} ${educationFit}. Your emphasis on ${valuesText} aligns perfectly with this role. ${workStyleFit} ${personalityFit}`
  }

  // Calculate personality trait scores for better matching
  const analyticalScore = personality_scores?.analytical || personality_scores?.[0] || 3
  const leadershipScore = personality_scores?.leadership || personality_scores?.[1] || 3
  const creativityScore = personality_scores?.creativity || personality_scores?.[3] || 3
  const conscientiousnessScore = personality_scores?.conscientiousness || personality_scores?.[4] || 3
  const extraversionScore = personality_scores?.extraversion || personality_scores?.[1] || 3

  // Tech-related recommendations
  if (specialization?.toLowerCase().includes('computer') || 
      specialization?.toLowerCase().includes('software') ||
      specialization?.toLowerCase().includes('information') ||
      specialization?.toLowerCase().includes('technology')) {
    
    const educationFit = 0.9 // Strong education fit
    const valuesFit = core_values?.some(v => ['Innovation', 'Excellence', 'Growth'].includes(v)) ? 0.8 : 0.6
    const workStyleFit = ((work_preferences?.innovation || 50) / 100 + (work_preferences?.independence || 50) / 100) / 2
    const personalityFit = analyticalScore / 5
    
    const softwareDeveloperScore = calculateFitmentScore(educationFit, valuesFit, workStyleFit, personalityFit, 60)
    
    recommendations.push({
      role: "Software Developer",
      match: softwareDeveloperScore,
      explanation: createExplanation(
        "Software Developer",
        "provides the technical foundation essential for software development",
        ["Innovation", "Excellence", "Growth"],
        `With your work preferences showing ${work_preferences?.innovation || 50}/100 for innovation and ${work_preferences?.independence || 50}/100 for independent work, you'll thrive in development environments.`,
        `Your analytical thinking score of ${analyticalScore}/5 indicates strong problem-solving abilities crucial for coding.`
      ),
      openings: 4500
    })

    if ((work_preferences?.interaction || 0) > 60) {
      const fullStackScore = calculateFitmentScore(educationFit, valuesFit, 0.8, personalityFit, 58)
      
      recommendations.push({
        role: "Full Stack Developer", 
        match: fullStackScore,
        explanation: createExplanation(
          "Full Stack Developer",
          "covers both frontend and backend technologies perfectly suited to your technical background",
          ["Innovation", "Excellence", "Collaboration"],
          `Your interaction preference of ${work_preferences?.interaction || 50}/100 shows you enjoy collaborative work, ideal for full-stack teams.`,
          `Combined with conscientiousness score of ${conscientiousnessScore}/5, you'll excel at managing complex projects.`
        ),
        openings: 3200
      })
    }
  }

  // Data Science related
  if (specialization?.toLowerCase().includes('data') ||
      specialization?.toLowerCase().includes('statistics') ||
      education_degree?.includes('M.Tech') ||
      core_values?.includes('Innovation') ||
      analyticalScore >= 4) {
    
    const educationFit = specialization?.toLowerCase().includes('data') ? 0.95 : 0.7
    const valuesFit = core_values?.some(v => ['Innovation', 'Excellence', 'Growth'].includes(v)) ? 0.85 : 0.6
    const workStyleFit = ((work_preferences?.structure || 50) / 100 + (work_preferences?.innovation || 50) / 100) / 2
    const personalityFit = (analyticalScore + conscientiousnessScore) / 10
    
    const dataAnalystScore = calculateFitmentScore(educationFit, valuesFit, workStyleFit, personalityFit, 55)
    
    recommendations.push({
      role: "Data Analyst",
      match: dataAnalystScore,
      explanation: createExplanation(
        "Data Analyst",
        "provides strong analytical foundation essential for data interpretation",
        ["Innovation", "Excellence", "Growth"],
        `Your structured work preference (${work_preferences?.structure || 50}/100) aligns with data analysis methodologies.`,
        `High analytical thinking (${analyticalScore}/5) and conscientiousness (${conscientiousnessScore}/5) are perfect for data-driven roles.`
      ),
      openings: 2800
    })
  }

  // Business/Management related
  if (education_degree?.includes('MBA') || 
      education_degree?.includes('B.Com') ||
      education_degree?.includes('BBA') ||
      specialization?.toLowerCase().includes('marketing') ||
      specialization?.toLowerCase().includes('business') ||
      ((work_preferences?.interaction || 0) > 70 && extraversionScore >= 4)) {
    
    const educationFit = ['MBA', 'B.Com', 'BBA'].some(deg => education_degree?.includes(deg)) ? 0.9 : 0.6
    const valuesFit = core_values?.some(v => ['Creativity', 'Impact', 'Growth', 'Leadership'].includes(v)) ? 0.8 : 0.6
    const workStyleFit = ((work_preferences?.interaction || 50) / 100 + (work_preferences?.pace || 50) / 100) / 2
    const personalityFit = (extraversionScore + leadershipScore) / 10
    
    const marketingScore = calculateFitmentScore(educationFit, valuesFit, workStyleFit, personalityFit, 52)
    
    recommendations.push({
      role: "Digital Marketing Specialist",
      match: marketingScore,
      explanation: createExplanation(
        "Digital Marketing Specialist",
        "provides business acumen essential for marketing strategy",
        ["Creativity", "Impact", "Growth"],
        `Your high interaction preference (${work_preferences?.interaction || 50}/100) and pace preference (${work_preferences?.pace || 50}/100) suit the dynamic marketing environment.`,
        `Extraversion score of ${extraversionScore}/5 indicates natural communication skills vital for marketing.`
      ),
      openings: 2500
    })

    if (core_values?.includes('Leadership') || conscientiousnessScore >= 4) {
      const productManagerScore = calculateFitmentScore(educationFit, 0.85, workStyleFit, personalityFit, 55)
      
      recommendations.push({
        role: "Product Manager",
        match: productManagerScore,
        explanation: createExplanation(
          "Product Manager",
          "provides strategic thinking foundation essential for product leadership",
          ["Leadership", "Innovation", "Impact"],
          `Your balanced work preferences (innovation: ${work_preferences?.innovation || 50}/100, structure: ${work_preferences?.structure || 50}/100) are ideal for product management.`,
          `High conscientiousness (${conscientiousnessScore}/5) and leadership values show strong management potential.`
        ),
        openings: 1800
      })
    }
  }

  // Design related
  if (specialization?.toLowerCase().includes('design') ||
      specialization?.toLowerCase().includes('art') ||
      core_values?.includes('Creativity') ||
      creativityScore >= 4) {
    
    const educationFit = specialization?.toLowerCase().includes('design') ? 0.95 : 0.6
    const valuesFit = core_values?.some(v => ['Creativity', 'Innovation', 'Excellence'].includes(v)) ? 0.9 : 0.7
    const workStyleFit = ((work_preferences?.innovation || 50) / 100 + (work_preferences?.independence || 50) / 100) / 2
    const personalityFit = creativityScore / 5
    
    const uiuxScore = calculateFitmentScore(educationFit, valuesFit, workStyleFit, personalityFit, 58)
    
    recommendations.push({
      role: "UI/UX Designer",
      match: uiuxScore,
      explanation: createExplanation(
        "UI/UX Designer",
        "aligns perfectly with design thinking and user experience principles",
        ["Creativity", "Innovation", "Excellence"],
        `Your innovation preference (${work_preferences?.innovation || 50}/100) and flexibility preference show ideal design mindset.`,
        `High creativity score (${creativityScore}/5) is essential for design innovation and user-centered solutions.`
      ),
      openings: 2200
    })
  }

  // Engineering related (for non-CS engineering students)
  if ((education_degree?.includes('B.Tech') || education_degree?.includes('B.E')) &&
      !specialization?.toLowerCase().includes('computer') &&
      !specialization?.toLowerCase().includes('software')) {
    
    const educationFit = 0.8
    const valuesFit = core_values?.some(v => ['Excellence', 'Innovation', 'Growth'].includes(v)) ? 0.75 : 0.6
    const workStyleFit = ((work_preferences?.structure || 50) / 100 + (work_preferences?.innovation || 50) / 100) / 2
    const personalityFit = (analyticalScore + conscientiousnessScore) / 10
    
    const projectManagerScore = calculateFitmentScore(educationFit, valuesFit, workStyleFit, personalityFit, 50)
    
    recommendations.push({
      role: "Technical Project Manager",
      match: projectManagerScore,
      explanation: createExplanation(
        "Technical Project Manager",
        "provides strong technical foundation essential for managing engineering projects",
        ["Excellence", "Leadership", "Collaboration"],
        `Your engineering background combined with balanced work preferences makes you ideal for technical project leadership.`,
        `High analytical thinking (${analyticalScore}/5) and conscientiousness (${conscientiousnessScore}/5) ensure excellent project execution.`
      ),
      openings: 1500
    })
  }

  // Ensure we have at least 4 recommendations
  while (recommendations.length < 4) {
    const generalScore = calculateFitmentScore(0.6, 0.7, 0.6, 0.7, 45)
    
    recommendations.push({
      role: "Business Analyst",
      match: generalScore,
      explanation: createExplanation(
        "Business Analyst",
        "provides analytical foundation essential for business process optimization",
        ["Excellence", "Growth", "Impact"],
        `Your balanced work preferences show adaptability crucial for analyzing diverse business requirements.`,
        `Strong analytical capabilities (${analyticalScore}/5) combined with business acumen make you effective at bridging technical and business domains.`
      ),
      openings: 1800
    })
    break
  }

  // Sort by match score and return top 6
  return recommendations
    .sort((a, b) => b.match - a.match)
    .slice(0, 6)
}

export async function generateStudentSummary(student: Student) {
  if (!openai) {
    // Enhanced fallback summary generation
    const { name, education_degree, specialization, core_values, work_preferences, personality_scores } = student
    
    // Analyze work preferences
    const highPrefs = Object.entries(work_preferences || {})
      .filter(([, value]) => (value as number) > 70)
      .map(([key]) => {
        const labels = {
          independence: 'prefers collaborative teamwork',
          structure: 'thrives in flexible environments', 
          pace: 'excels in fast-paced settings',
          innovation: 'seeks innovative approaches',
          interaction: 'enjoys high social interaction'
        }
        return labels[key as keyof typeof labels] || key
      })

    // Analyze personality strengths
    const strengths = Object.entries(personality_scores || {})
      .filter(([, value]) => (value as number) >= 4)
      .map(([key]) => {
        const traits = {
          openness: 'highly creative and open to new experiences',
          conscientiousness: 'extremely organized and detail-oriented',
          extraversion: 'naturally outgoing and energetic',
          agreeableness: 'collaborative and team-focused',
          analytical: 'strong analytical and problem-solving abilities',
          creative: 'exceptional creative thinking skills'
        }
        return traits[key as keyof typeof traits] || key
      })

    const workStyle = highPrefs.length > 0 ? ` They ${highPrefs.slice(0, 2).join(' and ')}.` : ''
    const personalityText = strengths.length > 0 ? ` Their key strengths include ${strengths.slice(0, 2).join(' and ')}.` : ''
    
    return `${name} is a motivated ${education_degree} graduate specializing in ${specialization}, with core values centered on ${core_values?.slice(0, 3).join(', ')}.${workStyle}${personalityText} This combination of educational foundation, value-driven approach, and natural abilities positions them well for impactful roles in their chosen field.`
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a professional career counselor. Generate a comprehensive yet concise professional summary that specifically references the student's assessment choices. Show how their education, values, work preferences, and personality traits create a unique professional profile.",
        },
        {
          role: "user",
          content: `Generate a detailed professional summary for this student that specifically references their assessment responses:

STUDENT ASSESSMENT PROFILE:
👤 Name: ${student.name}
🎓 Education: ${student.education_degree} in ${student.specialization}

💎 Core Values (their top 5 priorities):
${student.core_values?.map((value: string, i: number) => `${i + 1}. ${value}`).join('\n')}

⚖️ Work Preferences (0-100 scale):
${Object.entries(student.work_preferences || {}).map(([key, value]) => {
  const labels = {
    independence: 'Independent Work ↔ Team Collaboration',
    structure: 'Structured ↔ Flexible Environment',
    pace: 'Steady ↔ Fast-Paced Work', 
    innovation: 'Proven Methods ↔ Innovation',
    interaction: 'Low ↔ High Social Interaction'
  }
  return `• ${labels[key as keyof typeof labels] || key}: ${value}/100`
}).join('\n')}

🧠 Personality Scores (1-5 scale):
${Object.entries(student.personality_scores || {}).map(([key, value]) => `• ${key}: ${value}/5`).join('\n')}

Create a 120-150 word professional summary that:
1. References specific values they selected
2. Mentions their work preference scores and what they indicate
3. Highlights their strongest personality traits
4. Connects their education to career potential
5. Shows how all these elements create their unique professional profile

Write in third person, professional tone.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 250,
    })

    return completion.choices[0]?.message?.content || "Unable to generate summary"
  } catch (error) {
    console.error("OpenAI API error:", error)
    // Return enhanced fallback summary on error
    const { name, education_degree, specialization, core_values, work_preferences, personality_scores } = student
    
    const topValues = core_values?.slice(0, 3).join(', ') || 'core values'
    const highInteraction = (work_preferences?.interaction || 0) > 70 ? ' with strong collaborative instincts' : ''
    const analytical = (personality_scores?.analytical || 0) >= 4 ? ' They demonstrate exceptional analytical thinking abilities.' : ''
    
    return `${name} is a dedicated ${education_degree} graduate with expertise in ${specialization}. Their core values of ${topValues} guide their professional approach${highInteraction}.${analytical} This unique combination of educational background, personal values, and natural strengths positions them for meaningful career growth in environments that value both technical competence and personal integrity.`
  }
}

export async function calculateFitmentScore(student: Student, job: Job) {
  // Debug log to see if OpenAI is available
  console.log("OpenAI availability:", { 
    openaiAvailable: !!openai, 
    isConfigured: isOpenAIConfigured,
    apiKeyPresent: !!openaiApiKey
  })
  
  if (!openai) {
    console.log("Using fallback scoring for:", job.job_title)
    // Enhanced fallback scoring logic with better matching
    let score = 30 // Base score
    // eslint-disable-next-line prefer-const
    let reasoning = []
    
    // Education match (0-25 points)
    const studentSpec = student.specialization?.toLowerCase() || ''
    const jobTitle = job.job_title.toLowerCase()
    const jobDesc = job.job_description.toLowerCase()
    
    let educationMatch = 0
    if (studentSpec.includes('computer') || studentSpec.includes('software') || studentSpec.includes('information')) {
      if (jobTitle.includes('software') || jobTitle.includes('developer') || jobTitle.includes('engineer')) {
        educationMatch = 25
        reasoning.push("Strong education-role alignment")
      } else if (jobTitle.includes('data') || jobTitle.includes('analyst')) {
        educationMatch = 20
        reasoning.push("Good technical background match")
      } else if (jobTitle.includes('product') || jobTitle.includes('project')) {
        educationMatch = 15
        reasoning.push("Relevant technical knowledge")
      }
    } else if (studentSpec.includes('business') || studentSpec.includes('management')) {
      if (jobTitle.includes('manager') || jobTitle.includes('consultant') || jobTitle.includes('business')) {
        educationMatch = 25
        reasoning.push("Perfect business background match")
      } else if (jobTitle.includes('product') || jobTitle.includes('project')) {
        educationMatch = 20
        reasoning.push("Strong management skills alignment")
      }
    } else if (studentSpec.includes('design') || studentSpec.includes('art')) {
      if (jobTitle.includes('design') || jobTitle.includes('ui') || jobTitle.includes('ux')) {
        educationMatch = 25
        reasoning.push("Excellent design background fit")
      }
    }
    score += educationMatch
    
    // Skills match (0-20 points)
    let skillsMatch = 0
    if (job.key_skills && Array.isArray(job.key_skills)) {
      const matchingSkills = job.key_skills.filter((skill: string) => {
        const skillLower = skill.toLowerCase()
        return studentSpec.includes(skillLower) || 
               jobDesc.includes(skillLower) ||
               (student.core_values && student.core_values.some((value: string) => 
                 skillLower.includes(value.toLowerCase())
               ))
      })
      skillsMatch = Math.min(matchingSkills.length * 4, 20)
      if (matchingSkills.length > 0) {
        reasoning.push(`${matchingSkills.length} relevant skills identified`)
      }
    }
    score += skillsMatch
    
    // Work preferences alignment (0-20 points)
    let workPrefMatch = 0
    if (student.work_preferences) {
      // Check for innovation preference vs job type
      const innovation = student.work_preferences.innovation || 50
      if (jobTitle.includes('developer') || jobTitle.includes('design') || jobTitle.includes('creative')) {
        workPrefMatch += Math.min(innovation / 10, 8)
      }
      
      // Check independence vs collaboration
      const independence = student.work_preferences.independence || 50
      if (jobTitle.includes('lead') || jobTitle.includes('senior')) {
        workPrefMatch += Math.min((100 - independence) / 10, 6)
      }
      
      // Check pace preference
      const pace = student.work_preferences.pace || 50
      if (jobTitle.includes('startup') || jobDesc.includes('fast-paced')) {
        workPrefMatch += Math.min(pace / 10, 6)
      }
      
      if (workPrefMatch > 0) {
        reasoning.push("Work style preferences align well")
      }
    }
    score += workPrefMatch
    
    // Core values alignment (0-15 points)
    let valuesMatch = 0
    if (student.core_values && student.core_values.length > 0) {
      const jobContext = (job.job_description + ' ' + job.company_name).toLowerCase()
      const matchingValues = student.core_values.filter((value: string) => {
        const valueLower = value.toLowerCase()
        return jobContext.includes(valueLower) || 
               (valueLower === 'innovation' && (jobContext.includes('innovative') || jobContext.includes('creative'))) ||
               (valueLower === 'growth' && (jobContext.includes('development') || jobContext.includes('learning'))) ||
               (valueLower === 'impact' && (jobContext.includes('mission') || jobContext.includes('social')))
      })
      valuesMatch = Math.min(matchingValues.length * 5, 15)
      if (matchingValues.length > 0) {
        reasoning.push(`Core values like ${matchingValues.slice(0, 2).join(' and ')} align with role`)
      }
    }
    score += valuesMatch
    
    // Company type bonus (0-10 points)
    let companyMatch = 0
    const companyName = job.company_name.toLowerCase()
    if (companyName.includes('tech') || companyName.includes('software') || companyName.includes('digital')) {
      if (studentSpec.includes('computer') || studentSpec.includes('software')) {
        companyMatch = 10
        reasoning.push("Tech company matches your background")
      }
    }
    score += companyMatch
    
    // Ensure score is within bounds
    score = Math.max(35, Math.min(95, score))
    
    const finalReasoning = reasoning.length > 0 
      ? reasoning.join('. ') + '.'
      : "Basic compatibility assessment based on profile analysis."
    
    return {
      score,
      reasoning: finalReasoning
    }
  }

  console.log("Using OpenAI for fitment calculation:", job.job_title)
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a career matching AI. Calculate a fitment score (0-100) between a student and a job based on their profile match. Also provide a brief explanation. Respond only with valid JSON.",
        },
        {
          role: "user",
          content: `Calculate fitment score between:
          
          STUDENT:
          Core Values: ${student.core_values?.join(", ") || "Not specified"}
          Work Preferences: ${JSON.stringify(student.work_preferences || {})}
          Education: ${student.education_degree} in ${student.specialization}
          Personality Scores: ${JSON.stringify(student.personality_scores || {})}
          
          JOB:
          Title: ${job.job_title}
          Company: ${job.company_name}
          Description: ${job.job_description}
          Key Skills: ${job.key_skills?.join(", ") || "Not specified"}
          Job Type: ${job.job_type}
          
          Respond with JSON format: {"score": number, "reasoning": "brief explanation"}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 150,
    })

    const response = completion.choices[0]?.message?.content || '{"score": 50, "reasoning": "Unable to calculate precise match"}'
    
    console.log("OpenAI response:", response)
    
    try {
      const parsed = JSON.parse(response)
      console.log("Parsed OpenAI response:", parsed)
      
      // Ensure score is an integer
      if (parsed.score) {
        parsed.score = Math.round(Number(parsed.score))
      }
      
      return parsed
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError, "Response:", response)
      return { score: 50, reasoning: "Unable to parse AI response" }
    }
  } catch (error) {
    console.error("OpenAI API error:", error)
    return { score: 50, reasoning: "Error calculating match score" }
  }
}

export async function generateCareerRecommendations(student: Student) {
  if (!openai) {
    return generateFallbackRecommendations(student)
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert career counselor AI with deep knowledge of job markets and personality-career fit. 
          
          Analyze the student's complete assessment profile and provide highly personalized career recommendations. 
          
          Consider:
          - Educational background and specialization relevance
          - Core values alignment with career paths
          - Work preference scores (0-100 scale) indicating preferred work style
          - Personality traits (1-5 scale) and their career implications
          - Current job market demand and growth potential
          
          Provide detailed explanations showing HOW each specific assessment choice leads to the recommendation.
          
          Respond only with valid JSON array format.`,
        },
        {
          role: "user",
          content: `Analyze this complete student assessment profile and recommend 4-6 highly personalized career roles:

STUDENT PROFILE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Name: ${student.name}
🎓 Education: ${student.education_degree} in ${student.specialization}

💎 Core Values Selected (Top 5 priorities):
${student.core_values?.map((value: string, i: number) => `   ${i + 1}. ${value}`).join('\n')}

⚖️ Work Preferences (Scale 0-100):
${Object.entries(student.work_preferences || {}).map(([key, value]) => {
  const label = {
    independence: 'Independent Work ↔ Team Collaboration',
    structure: 'Structured Environment ↔ Flexible Environment', 
    pace: 'Steady Pace ↔ Fast-Paced Work',
    innovation: 'Proven Methods ↔ Innovative Approaches',
    interaction: 'Minimal Interaction ↔ High Social Interaction'
  }[key] || key;
  return `   • ${label}: ${value}/100`;
}).join('\n')}

🧠 Personality Assessment (Scale 1-5):
${Object.entries(student.personality_scores || {}).map(([key, value]) => {
  const description = {
    openness: 'Openness to Experience (creativity, curiosity)',
    conscientiousness: 'Conscientiousness (organization, discipline)',
    extraversion: 'Extraversion (social energy, assertiveness)',
    agreeableness: 'Agreeableness (cooperation, trust)',
    neuroticism: 'Emotional Stability (stress management)',
    analytical: 'Analytical Thinking (logic, problem-solving)',
    creative: 'Creative Thinking (innovation, imagination)'
  }[key] || key;
  return `   • ${description}: ${value}/5`;
}).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REQUIREMENTS:
1. Recommend 4-6 career roles with match scores 75-95%
2. For each recommendation, provide detailed explanation showing:
   - How their education/specialization fits the role
   - Which specific core values align with this career
   - How their work preferences match the typical work environment
   - Which personality traits make them suitable
   - Current market demand and realistic job openings estimate

JSON Response Format:
[{
  "role": "Specific Job Title",
  "match": 85,
  "explanation": "Detailed explanation referencing their specific choices from the assessment - education, values, work preferences, and personality scores",
  "openings": 1200
}]

Make each explanation 2-3 sentences that specifically reference their assessment choices.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const response = completion.choices[0]?.message?.content || "[]"
    
    try {
      const parsed = JSON.parse(response)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      } else {
        return generateFallbackRecommendations(student)
      }
    } catch {
      return generateFallbackRecommendations(student)
    }
  } catch (error) {
    console.error("OpenAI API error:", error)
    return generateFallbackRecommendations(student)
  }
}

// General AI response function for various text processing tasks
export async function generateAIResponse(prompt: string): Promise<string> {
  if (!openai) {
    throw new Error("OpenAI is not configured. Please check your API key.")
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error("No response generated from AI")
    }

    return response.trim()
  } catch (error) {
    console.error("AI response generation error:", error)
    throw new Error("Failed to generate AI response")
  }
}

// Export the configuration status and openai client for UI components
export { isOpenAIConfigured, openai }

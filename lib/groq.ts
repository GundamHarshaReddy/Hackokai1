import Groq from "groq-sdk"

// Check if Groq API key is available (server-side only)
const getGroqApiKey = () => {
  // Only access environment variables on server side
  if (typeof window === 'undefined') {
    return process.env.GROQ_API_KEY
  }
  return null
}

const groqApiKey = getGroqApiKey()
const isGroqConfigured = !!groqApiKey

const groq = isGroqConfigured
  ? new Groq({
      apiKey: groqApiKey,
    })
  : null

// Fallback career recommendations when Groq is not configured
const generateFallbackRecommendations = (student: any) => {
  const { education_degree, specialization, core_values, work_preferences, personality_scores } = student

  // Enhanced matching logic based on complete assessment data
  const recommendations = []

  // Helper function to create detailed explanations
  const createExplanation = (role: string, educationFit: string, valuesFit: string[], workStyleFit: string, personalityFit: string) => {
    const selectedValues = core_values.filter((value: string) => valuesFit.includes(value))
    const valuesText = selectedValues.length > 0 ? selectedValues.join(' and ') : 'your core values'
    
    return `Your ${education_degree} in ${specialization} ${educationFit}. Your emphasis on ${valuesText} aligns perfectly with this role. ${workStyleFit} ${personalityFit}`
  }

  // Tech-related recommendations
  if (specialization.toLowerCase().includes('computer') || 
      specialization.toLowerCase().includes('software') ||
      specialization.toLowerCase().includes('information')) {
    
    recommendations.push({
      role: "Software Developer",
      match: 85,
      explanation: createExplanation(
        "Software Developer",
        "provides the technical foundation essential for software development",
        ["Innovation", "Excellence", "Growth"],
        `With your work preferences showing ${work_preferences.innovation}/100 for innovation and ${work_preferences.independence}/100 for independent work, you'll thrive in development environments.`,
        `Your analytical thinking score of ${personality_scores.analytical || 4}/5 indicates strong problem-solving abilities crucial for coding.`
      ),
      openings: 4500
    })

    if (work_preferences.interaction > 60) {
      recommendations.push({
        role: "Full Stack Developer", 
        match: 82,
        explanation: createExplanation(
          "Full Stack Developer",
          "covers both frontend and backend technologies perfectly suited to your technical background",
          ["Innovation", "Excellence", "Collaboration"],
          `Your interaction preference of ${work_preferences.interaction}/100 shows you enjoy collaborative work, ideal for full-stack teams.`,
          `Combined with conscientiousness score of ${personality_scores.conscientiousness || 4}/5, you'll excel at managing complex projects.`
        ),
        openings: 3200
      })
    }
  }

  // Data Science related
  if (specialization.toLowerCase().includes('data') ||
      education_degree.includes('M.Tech') ||
      core_values.includes('Innovation') ||
      personality_scores.analytical >= 4) {
    
    recommendations.push({
      role: "Data Analyst",
      match: 84,
      explanation: createExplanation(
        "Data Analyst",
        "provides strong analytical foundation essential for data interpretation",
        ["Innovation", "Excellence", "Growth"],
        `Your structured work preference (${work_preferences.structure}/100) aligns with data analysis methodologies.`,
        `High analytical thinking (${personality_scores.analytical || 4}/5) and conscientiousness (${personality_scores.conscientiousness || 4}/5) are perfect for data-driven roles.`
      ),
      openings: 2800
    })
  }

  // Business/Management related
  if (education_degree.includes('MBA') || 
      education_degree.includes('B.Com') ||
      specialization.toLowerCase().includes('marketing') ||
      (work_preferences.interaction > 70 && personality_scores.extraversion >= 4)) {
    
    recommendations.push({
      role: "Digital Marketing Specialist",
      match: 79,
      explanation: createExplanation(
        "Digital Marketing Specialist",
        "provides business acumen essential for marketing strategy",
        ["Creativity", "Impact", "Growth"],
        `Your high interaction preference (${work_preferences.interaction}/100) and pace preference (${work_preferences.pace}/100) suit the dynamic marketing environment.`,
        `Extraversion score of ${personality_scores.extraversion || 4}/5 indicates natural communication skills vital for marketing.`
      ),
      openings: 2500
    })

    if (core_values.includes('Leadership') || personality_scores.conscientiousness >= 4) {
      recommendations.push({
        role: "Product Manager",
        match: 81,
        explanation: createExplanation(
          "Product Manager",
          "provides strategic thinking foundation essential for product leadership",
          ["Leadership", "Innovation", "Impact"],
          `Your balanced work preferences (innovation: ${work_preferences.innovation}/100, structure: ${work_preferences.structure}/100) are ideal for product management.`,
          `High conscientiousness (${personality_scores.conscientiousness || 4}/5) and leadership values show strong management potential.`
        ),
        openings: 1800
      })
    }
  }

  // Design related
  if (specialization.toLowerCase().includes('design') ||
      core_values.includes('Creativity') ||
      personality_scores.creative >= 4 ||
      personality_scores.openness >= 4) {
    
    recommendations.push({
      role: "UI/UX Designer",
      match: 87,
      explanation: createExplanation(
        "UI/UX Designer",
        "aligns perfectly with design thinking and user experience principles",
        ["Creativity", "Innovation", "Excellence"],
        `Your innovation preference (${work_preferences.innovation}/100) and flexibility preference show ideal design mindset.`,
        `High openness (${personality_scores.openness || 4}/5) and creative thinking (${personality_scores.creative || 4}/5) are essential for design innovation.`
      ),
      openings: 2200
    })
  }

  // Engineering related
  if (education_degree.includes('B.Tech') || 
      education_degree.includes('B.E') ||
      (personality_scores.analytical >= 4 && work_preferences.structure > 60)) {
    
    recommendations.push({
      role: "DevOps Engineer",
      match: 78,
      explanation: createExplanation(
        "DevOps Engineer",
        "provides technical expertise essential for infrastructure management",
        ["Excellence", "Innovation", "Growth"],
        `Your structure preference (${work_preferences.structure}/100) and independent work style (${work_preferences.independence}/100) suit DevOps environments.`,
        `Strong analytical skills (${personality_scores.analytical || 4}/5) are crucial for system optimization and troubleshooting.`
      ),
      openings: 1500
    })
  }

  // Consulting/Advisory roles for high interaction + business background
  if (work_preferences.interaction > 80 && personality_scores.extraversion >= 4) {
    recommendations.push({
      role: "Business Consultant",
      match: 76,
      explanation: createExplanation(
        "Business Consultant",
        "provides analytical and communication foundation essential for advising clients",
        ["Impact", "Excellence", "Growth"],
        `Your very high interaction preference (${work_preferences.interaction}/100) and pace preference (${work_preferences.pace}/100) are ideal for consulting.`,
        `Strong extraversion (${personality_scores.extraversion}/5) and agreeableness (${personality_scores.agreeableness || 4}/5) enable effective client relationships.`
      ),
      openings: 1200
    })
  }

  // Ensure we have at least 4 recommendations
  while (recommendations.length < 4) {
    recommendations.push({
      role: "Project Coordinator",
      match: 72,
      explanation: createExplanation(
        "Project Coordinator",
        "provides organizational skills essential for project management",
        ["Collaboration", "Excellence", "Growth"],
        `Your balanced work preferences show adaptability crucial for coordinating diverse teams and tasks.`,
        `High conscientiousness (${personality_scores.conscientiousness || 4}/5) ensures excellent project execution and attention to detail.`
      ),
      openings: 1800
    })
    break
  }

  return recommendations.slice(0, 6) // Return max 6 recommendations
}

export async function generateStudentSummary(student: any) {
  if (!groq) {
    // Enhanced fallback summary generation
    const { name, education_degree, specialization, core_values, work_preferences, personality_scores } = student
    
    // Analyze work preferences
    const highPrefs = Object.entries(work_preferences)
      .filter(([_, value]) => (value as number) > 70)
      .map(([key, _]) => {
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
    const strengths = Object.entries(personality_scores)
      .filter(([_, value]) => (value as number) >= 4)
      .map(([key, _]) => {
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
    
    return `${name} is a motivated ${education_degree} graduate specializing in ${specialization}, with core values centered on ${core_values.slice(0, 3).join(', ')}.${workStyle}${personalityText} This combination of educational foundation, value-driven approach, and natural abilities positions them well for impactful roles in their chosen field.`
  }

  try {
    const completion = await groq.chat.completions.create({
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
${student.core_values.map((value: string, i: number) => `${i + 1}. ${value}`).join('\n')}

⚖️ Work Preferences (0-100 scale):
${Object.entries(student.work_preferences).map(([key, value]) => {
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
${Object.entries(student.personality_scores).map(([key, value]) => `• ${key}: ${value}/5`).join('\n')}

Create a 120-150 word professional summary that:
1. References specific values they selected
2. Mentions their work preference scores and what they indicate
3. Highlights their strongest personality traits
4. Connects their education to career potential
5. Shows how all these elements create their unique professional profile

Write in third person, professional tone.`,
        },
      ],
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 250,
    })

    return completion.choices[0]?.message?.content || "Unable to generate summary"
  } catch (error) {
    console.error("Groq API error:", error)
    // Return enhanced fallback summary on error
    const { name, education_degree, specialization, core_values, work_preferences, personality_scores } = student
    
    const topValues = core_values.slice(0, 3).join(', ')
    const highInteraction = work_preferences.interaction > 70 ? ' with strong collaborative instincts' : ''
    const analytical = personality_scores.analytical >= 4 ? ' They demonstrate exceptional analytical thinking abilities.' : ''
    
    return `${name} is a dedicated ${education_degree} graduate with expertise in ${specialization}. Their core values of ${topValues} guide their professional approach${highInteraction}.${analytical} This unique combination of educational background, personal values, and natural strengths positions them for meaningful career growth in environments that value both technical competence and personal integrity.`
  }
}

export async function calculateFitmentScore(student: any, job: any) {
  if (!groq) {
    // Basic fallback scoring logic
    let score = 50 // Base score
    
    // Education match
    if (student.specialization.toLowerCase().includes('computer') && 
        job.job_title.toLowerCase().includes('software')) {
      score += 20
    }
    
    // Skills match (basic)
    if (job.key_skills && Array.isArray(job.key_skills)) {
      const relevantSkills = job.key_skills.filter((skill: string) => 
        student.specialization.toLowerCase().includes(skill.toLowerCase()) ||
        (student.core_values && student.core_values.some((value: string) => 
          skill.toLowerCase().includes(value.toLowerCase())
        ))
      )
      score += Math.min(relevantSkills.length * 5, 25)
    }
    
    // Ensure score is within bounds
    score = Math.max(30, Math.min(95, score))
    
    return {
      score,
      reasoning: "Match calculated based on education background and role requirements"
    }
  }

  try {
    const completion = await groq.chat.completions.create({
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
          Core Values: ${student.core_values.join(", ")}
          Work Preferences: ${JSON.stringify(student.work_preferences)}
          Education: ${student.education_degree} in ${student.specialization}
          
          JOB:
          Title: ${job.job_title}
          Company: ${job.company_name}
          Description: ${job.job_description}
          Key Skills: ${job.key_skills?.join(", ") || "Not specified"}
          
          Respond with JSON format: {"score": number, "reasoning": "brief explanation"}`,
        },
      ],
      model: "llama3-8b-8192",
      temperature: 0.3,
      max_tokens: 150,
    })

    const response = completion.choices[0]?.message?.content || '{"score": 50, "reasoning": "Unable to calculate precise match"}'
    
    try {
      return JSON.parse(response)
    } catch {
      return { score: 50, reasoning: "Unable to parse AI response" }
    }
  } catch (error) {
    console.error("Groq API error:", error)
    return { score: 50, reasoning: "Error calculating match score" }
  }
}

export async function generateCareerRecommendations(student: any) {
  if (!groq) {
    console.log("Groq not configured, using fallback recommendations")
    return generateFallbackRecommendations(student)
  }

  try {
    // Create detailed student profile for AI analysis
    const workPrefsText = Object.entries(student.work_preferences)
      .map(([key, value]) => `${key}: ${value}/100`)
      .join(", ")
    
    const personalityText = Object.entries(student.personality_scores)
      .map(([key, value]) => `${key}: ${value}/5`)
      .join(", ")

    const completion = await groq.chat.completions.create({
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
${student.core_values.map((value: string, i: number) => `   ${i + 1}. ${value}`).join('\n')}

⚖️ Work Preferences (Scale 0-100):
${Object.entries(student.work_preferences).map(([key, value]) => {
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
${Object.entries(student.personality_scores).map(([key, value]) => {
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
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 800,
    })

    const response = completion.choices[0]?.message?.content || "[]"
    
    try {
      const parsed = JSON.parse(response)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      } else {
        console.log("Invalid AI response format, using fallback")
        return generateFallbackRecommendations(student)
      }
    } catch {
      console.log("Failed to parse AI response, using fallback")
      return generateFallbackRecommendations(student)
    }
  } catch (error) {
    console.error("Groq API error:", error)
    console.log("API error occurred, using fallback recommendations")
    return generateFallbackRecommendations(student)
  }
}

// Export the configuration status for UI components
export { isGroqConfigured }

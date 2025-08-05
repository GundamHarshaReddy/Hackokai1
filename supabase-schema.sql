-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Students table
CREATE TABLE students (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(10) UNIQUE NOT NULL CHECK (LENGTH(phone) = 10 AND phone ~ '^[6-9][0-9]{9}$'),
    education_degree VARCHAR(100) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    core_values JSONB NOT NULL DEFAULT '[]',
    work_preferences JSONB NOT NULL DEFAULT '{}',
    personality_scores JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Career recommendations table
CREATE TABLE career_recommendations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    role VARCHAR(255) NOT NULL,
    match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
    explanation TEXT NOT NULL,
    job_openings INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs table
CREATE TABLE jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    job_description TEXT NOT NULL,
    location VARCHAR(255),
    job_type VARCHAR(100) NOT NULL,
    key_skills JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job applications table
CREATE TABLE job_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    phone VARCHAR(10) NOT NULL CHECK (LENGTH(phone) = 10 AND phone ~ '^[6-9][0-9]{9}$'),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, job_id)
);

-- Career interests table
CREATE TABLE career_interests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    career_role VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, career_role)
);

-- Job interests table
CREATE TABLE job_interests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, job_id)
);

-- Indexes for better performance
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_phone ON students(phone);
CREATE INDEX idx_career_recommendations_student_id ON career_recommendations(student_id);
CREATE INDEX idx_career_recommendations_match_score ON career_recommendations(match_score DESC);
CREATE INDEX idx_jobs_title ON jobs(job_title);
CREATE INDEX idx_jobs_company ON jobs(company_name);
CREATE INDEX idx_job_applications_student_id ON job_applications(student_id);
CREATE INDEX idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);

-- Row Level Security (RLS) Policies
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for the assessment flow
CREATE POLICY "Allow anonymous read/write on students" ON students
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous read/write on career_recommendations" ON career_recommendations
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous read on jobs" ON jobs
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert on jobs" ON jobs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous read/write on job_applications" ON job_applications
    FOR ALL USING (true) WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at for students
CREATE TRIGGER update_students_updated_at 
    BEFORE UPDATE ON students 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at for jobs
CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert comprehensive job data covering all major career paths
INSERT INTO jobs (company_name, job_title, job_description, location, job_type, key_skills) VALUES

-- Technology & Software Development
('TechCorp Inc.', 'Software Developer', 'Develop and maintain web applications using modern technologies. Work with a collaborative team to deliver high-quality software solutions.', 'Bangalore, India', 'Full-time', '["JavaScript", "React", "Node.js", "Python", "SQL"]'),
('InnovateTech', 'Full Stack Developer', 'Build end-to-end web applications using modern frameworks. Handle both frontend and backend development tasks.', 'Chennai, India', 'Full-time', '["React", "Node.js", "MongoDB", "Express", "TypeScript"]'),
('FrontEnd Solutions', 'Front-End Developer', 'Create responsive and interactive user interfaces using modern front-end technologies and frameworks.', 'Mumbai, India', 'Full-time', '["HTML", "CSS", "JavaScript", "React", "Vue.js"]'),
('BackEnd Systems', 'Back-End Developer', 'Design and implement server-side logic, databases, and APIs for web applications.', 'Hyderabad, India', 'Full-time', '["Python", "Java", "Node.js", "PostgreSQL", "REST APIs"]'),
('WebCraft Studios', 'Web Developer', 'Build and maintain websites and web applications with focus on performance and user experience.', 'Pune, India', 'Full-time', '["HTML", "CSS", "JavaScript", "PHP", "WordPress"]'),
('MobileTech', 'Mobile App Developer', 'Develop native and cross-platform mobile applications for iOS and Android platforms.', 'Bangalore, India', 'Full-time', '["React Native", "Flutter", "Swift", "Kotlin", "JavaScript"]'),
('GameForge Studio', 'Game Developer', 'Create engaging games using modern game engines and programming languages.', 'Mumbai, India', 'Full-time', '["Unity", "C#", "C++", "3D Modeling", "Game Design"]'),
('DesktopPro', 'Desktop Application Developer', 'Build desktop applications for Windows, Mac, and Linux platforms.', 'Delhi, India', 'Full-time', '["C#", "Java", "Python", "Electron", "Qt"]'),

-- AI & Machine Learning
('AI Innovations', 'Machine Learning Engineer', 'Develop and deploy machine learning models. Work with large datasets to solve complex business problems.', 'Bangalore, India', 'Full-time', '["Python", "TensorFlow", "PyTorch", "Machine Learning", "Data Science"]'),
('DeepTech Labs', 'AI Engineer', 'Design and implement AI solutions to solve real-world problems across various domains.', 'Hyderabad, India', 'Full-time', '["Python", "Machine Learning", "Deep Learning", "TensorFlow", "AI Algorithms"]'),
('Research Institute', 'AI Research Scientist', 'Conduct advanced research in artificial intelligence and publish findings in top-tier conferences.', 'Chennai, India', 'Full-time', '["Research", "Python", "Deep Learning", "Computer Vision", "NLP"]'),
('Enterprise AI', 'AI Solutions Architect', 'Design scalable AI architectures and lead implementation of enterprise AI solutions.', 'Mumbai, India', 'Full-time', '["AI Architecture", "Cloud Platforms", "Python", "MLOps", "System Design"]'),
('Vision Systems', 'Computer Vision Engineer', 'Develop computer vision systems for image and video analysis applications.', 'Pune, India', 'Full-time', '["OpenCV", "Python", "Deep Learning", "Image Processing", "Computer Vision"]'),
('DeepMind Corp', 'Deep Learning Engineer', 'Build and optimize deep neural networks for various AI applications.', 'Bangalore, India', 'Full-time', '["PyTorch", "TensorFlow", "Deep Learning", "Neural Networks", "Python"]'),
('NLP Solutions', 'NLP Engineer', 'Develop natural language processing systems for text analysis and understanding.', 'Hyderabad, India', 'Full-time', '["NLP", "Python", "Transformers", "BERT", "Language Models"]'),
('ChatBot Inc.', 'Conversational AI Designer', 'Design and build intelligent chatbots and conversational interfaces.', 'Mumbai, India', 'Full-time', '["NLP", "Chatbot Development", "Python", "Dialog Flow", "AI Frameworks"]'),

-- Data Science & Analytics
('DataFlow Solutions', 'Data Analyst', 'Analyze complex datasets to derive business insights. Create reports and dashboards to support decision-making processes.', 'Hyderabad, India', 'Full-time', '["Python", "SQL", "Tableau", "Excel", "Statistics"]'),
('BigData Corp', 'Data Scientist', 'Extract insights from large datasets using statistical analysis and machine learning techniques.', 'Bangalore, India', 'Full-time', '["Python", "R", "Machine Learning", "Statistics", "Data Visualization"]'),
('DataPipe Solutions', 'Data Engineer', 'Build and maintain data pipelines and infrastructure for large-scale data processing.', 'Chennai, India', 'Full-time', '["Python", "Apache Spark", "Kafka", "SQL", "ETL"]'),
('BigData Systems', 'Big Data Engineer', 'Design and implement big data solutions using distributed computing frameworks.', 'Pune, India', 'Full-time', '["Hadoop", "Spark", "Kafka", "Python", "Scala"]'),
('Warehouse Pro', 'Data Warehouse Developer', 'Design and develop data warehouse solutions for enterprise analytics.', 'Mumbai, India', 'Full-time', '["SQL", "ETL", "Data Modeling", "Snowflake", "Redshift"]'),
('QuantTech', 'Quantitative Analyst', 'Apply mathematical and statistical methods to analyze financial markets and risk.', 'Mumbai, India', 'Full-time', '["Python", "R", "Statistics", "Financial Modeling", "Quantitative Analysis"]'),

-- Cloud & DevOps
('CloudFirst', 'Cloud Solutions Architect', 'Design and implement cloud infrastructure solutions for enterprise applications.', 'Bangalore, India', 'Full-time', '["AWS", "Azure", "Cloud Architecture", "Kubernetes", "DevOps"]'),
('CloudOps Inc.', 'Cloud Developer', 'Develop and deploy applications on cloud platforms with focus on scalability and performance.', 'Hyderabad, India', 'Full-time', '["AWS", "Azure", "Docker", "Kubernetes", "Python"]'),
('SecureCloud', 'Cloud Security Engineer', 'Implement security measures and best practices for cloud infrastructure and applications.', 'Chennai, India', 'Full-time', '["Cloud Security", "AWS", "Azure", "Security Frameworks", "Compliance"]'),
('CloudAdmin Pro', 'Cloud Administrator', 'Manage and maintain cloud infrastructure, ensuring optimal performance and security.', 'Pune, India', 'Full-time', '["AWS", "Azure", "Linux", "Monitoring", "Automation"]'),
('DevOps Solutions', 'DevOps Engineer', 'Implement CI/CD pipelines and automate deployment processes for software applications.', 'Mumbai, India', 'Full-time', '["Docker", "Kubernetes", "Jenkins", "AWS", "Linux"]'),
('Reliability Systems', 'Site Reliability Engineer', 'Ensure high availability and performance of production systems through automation and monitoring.', 'Bangalore, India', 'Full-time', '["SRE", "Kubernetes", "Monitoring", "Python", "Linux"]'),

-- Cybersecurity
('SecureNet', 'Cybersecurity Analyst', 'Monitor and analyze security threats, implement security measures to protect organizational assets.', 'Delhi, India', 'Full-time', '["Security Analysis", "SIEM", "Incident Response", "Network Security", "Risk Assessment"]'),
('CyberGuard', 'Cybersecurity Consultant', 'Provide expert cybersecurity advice and solutions to organizations across various industries.', 'Mumbai, India', 'Full-time', '["Security Consulting", "Risk Assessment", "Compliance", "Security Frameworks", "Penetration Testing"]'),
('PenTest Pro', 'Penetration Tester', 'Conduct security assessments and penetration tests to identify vulnerabilities in systems.', 'Bangalore, India', 'Full-time', '["Penetration Testing", "Ethical Hacking", "Security Tools", "Vulnerability Assessment", "Network Security"]'),
('EthicalHack Inc.', 'Ethical Hacker', 'Identify security vulnerabilities through authorized hacking techniques and provide remediation advice.', 'Hyderabad, India', 'Full-time', '["Ethical Hacking", "Penetration Testing", "Security Tools", "Vulnerability Assessment", "Network Security"]'),
('SecArch Solutions', 'Security Architect', 'Design comprehensive security architectures and frameworks for enterprise systems.', 'Chennai, India', 'Full-time', '["Security Architecture", "Security Design", "Risk Management", "Compliance", "Security Frameworks"]'),
('SecEng Corp', 'Security Engineer', 'Implement and maintain security systems, tools, and processes to protect organizational infrastructure.', 'Pune, India', 'Full-time', '["Security Engineering", "Network Security", "Security Tools", "Incident Response", "Compliance"]'),
('ResponseTeam', 'Incident Responder', 'Lead incident response activities and coordinate efforts to contain and resolve security incidents.', 'Mumbai, India', 'Full-time', '["Incident Response", "Digital Forensics", "Security Analysis", "Crisis Management", "Security Tools"]'),
('VulnScan Inc.', 'Vulnerability Analyst', 'Identify, assess, and prioritize security vulnerabilities in systems and applications.', 'Bangalore, India', 'Full-time', '["Vulnerability Assessment", "Security Scanning", "Risk Analysis", "Security Tools", "Compliance"]'),

-- Database & Systems
('DataBase Pro', 'Database Administrator', 'Manage and maintain database systems, ensure data integrity, performance, and security.', 'Hyderabad, India', 'Full-time', '["SQL", "Database Management", "Performance Tuning", "Backup Recovery", "Security"]'),
('DataEngine Corp', 'Database Engineer', 'Design and implement database solutions for high-performance applications.', 'Chennai, India', 'Full-time', '["SQL", "Database Design", "Performance Optimization", "NoSQL", "Cloud Databases"]'),
('SQLDev Solutions', 'SQL Developer', 'Develop and optimize SQL queries, stored procedures, and database applications.', 'Pune, India', 'Full-time', '["SQL", "Database Development", "Query Optimization", "Stored Procedures", "Database Design"]'),
('SysAdmin Inc.', 'System Administrator', 'Manage and maintain computer systems, servers, and network infrastructure.', 'Mumbai, India', 'Full-time', '["Linux", "Windows Server", "Network Administration", "System Monitoring", "Automation"]'),
('NetAdmin Pro', 'Network Administrator', 'Configure and maintain network infrastructure, ensure network security and performance.', 'Bangalore, India', 'Full-time', '["Network Configuration", "Cisco", "Network Security", "Troubleshooting", "Network Monitoring"]'),
('NetworkEng Corp', 'Network Engineer', 'Design and implement network solutions for enterprise environments.', 'Delhi, India', 'Full-time', '["Network Design", "Routing", "Switching", "Network Protocols", "Network Security"]'),
('SysAnalyst Inc.', 'Systems Analyst', 'Analyze business requirements and design technical solutions to meet organizational needs.', 'Hyderabad, India', 'Full-time', '["System Analysis", "Requirements Gathering", "Technical Documentation", "Process Improvement", "Project Management"]'),

-- Quality Assurance & Testing
('QualityFirst', 'QA Engineer', 'Design and execute test plans to ensure software quality and reliability.', 'Bangalore, India', 'Full-time', '["Test Planning", "Test Execution", "Bug Tracking", "Quality Assurance", "Testing Tools"]'),
('TestPro Solutions', 'QA Analyst', 'Analyze software requirements and develop comprehensive testing strategies.', 'Chennai, India', 'Full-time', '["Test Analysis", "Test Planning", "Manual Testing", "Quality Assurance", "Test Documentation"]'),
('AutoTest Inc.', 'Test Automation Engineer', 'Develop and maintain automated testing frameworks and scripts.', 'Hyderabad, India', 'Full-time', '["Test Automation", "Selenium", "Python", "Java", "CI/CD"]'),
('SoftTest Corp', 'Software Tester', 'Execute manual and automated tests to identify defects and ensure software quality.', 'Pune, India', 'Full-time', '["Manual Testing", "Test Execution", "Bug Reporting", "Test Cases", "Quality Assurance"]'),
('AutoQA Solutions', 'Automation Tester', 'Create and maintain automated test suites for web and mobile applications.', 'Mumbai, India', 'Full-time', '["Test Automation", "Selenium", "Appium", "Java", "Python"]'),
('PerfTest Inc.', 'Performance Tester', 'Conduct performance testing to ensure applications meet performance requirements.', 'Bangalore, India', 'Full-time', '["Performance Testing", "Load Testing", "JMeter", "Performance Analysis", "Optimization"]'),

-- UI/UX Design
('Creative Studios', 'UI/UX Designer', 'Design intuitive user interfaces and create exceptional user experiences. Collaborate with development teams to implement designs.', 'Mumbai, India', 'Full-time', '["Figma", "Adobe Creative Suite", "Prototyping", "User Research", "Design Systems"]'),
('DesignCraft', 'UX Designer', 'Research user needs and design user-centered experiences for digital products.', 'Bangalore, India', 'Full-time', '["User Research", "Wireframing", "Prototyping", "Usability Testing", "Design Thinking"]'),
('UIStudio Pro', 'UI Developer', 'Implement user interface designs using modern front-end technologies and frameworks.', 'Chennai, India', 'Full-time', '["HTML", "CSS", "JavaScript", "React", "UI Implementation"]'),
('UXResearch Inc.', 'UI/UX Researcher', 'Conduct user research and usability studies to inform design decisions.', 'Hyderabad, India', 'Full-time', '["User Research", "Usability Testing", "Data Analysis", "Survey Design", "Research Methods"]'),
('UXEng Solutions', 'UX Engineer', 'Bridge the gap between design and development by implementing user experience solutions.', 'Pune, India', 'Full-time', '["UX Implementation", "Front-end Development", "Prototyping", "JavaScript", "Design Systems"]'),
('InteractDesign', 'Interaction Designer', 'Design interactive experiences and user flows for digital products and services.', 'Mumbai, India', 'Full-time', '["Interaction Design", "User Flows", "Prototyping", "Animation", "Design Tools"]'),

-- Project Management & Business Analysis
('ProjectPro', 'Project Manager', 'Lead cross-functional teams to deliver projects on time and within budget.', 'Delhi, India', 'Full-time', '["Project Management", "Agile", "Scrum", "Risk Management", "Team Leadership"]'),
('TechPM Inc.', 'Technical Product Manager', 'Manage technical products from conception to launch, working closely with engineering teams.', 'Bangalore, India', 'Full-time', '["Product Management", "Technical Leadership", "Agile", "Product Strategy", "Stakeholder Management"]'),
('ProductVision', 'Product Manager', 'Lead product development initiatives from concept to launch. Collaborate with cross-functional teams to deliver innovative products.', 'Pune, India', 'Full-time', '["Product Strategy", "Agile", "Data Analysis", "User Research", "Roadmap Planning"]'),
('BizAnalyst Corp', 'Business Analyst', 'Analyze business processes and requirements to identify improvement opportunities.', 'Mumbai, India', 'Full-time', '["Business Analysis", "Requirements Gathering", "Process Improvement", "Data Analysis", "Documentation"]'),
('AgileCoach Pro', 'Agile Coach', 'Guide organizations in adopting agile methodologies and practices.', 'Hyderabad, India', 'Full-time', '["Agile Coaching", "Scrum", "Team Facilitation", "Change Management", "Process Improvement"]'),
('ScrumMaster Inc.', 'Scrum Master', 'Facilitate scrum processes and remove impediments for development teams.', 'Chennai, India', 'Full-time', '["Scrum", "Agile", "Team Facilitation", "Process Improvement", "Conflict Resolution"]'),

-- IT Management & Consulting
('ITManage Pro', 'IT Manager', 'Oversee IT operations and strategy, manage technical teams and infrastructure.', 'Bangalore, India', 'Full-time', '["IT Management", "Team Leadership", "Strategic Planning", "Budget Management", "Technology Strategy"]'),
('ITConsult Inc.', 'IT Consultant', 'Provide expert IT advice and solutions to help organizations optimize their technology.', 'Mumbai, India', 'Full-time', '["IT Consulting", "Technology Assessment", "Solution Design", "Project Management", "Client Relations"]'),
('ITStrategy Corp', 'IT Strategy Consultant', 'Develop IT strategies aligned with business objectives and digital transformation goals.', 'Delhi, India', 'Full-time', '["IT Strategy", "Digital Transformation", "Business Alignment", "Technology Planning", "Consulting"]'),
('ITSupport Pro', 'IT Support Specialist', 'Provide technical support and troubleshooting for IT systems and end users.', 'Pune, India', 'Full-time', '["Technical Support", "Troubleshooting", "Help Desk", "Customer Service", "IT Systems"]'),
('ITOps Inc.', 'IT Operations Engineer', 'Manage and maintain IT infrastructure to ensure optimal performance and availability.', 'Hyderabad, India', 'Full-time', '["IT Operations", "Infrastructure Management", "Monitoring", "Automation", "Incident Management"]'),
('ITAccount Corp', 'IT Account Manager', 'Manage relationships with key IT clients and oversee delivery of IT services.', 'Chennai, India', 'Full-time', '["Account Management", "Client Relations", "Service Delivery", "Sales", "Project Coordination"]'),

-- Architecture & Advanced Roles
('EntArch Solutions', 'Enterprise Architect', 'Design enterprise-wide IT architecture and ensure alignment with business strategy.', 'Bangalore, India', 'Full-time', '["Enterprise Architecture", "Solution Design", "Technology Strategy", "System Integration", "Business Alignment"]'),
('SoftArch Inc.', 'Software Architect', 'Design software systems architecture and provide technical leadership for development teams.', 'Mumbai, India', 'Full-time', '["Software Architecture", "System Design", "Technical Leadership", "Design Patterns", "Technology Selection"]'),
('SolutionsArch Pro', 'Solutions Consultant', 'Design and propose technical solutions to meet client requirements and business needs.', 'Hyderabad, India', 'Full-time', '["Solution Design", "Client Consulting", "Technical Presentations", "Requirements Analysis", "Proposal Development"]'),
('PreSales Corp', 'Pre-Sales Consultant', 'Support sales teams by providing technical expertise and solution demonstrations.', 'Chennai, India', 'Full-time', '["Pre-Sales Support", "Technical Presentations", "Solution Design", "Client Engagement", "Product Knowledge"]'),
('TechSales Inc.', 'Technical Sales Engineer', 'Combine technical expertise with sales skills to promote and sell complex technical products.', 'Pune, India', 'Full-time', '["Technical Sales", "Product Demonstrations", "Client Relations", "Solution Selling", "Technical Knowledge"]'),

-- Documentation & Analysis
('TechWrite Pro', 'Technical Writer', 'Create clear and comprehensive technical documentation for software and systems.', 'Mumbai, India', 'Full-time', '["Technical Writing", "Documentation", "Content Creation", "API Documentation", "User Guides"]'),
('DocSpecialist Inc.', 'Documentation Specialist', 'Develop and maintain documentation standards and processes across the organization.', 'Bangalore, India', 'Full-time', '["Documentation Management", "Content Strategy", "Information Architecture", "Process Documentation", "Writing Standards"]'),
('TechAnalyst Corp', 'Technology Analyst', 'Analyze technology trends and provide insights to support business and technical decisions.', 'Delhi, India', 'Full-time', '["Technology Analysis", "Market Research", "Trend Analysis", "Technical Evaluation", "Strategic Planning"]'),
('ITAudit Inc.', 'IT Auditor', 'Conduct audits of IT systems and processes to ensure compliance and identify risks.', 'Hyderabad, India', 'Full-time', '["IT Audit", "Compliance", "Risk Assessment", "Audit Planning", "Regulatory Requirements"]'),
('ITRisk Corp', 'IT Risk Analyst', 'Identify and assess IT-related risks and develop mitigation strategies.', 'Chennai, India', 'Full-time', '["Risk Analysis", "Risk Management", "Compliance", "Security Assessment", "Risk Mitigation"]'),

-- Digital Marketing
('MarketPro Agency', 'Digital Marketing Specialist', 'Develop and execute digital marketing strategies. Manage social media campaigns and analyze marketing metrics.', 'Delhi, India', 'Full-time', '["SEO", "Social Media Marketing", "Google Analytics", "Content Marketing", "PPC"]'),
('DigitalTransform', 'Digital Transformation Lead', 'Lead digital transformation initiatives to modernize business processes and technology.', 'Mumbai, India', 'Full-time', '["Digital Transformation", "Change Management", "Process Optimization", "Technology Implementation", "Strategic Planning"]'),

-- Process & Change Management
('ProcessPro Inc.', 'Process Consultant', 'Analyze and improve business processes to increase efficiency and effectiveness.', 'Bangalore, India', 'Full-time', '["Process Analysis", "Process Improvement", "Change Management", "Business Consulting", "Lean Six Sigma"]'),
('ChangeManage Corp', 'Change Management Specialist', 'Manage organizational change initiatives and help employees adapt to new processes.', 'Hyderabad, India', 'Full-time', '["Change Management", "Organizational Development", "Training", "Communication", "Project Management"]'),

-- Manufacturing & Engineering
('ManufactureTech', 'Process Engineer', 'Design and optimize manufacturing processes to improve efficiency and quality.', 'Chennai, India', 'Full-time', '["Process Engineering", "Manufacturing", "Quality Control", "Process Optimization", "Lean Manufacturing"]'),
('ReliabilityEng Inc.', 'Reliability Engineer', 'Ensure equipment and systems reliability through analysis and preventive maintenance.', 'Pune, India', 'Full-time', '["Reliability Engineering", "Preventive Maintenance", "Root Cause Analysis", "Equipment Optimization", "Quality Assurance"]'),
('ElectronicsDesign', 'Electronics Design Engineer', 'Design and develop electronic circuits and systems for various applications.', 'Bangalore, India', 'Full-time', '["Circuit Design", "PCB Design", "Embedded Systems", "Electronics", "MATLAB"]'),
('EmbeddedSys Corp', 'Embedded Software Engineer', 'Develop software for embedded systems and IoT devices.', 'Hyderabad, India', 'Full-time', '["Embedded C", "Microcontrollers", "Real-time Systems", "IoT", "Hardware Integration"]'),
('CNCTech Inc.', 'CNC Machinist', 'Operate and program CNC machines to manufacture precision parts and components.', 'Chennai, India', 'Full-time', '["CNC Programming", "Machine Operation", "Blueprint Reading", "Quality Control", "Manufacturing"]'),
('AssemblyLine Pro', 'Assembly Line Worker', 'Perform assembly operations in manufacturing environments with focus on quality and efficiency.', 'Pune, India', 'Full-time', '["Assembly Operations", "Quality Control", "Manufacturing Processes", "Safety Procedures", "Team Work"]'),
('MaintenanceTech', 'Maintenance Technician', 'Maintain and repair industrial equipment and machinery to ensure optimal performance.', 'Mumbai, India', 'Full-time', '["Equipment Maintenance", "Troubleshooting", "Repair", "Preventive Maintenance", "Safety Procedures"]'),
('ProductionOps', 'Production Operator', 'Operate production equipment and ensure manufacturing processes run smoothly.', 'Bangalore, India', 'Full-time', '["Production Operations", "Equipment Operation", "Quality Control", "Safety Procedures", "Process Monitoring"]'),
('ProductionPlan Inc.', 'Production Planner', 'Plan and schedule production activities to meet demand and optimize resource utilization.', 'Delhi, India', 'Full-time', '["Production Planning", "Scheduling", "Inventory Management", "Resource Optimization", "Supply Chain"]'),
('ProductionSuper', 'Production Supervisor', 'Supervise production teams and ensure manufacturing targets and quality standards are met.', 'Hyderabad, India', 'Full-time', '["Team Leadership", "Production Management", "Quality Control", "Performance Management", "Safety Management"]'),
('QualityControl Inc.', 'Quality Control Analyst', 'Perform quality control tests and inspections to ensure products meet specifications.', 'Chennai, India', 'Full-time', '["Quality Control", "Testing", "Inspection", "Statistical Analysis", "Quality Standards"]'),
('QualityInspect Pro', 'Quality Inspector', 'Inspect products and materials to ensure they meet quality standards and specifications.', 'Pune, India', 'Full-time', '["Quality Inspection", "Measurement", "Quality Standards", "Documentation", "Problem Solving"]'),
('ElectronicsQA', 'Electronics QA Inspector', 'Perform quality assurance testing on electronic components and systems.', 'Mumbai, India', 'Full-time', '["Electronics Testing", "Quality Assurance", "Test Equipment", "Documentation", "Problem Solving"]'),
('PrototypeTech', 'Prototyping Specialist', 'Create prototypes and proof-of-concept models for new products and designs.', 'Bangalore, India', 'Full-time', '["Prototyping", "3D Printing", "CAD Design", "Product Development", "Testing"]'),

-- Banking & Finance
('BankPro Inc.', 'Bank Teller', 'Provide customer service and handle banking transactions in a retail banking environment.', 'Mumbai, India', 'Full-time', '["Customer Service", "Cash Handling", "Banking Operations", "Financial Products", "Communication"]'),
('CorporateLoan Corp', 'Corporate Loan Analyst', 'Analyze corporate loan applications and assess credit risk for commercial lending.', 'Delhi, India', 'Full-time', '["Credit Analysis", "Financial Analysis", "Risk Assessment", "Loan Processing", "Banking"]'),
('CreditServices Inc.', 'Credit Officer', 'Evaluate credit applications and make lending decisions based on risk assessment.', 'Bangalore, India', 'Full-time', '["Credit Analysis", "Risk Assessment", "Loan Processing", "Financial Analysis", "Customer Relations"]'),
('RelationshipMgmt', 'Relationship Manager', 'Manage client relationships and provide financial advice and services to high-value customers.', 'Mumbai, India', 'Full-time', '["Relationship Management", "Financial Advisory", "Sales", "Customer Service", "Financial Products"]'),

-- Healthcare
('HealthAdminCorp', 'Healthcare Administrator', 'Manage healthcare facilities and coordinate administrative operations in healthcare settings.', 'Chennai, India', 'Full-time', '["Healthcare Administration", "Operations Management", "Regulatory Compliance", "Staff Management", "Healthcare Systems"]'),
('MedicalTech Inc.', 'Medical Technologist', 'Perform laboratory tests and analyses to support medical diagnosis and treatment.', 'Hyderabad, India', 'Full-time', '["Laboratory Testing", "Medical Equipment", "Quality Control", "Healthcare", "Clinical Analysis"]'),
('MedSales Pro', 'Medical Sales Representative', 'Promote and sell medical products and devices to healthcare professionals.', 'Pune, India', 'Full-time', '["Medical Sales", "Product Knowledge", "Client Relations", "Healthcare Industry", "Sales Techniques"]'),
('MedRecords Corp', 'Medical Records Technician', 'Manage and maintain patient medical records and ensure data accuracy and confidentiality.', 'Mumbai, India', 'Full-time', '["Medical Records", "Data Management", "Healthcare Compliance", "Documentation", "Privacy Regulations"]'),
('PatientCare Inc.', 'Patient Care Coordinator', 'Coordinate patient care services and facilitate communication between patients and healthcare providers.', 'Bangalore, India', 'Full-time', '["Patient Care", "Care Coordination", "Healthcare Communication", "Medical Scheduling", "Customer Service"]'),
('PhysicianAssist', 'Physician Assistant', 'Provide medical care under the supervision of physicians in various healthcare settings.', 'Delhi, India', 'Full-time', '["Medical Care", "Patient Assessment", "Treatment Planning", "Healthcare", "Medical Knowledge"]'),
('PhysioTherapy Pro', 'Physiotherapist', 'Provide physical therapy treatments to help patients recover from injuries and improve mobility.', 'Chennai, India', 'Full-time', '["Physical Therapy", "Patient Rehabilitation", "Exercise Therapy", "Healthcare", "Treatment Planning"]'),
('RadiologyTech', 'Radiology Technician', 'Operate imaging equipment and perform radiological procedures for medical diagnosis.', 'Hyderabad, India', 'Full-time', '["Medical Imaging", "Radiology Equipment", "Patient Care", "Safety Procedures", "Healthcare"]'),
('NursingCare Inc.', 'Staff Nurse', 'Provide direct patient care and support in hospitals and healthcare facilities.', 'Pune, India', 'Full-time', '["Patient Care", "Medical Procedures", "Healthcare", "Medication Administration", "Care Planning"]'),
('SpeechTherapy Corp', 'Speech-Language Pathologist', 'Diagnose and treat speech, language, and communication disorders.', 'Mumbai, India', 'Full-time', '["Speech Therapy", "Language Disorders", "Communication", "Patient Assessment", "Treatment Planning"]'),
('HealthSafety Inc.', 'Health & Safety Officer', 'Ensure workplace safety and health compliance in various industrial and office environments.', 'Bangalore, India', 'Full-time', '["Health and Safety", "Compliance", "Risk Assessment", "Safety Training", "Incident Investigation"]'),

-- Pharmaceutical & Research
('ClinicalResearch Inc.', 'Clinical Research Associate', 'Monitor clinical trials and ensure compliance with research protocols and regulations.', 'Chennai, India', 'Full-time', '["Clinical Research", "Protocol Compliance", "Data Collection", "Regulatory Affairs", "Healthcare"]'),
('PharmacoVigilance', 'Pharmacovigilance Specialist', 'Monitor drug safety and adverse reactions to ensure pharmaceutical product safety.', 'Hyderabad, India', 'Full-time', '["Pharmacovigilance", "Drug Safety", "Adverse Event Reporting", "Regulatory Compliance", "Pharmaceutical"]'),
('RegulatoryAffairs', 'Regulatory Affairs Specialist', 'Ensure compliance with regulatory requirements for pharmaceutical and medical device products.', 'Pune, India', 'Full-time', '["Regulatory Affairs", "Compliance", "Pharmaceutical Regulations", "Documentation", "Approval Processes"]'),
('MarketAccess Corp', 'Market Access Specialist', 'Develop strategies to ensure patient access to pharmaceutical products and navigate reimbursement processes.', 'Mumbai, India', 'Full-time', '["Market Access", "Healthcare Economics", "Reimbursement", "Pharmaceutical", "Policy Analysis"]'),
('ResearchInstitute', 'Research Scientist', 'Conduct scientific research and development in various fields including pharmaceuticals and biotechnology.', 'Bangalore, India', 'Full-time', '["Scientific Research", "Data Analysis", "Research Methods", "Laboratory Skills", "Publication"]'),
('ComplianceAudit', 'Compliance Analyst', 'Ensure organizational compliance with regulatory requirements and internal policies.', 'Delhi, India', 'Full-time', '["Compliance", "Regulatory Requirements", "Risk Assessment", "Audit", "Policy Development"]'),
('ComplianceEng Corp', 'Compliance Engineer', 'Implement engineering solutions to ensure compliance with technical and regulatory standards.', 'Chennai, India', 'Full-time', '["Compliance Engineering", "Technical Standards", "Regulatory Requirements", "Engineering", "Quality Assurance"]'),

-- Supply Chain & Operations
('SupplyChain Pro', 'Supply Chain Specialist', 'Manage supply chain operations and optimize logistics processes.', 'Hyderabad, India', 'Full-time', '["Supply Chain Management", "Logistics", "Inventory Management", "Vendor Relations", "Process Optimization"]'),
('LogisticsCoord Inc.', 'Logistics Coordinator', 'Coordinate transportation and distribution activities to ensure efficient delivery of goods.', 'Pune, India', 'Full-time', '["Logistics Coordination", "Transportation", "Supply Chain", "Inventory Management", "Customer Service"]'),
('InventoryMgmt Corp', 'Inventory Control Manager', 'Manage inventory levels and ensure optimal stock availability while minimizing costs.', 'Mumbai, India', 'Full-time', '["Inventory Management", "Stock Control", "Supply Chain", "Cost Optimization", "Data Analysis"]'),
('Procurement Inc.', 'Procurement Specialist', 'Source and purchase goods and services for the organization while ensuring value and quality.', 'Bangalore, India', 'Full-time', '["Procurement", "Vendor Management", "Contract Negotiation", "Cost Analysis", "Supply Chain"]');

// ─────────────────────────────────────────────────────────────
//  All the words on the site live here.
//  Everything below is taken word-for-word from Resume.pdf, except
//  `role` and `tagline` (the hero headline, set by request).
// ─────────────────────────────────────────────────────────────

export const profile = {
  name: 'Keith Yancy Rigodon',
  role: 'Full-Stack Developer',
  location: 'Cebu City, Philippines', // short form used in the hero badge
  address: 'Tres de Abril Labangon, Cebu 6000',
  email: 'keithalmodiel666@gmail.com',
  phone: '+63 948 949 1044',
  resume: 'Keith-Rigodon-Resume.pdf', // file inside /public
  tagline: 'Java · Spring Boot · React · MySQL',
  summary: [
    'Motivated and detail-oriented Information Technology graduate seeking an entry-level position as a Software Developer or Backend Developer. Offering a strong foundation in full-stack development, backend systems, and database management, with hands-on experience in building web applications using Java, Spring Boot, React, Django, and MySQL. Passionate about problem-solving, clean code development, and contributing to efficient and scalable systems.',
  ],
  facts: [
    ['Location', 'Tres de Abril Labangon, Cebu 6000'],
    ['Degree', 'Bachelor of Science in Information Technology'],
    ['School', 'Cebu Institute of Technology – University'],
    ['Years', '2022 – 2026'],
  ],
  strengths: ['Problem Solving & Debugging', 'Team Collaboration', 'Communication Skills', 'Attention to Detail'],
}

// "Key Competencies", in the resume's order (its three columns, top to bottom).
export const skills = [
  {
    group: 'Key Competencies',
    color: 'cyan',
    items: [
      'Object-Oriented Programming',
      'Java & Spring Boot Development',
      'REST API Development',
      'JWT Authentication & OAuth 2.0',
      'Database Design & Management',
      'MySQL, JPA & Hibernate',
      'React Development',
      'CRUD Operations',
      'Google APIs Integration',
      'Gemini AI Integration',
      'Git & GitHub Version Control',
      'Problem Solving & Debugging',
      'Team Collaboration',
      'Communication Skills',
      'Attention to Detail',
    ],
  },
]

export const experience = [
  {
    title: 'Student and Adviser Evaluation System (SAES)',
    org: 'Capstone Project | CIT-U',
    when: '2025–2026',
    points: [
      'Co-developed a full-stack web platform for adviser assessments and student peer evaluations used in academic capstone deployment.',
      'Built Spring Boot 3 REST APIs with JWT authentication, Google OAuth 2.0 login, and role-based access for Teachers, Advisers, and Students.',
      'Developed React dashboards for roster import (Excel/CSV), questionnaire management, evaluation workflows, reports, and performance analytics.',
      'Integrated Google Forms, Google Sheets sync, and Google Gemini AI for automated evaluation insights and teacher reporting.',
      'Designed and implemented MySQL relational schema (JPA/Hibernate); contributed to SRS and SDD system documentation.',
    ],
    tech: ['Java 17', 'Spring Boot 3', 'React 19', 'MySQL', 'JWT', 'Google OAuth/Forms/Sheets', 'Gemini API', 'Git'],
  },
  {
    title: 'Technical Support Intern',
    org: 'Azpired Inc.',
    when: '500-Hour Internship',
    points: [
      'Provided technical support and troubleshooting for software, hardware, and network issues.',
      'Assisted users with system setup, maintenance, and issue resolution.',
      'Documented support cases and collaborated with the team to ensure efficient service delivery.',
    ],
    tech: [],
  },
]

// ─────────────────────────────────────────────────────────────
//  YOUR WORKS GO HERE. While this list is empty the site shows
//  the "opening soon" storefront. The first entry is the one named
//  on the storefront window. Add entries like:
//
//  {
//    title: 'My App',
//    description: 'One or two sentences about what it does.',
//    tech: ['Spring Boot', 'React'],
//    image: 'works/my-app.png',      // file inside /public (optional)
//    link: 'https://...',            // live demo (optional)
//    repo: 'https://github.com/...', // source code (optional)
//  },
// ─────────────────────────────────────────────────────────────
export const projects = [
  {
    title: 'Sakay Sugbo',
    // wording taken from the project's own README
    description:
      'A Cebu jeepney route finder on a 3D map of the city. Tell it where you are and where you are going; it tells you which jeepney code to ride, where to board, and where to change.',
    tech: ['React', 'TypeScript', 'MapLibre GL', 'Java', 'Spring Boot', 'MySQL'],
    image: 'works/sakay-sugbo.webp',
    link: 'https://santopapa20.github.io/sakay-sugbo/',
    repo: 'https://github.com/santopapa20/sakay-sugbo',
  },
]

export const education = {
  school: 'Cebu Institute of Technology – University',
  degree: 'Bachelor of Science in Information Technology',
  when: '2022 – 2026',
}

export const certifications = [
  { name: 'AWS Academy – Cloud Foundations' },
  { name: 'AWS Academy – Cloud Architecting' },
  { name: 'TESDA Artificial Intelligence Training Program Certificate' },
  { name: 'CodeChum Programming Certificates (Java, Python, C/C++)' },
]

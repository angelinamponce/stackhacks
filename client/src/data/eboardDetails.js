// Structured E-Board details, keyed by the Sanity eboard document _id.
//
//   involvement        StackHacks roles, newest first (rendered in this order):
//                        { title, start: 'YYYY-MM', end: 'YYYY-MM' | null (present),
//                          description: string | string[] (bullets), skills: [],
//                          truncated?: true  -> the source text was cut off ("…more"); paste the rest in
//                          project?: title of a Member Projects card to link as a pill
//                          current?: true    -> current role with no dates in the data }
//                      Durations and "Involved since" are computed at render time from the dates.
//   externalExperience previous / outside work, sorted newest-first at render time:
//                        { company, role, type ('Internship' | 'Seasonal' | ''), start 'YYYY-MM' | null,
//                          end 'YYYY-MM' | null (present), location, workMode ('Remote' | 'Hybrid' | 'On-site' | ''),
//                          description (string | bullets[]), skills [], truncated (source text was cut off),
//                          logo   title of a company in the "Our Professional Experience" strip whose logo is
//                                 reused, or null (renders a text chip),
//                          parent (optional) entries sharing a parent render as one grouped company row,
//                          chipLabel (optional) short text for long company names in text chips,
//                          status 'previous' only for undated entries the bio marks "Prev." }
//   education          quiet single line
//   highlights         short tags
//   needsReview/hidden for records not yet confirmed (hidden: true keeps them off the grid)
//   displayTitle       overrides the Sanity title everywhere on the E-Board page
//   pinFirst           shows this member first (and selected) on the E-Board
//
// Text and numbers are verbatim from the provided data / Sanity bios. Nothing is invented.

export const eboardDetails = {
  // Angelina Ponce
  '0ee97634-9122-47f5-a50f-6f64c3eb9242': {
    displayTitle: 'Founder & Senior Advisor',
    pinFirst: true,
    involvement: [
      { title: 'Senior Advisor', start: '2026-08', end: null, description: 'Advise the President & direct organization-wide strategy development and execution.', skills: [] },
      { title: 'President', start: '2025-04', end: '2026-08', description: 'Co-founded and lead StackHacks, a student tech org with four selective project tracks (AI/ML, Cybersecurity, Web Development, Application Recreation); also direct the Spring 2026 Internship Program', skills: [] },
      { title: 'Founder & Chief Marketing Officer', start: '2024-01', end: '2025-04', description: 'Multi-Channel Marketing Strategy - Led 600% increase in membership', skills: [] },
    ],
    externalExperience: [
      // Her screenshot was cut off at the bottom: more entries may exist (flagged)
      {
        company: "SEO (Sponsors for Educational Opportunity)",
        role: "SEO Edge - Alternative Investments & Investment Banking (AIIB) Track",
        type: "",
        start: "2025-08",
        end: null,
        location: "New York City Metropolitan Area",
        workMode: "Remote",
        description: null,
        skills: [],
        logo: null,
        truncated: false,
        chipLabel: "SEO",
      },
      {
        company: "The Community Preservation Corporation",
        role: "2026 Asset Management Summer Analyst",
        type: "Internship",
        start: "2026-06",
        end: "2026-08",
        location: "New York City Metropolitan Area",
        workMode: "",
        description: "Multifamily Affordable Housing",
        skills: [],
        logo: null,
        truncated: false,
      },
      // Headline says "2x HackMIT" but only this one HackMIT entry was provided (flagged)
      {
        company: "HackMIT",
        role: "Full-Stack Developer - Prosperity, HackMIT",
        type: "",
        start: "2025-09",
        end: "2025-09",
        location: "Boston, Massachusetts, United States",
        workMode: "",
        description: "Selected from over 5,000 global applicants to compete in HackMIT, one of the world's most prestigious collegiate hackathons. Built a platform providing personalized financial modeling and accessible financial literacy education for underserved communities.",
        skills: [],
        logo: null,
        truncated: false,
      },
      {
        company: "GTIS Partners",
        role: "2025 Private Equity Summer Analyst",
        type: "Internship",
        start: "2025-06",
        end: "2025-08",
        location: "New York City Metropolitan Area",
        workMode: "",
        description: "Real Estate Equity Investments",
        skills: [],
        logo: "GTIS Partners",
        truncated: false,
      },
    ],
    education: 'Student at Binghamton University',
    highlights: ['2x HackMIT'],
  },

  // Eric Kim
  'e1b094ea-e5e7-4632-92e9-f63687a9e728': {
    involvement: [
      { title: 'President', start: '2026-05', end: null, skills: [] },
      {
        title: 'Vice President & Project Manager', start: '2025-09', end: '2026-05',
        description: "Developed the club's first content management system (stackhacksbu.vercel.app), drove the club's project completion rate from 25% to 100%",
        skills: ['Operations Management', 'Project Management'],
        project: "StackHacks' Official Site", // inferred from the stackhacksbu.vercel.app mention
      },
      { title: 'Director of Team Excellence', start: '2025-08', end: '2025-09', description: 'Led interview operations (30+ candidates) and onboarding process (18+ members, 4 project teams)', skills: ['Onboarding', 'Team Building'] },
      { title: 'Project Co-Lead', start: '2024-09', end: '2025-08', description: 'Co-led a team of four to engineer a weather app using Python and Open Meteo API', skills: ['Figma', 'Python'] },
    ],
    externalExperience: [
      // No dates provided (flagged)
      {
        company: "NewYork-Presbyterian",
        role: "Data Analytics & IT",
        type: "",
        start: null,
        end: null,
        location: "",
        workMode: "",
        description: null,
        skills: [],
        logo: "NewYork-Presbyterian",
        truncated: false,
        status: "previous",
      },
    ],
    education: 'Computer Science @ Binghamton',
  },

  // Ryan Martin
  '5da4a62f-be97-4c3e-a352-972bbc343557': {
    involvement: [
      { title: 'Executive Vice President', start: '2026-04', end: null, skills: [] },
      { title: 'Secretary', start: '2026-03', end: '2026-05', skills: [] },
      { title: 'Intern', start: '2026-02', end: '2026-04', skills: [] },
    ],
    externalExperience: [],
    education: 'CS & Philosophy',
  },

  // Mahin Mahmud
  'f5d01437-28bd-46a4-a1a9-fa13cb88f13b': {
    involvement: [
      { title: 'Project Manager', start: '2026-05', end: null, skills: [] },
      { title: 'Chief Technology Officer', start: '2025-08', end: '2026-05', skills: [] },
      {
        title: 'Software Engineering Team Lead', start: '2025-05', end: '2026-05',
        description: [
          'Directed a 4-developer team across a 12-week club project, authoring the PRD, distributing development tickets, and running weekly syncs to accelerate delivery ~25%, shipping an MVP 3 weeks ahead of Demo Day',
          'Built a full-stack tier-list platform end-to-end with Flask, SQLAlchemy, and SQLite, implementing user auth, CRUD tier lists, comments, and an upvote system for students to create and share rankings',
        ],
        skills: [],
        project: 'Binghamton Tier List Maker', // inferred from the tier-list platform description
      },
      { title: 'Intern', start: '2025-01', end: '2025-05', skills: [] },
      { title: 'Project Co-Lead', start: '2024-09', end: '2025-08', skills: [] },
    ],
    externalExperience: [
      {
        company: "MIST (Muslim Interscholastic Tournament)",
        role: "Software Engineer",
        type: "Seasonal",
        start: "2025-08",
        end: null,
        location: "New York, United States",
        workMode: "Hybrid",
        description: null,
        skills: [],
        logo: null,
        truncated: false,
        chipLabel: "MIST",
      },
      {
        company: "DoubleVerify",
        role: "Software Engineer Intern",
        type: "Internship",
        start: "2026-06",
        end: "2026-08",
        location: "New York, New York, United States",
        workMode: "Hybrid",
        description: [
          "Migrated a legacy Django/PostgreSQL publisher blocklist service to native BigQuery tables, auditing 3 write paths and 8+ DAG tasks across the pipeline to eliminate federation calls and deprecate legacy Postgres infrastructure",
          "Replaced REST API CRUD with direct BigQuery SQL operations across core platform workflows, re-pointing read/write paths for 500+ customers and validating cutover via dual-write monitoring across multi-day Airflow DAG runs, cutting read latency by 82%",
        ],
        skills: [],
        logo: null,
        truncated: false,
      },
      {
        company: "Develop for Good",
        role: "Software Engineer",
        type: "Internship",
        start: "2026-05",
        end: "2026-08",
        location: "",
        workMode: "Remote",
        description: [
          "Translated Figma wireframes into custom HTML/CSS builds for a nonprofit platform serving 250+ families annually, implementing a standardized design system to support WCAG 2.1 AA accessibility and mobile-first standards",
          "Consolidated a 4-dropdown, 18-page navigation structure into a streamlined layout by rebuilding the site's information architecture in Figma and implementing it in custom HTML/CSS, improving task completion and mobile usability",
        ],
        skills: [],
        logo: null,
        truncated: false,
      },
    ],
    education: 'CS @ Binghamton University',
  },

  // Katie Schauber (display name stays "Katie Schauber")
  '96a7cd83-a023-4ed2-a328-767c60c77355': {
    involvement: [
      {
        title: 'Secretary', start: '2026-06', end: null,
        description: [
          'Streamline detailed and organized records of club activities such as meeting minutes, attendance rosters',
          'Coordinate communications to 80 club members via email on events and deadlines',
        ],
        skills: [], truncated: true,
      },
      {
        title: 'Project Management Intern', start: '2026-02', end: '2026-05',
        description: [
          'Attend executive board meetings to discuss upcoming events and the project teams progress',
          'Participate in team project meetings to observe and make sure project is moving smoothly',
        ],
        skills: ['Time Management', 'Communication'], truncated: true,
      },
    ],
    externalExperience: [],
    education: 'CS @ Binghamton',
  },

  // Jaylin Man
  'ad79feda-fda4-47ee-8949-a76055cb7a38': {
    involvement: [
      { title: 'Vice President of Internal Affairs', start: '2026-05', end: null, description: "Enhancing the organization's internal pipelines, streamlining communications between different chairs", skills: [] },
      { title: 'Chief Marketing Officer', start: '2025-05', end: '2026-05', description: 'Drove an increase in student engagement by designing and deploying high-impact visual content', skills: [] },
      { title: 'Supervisor, Cybersecurity Team', start: '2025-09', end: '2026-05', skills: [] },
      { title: 'Intern', start: '2025-03', end: '2025-05', description: 'Learned the processes of how the organization works and helped plan events', skills: [] },
    ],
    externalExperience: [
      {
        company: "Asian American Dream",
        role: "Product Engineer",
        type: "",
        start: "2026-04",
        end: null,
        location: "",
        workMode: "Remote",
        description: "Building Kin Mentorship Portal to streamline mentor-mentee connections, scheduling, and program coordination for the Asian American Dream community",
        skills: [],
        logo: null,
        truncated: true,
      },
      {
        company: "Air Force Research Laboratory (AFRL)",
        role: "AI Research Intern",
        type: "Internship",
        start: "2026-06",
        end: "2026-08",
        location: "",
        workMode: "On-site",
        description: "Building verifiable NLP pipelines and workflow visualizations.",
        skills: [],
        logo: null,
        truncated: false,
        chipLabel: "AFRL",
      },
    ],
    education: 'CS @ Binghamton University',
  },

  // Maxwell Chan
  '5b8255c0-65fd-440b-a589-6da8d9141ac7': {
    involvement: [
      // His card says Junior Advisor; the data gives no dates for it, so it shows as current with no date (flagged)
      { title: 'Junior Advisor', start: null, end: null, current: true, skills: [] },
      { title: 'Chief Operating Officer', start: '2025-08', end: '2026-05', skills: [] },
      { title: 'Intern', start: '2025-01', end: '2025-05', skills: [] },
    ],
    externalExperience: [
      // List may continue below DIVERSOLAR, and the headline's "EY Student Leader" had no entry (flagged)
      {
        company: "Asian American Dream",
        role: "Director of Technology / Product Manager",
        type: "",
        start: "2026-01",
        end: null,
        location: "",
        workMode: "",
        description: "Building: kinmentorshipportal.com/guide",
        skills: [],
        logo: null,
        truncated: false,
      },
      {
        company: "180 Degrees Consulting",
        role: "Client Lead",
        type: "",
        start: "2025-09",
        end: null,
        location: "",
        workMode: "",
        description: null,
        skills: [],
        logo: null,
        truncated: false,
      },
      {
        company: "Cloudflare",
        role: "Intern",
        type: "Internship",
        start: "2026-06",
        end: "2026-08",
        location: "New York, New York, United States",
        workMode: "",
        description: ["RevTech Strategy & Operations", "PM - AI Innovation"],
        skills: [],
        logo: null,
        truncated: false,
      },
      // LinkedIn shows "+3 skills" that were not provided
      {
        company: "Sullivan & Cromwell LLP",
        role: "Intern",
        type: "Internship",
        start: "2025-06",
        end: "2025-08",
        location: "New York, New York, United States",
        workMode: "On-site",
        description: "Business Development - Technology",
        skills: ["Programming", "Data Analysis"],
        logo: null,
        truncated: true,
      },
      {
        company: "DIVERSOLAR",
        role: "Intern",
        type: "Internship",
        start: "2023-07",
        end: "2023-08",
        location: "",
        workMode: "",
        description: "Data & Operations",
        skills: [],
        logo: null,
        truncated: false,
      },
    ],
    education: 'Business & CS @ Binghamton University',
  },

  // Stephania Calin
  '002e3ed1-4d49-48e6-9ec8-a5c4cce7463c': {
    involvement: [
      { title: 'Cyber Security Team Lead', start: '2026-10', end: null, skills: ['Leadership', 'Cybersecurity'] },
      { title: 'Vice President of Technical Events', start: '2026-05', end: null, description: 'Design and lead technical workshops on topics like LeetCode and problem-solving strategies, building out slide decks and curriculum for 30+ student attendees', skills: ['Teaching', 'Creativity and Innovation'] },
      { title: 'StackHacks Intern', start: '2026-02', end: null, description: 'Attend weekly technical workshops and hands-on coding sessions to build practical experience with emerging technologies', skills: [], truncated: true },
    ],
    externalExperience: [
      // "+2" skills not shown
      {
        company: "Binghamton University Entrepreneurship & Innovation",
        role: "Research Assistant Intern, Stutter Forward Program",
        type: "Internship",
        start: "2026-09",
        end: null,
        location: "Binghamton, New York, United States",
        workMode: "Hybrid",
        description: [
          "Collaborate with Dr. Gabel and Dr. Dew (Physical Therapy Dept.) to design curriculum and build the public-facing website for Stutter Forward, an evidence-based online community for people who stutter",
          "Build member login and course enrollment using Firebase Authentication and Firestore, and deploy the site on Cloudflare Pages with Cloudflare Workers for edge logic",
          "Structure asynchronous learning content and discussion features while ensuring accessibility and mobile responsiveness across the platform",
        ],
        skills: ["Research Collaboration", "Web Development"],
        logo: null,
        truncated: true,
        chipLabel: "Binghamton University",
      },
      {
        company: "Thomas J. Watson College of Engineering and Applied Science, Binghamton University",
        role: "Course Assistant, CS 110 Programming Concepts & Applications (Fall 2026)",
        type: "Internship",
        start: "2026-06",
        end: null,
        location: "",
        workMode: "On-site",
        description: "Held weekly office hours providing one on one and small-group support to help students debug code, understand core programming logic, and strengthen problem-solving skills",
        skills: [],
        logo: null,
        truncated: true,
        parent: "Thomas J. Watson College of Engineering and Applied Science, Binghamton University",
        chipLabel: "Watson College",
      },
      // "+2" skills not shown
      {
        company: "Thomas J. Watson College of Engineering and Applied Science, Binghamton University",
        role: "Course Assistant, CS 301 Ethical, Social, and Global Issues in Computing (Spring 2026)",
        type: "Internship",
        start: "2026-01",
        end: "2026-05",
        location: "",
        workMode: "On-site",
        description: "Participate in weekly instructor and section team meetings to support course coordination and consistency",
        skills: ["Grading", "Classroom Instruction"],
        logo: null,
        truncated: true,
        parent: "Thomas J. Watson College of Engineering and Applied Science, Binghamton University",
        chipLabel: "Watson College",
      },
      // "+3" skills not shown
      {
        company: "Thomas J. Watson College of Engineering and Applied Science, Binghamton University",
        role: "Course Assistant, CS 105 Intro to Computing (Fall 2025)",
        type: "Internship",
        start: "2025-08",
        end: "2025-12",
        location: "",
        workMode: "On-site",
        description: "Grade programming assignments and provide detailed feedback to support student learning and improvement",
        skills: ["Grading", "Classroom Instruction"],
        logo: null,
        truncated: true,
        parent: "Thomas J. Watson College of Engineering and Applied Science, Binghamton University",
        chipLabel: "Watson College",
      },
      {
        company: "Girls Who Code",
        role: "Girls Who Code Instructor",
        type: "Internship",
        start: "2025-08",
        end: null,
        location: "Binghamton University, New York, United States",
        workMode: "On-site",
        description: null,
        skills: [],
        logo: null,
        truncated: false,
      },
    ],
    education: 'CS @ Binghamton',
  },

  // Naomi Sellam (matched by first name + role; please confirm)
  '4ad3f602-ee3b-4ac8-b02c-6d8fe45d6e9e': {
    involvement: [
      { title: 'Vice President of Finance', start: '2026-08', end: null, skills: [] },
      { title: 'Full-Stack Engineering Team Lead', start: '2025-08', end: null, skills: [] },
    ],
    externalExperience: [],
    education: 'CS @ Binghamton',
  },

  // Maddie Broderick (matched by first name + role; please confirm)
  'f562fc57-3fc0-4968-a09a-5a20a3d6f1eb': {
    involvement: [
      { title: 'Director of External Affairs', start: '2025-08', end: null, skills: [] },
      { title: 'Project Management Intern', start: '2026-01', end: '2026-05', skills: [] },
    ],
    externalExperience: [],
    education: 'CS @ Binghamton',
  },

  // Ryan Tsui
  'b8892669-d1d5-458d-8d66-a4e43f29e544': {
    involvement: [
      { title: 'Director of Professional Development', start: '2026-04', end: null, skills: [] },
      {
        title: 'Intern', start: '2026-02', end: '2026-04',
        description: [
          'Collaborated on project-based team initiatives to design and implement innovative solutions.',
          'Participated in professional development sessions to enhance career readiness and networking',
        ],
        skills: [], truncated: true,
      },
    ],
    externalExperience: [
      {
        company: "moomoo",
        role: "Trade Compliance Intern - Surveillance Support",
        type: "Internship",
        start: "2026-06",
        end: "2026-08",
        location: "Jersey City, New Jersey, United States",
        workMode: "Hybrid",
        description: "Global Branches - US Branch - US Institutional Business Center - Compliance Team Department",
        skills: [],
        logo: null,
        truncated: false,
      },
      {
        company: "Futu Clearing Inc.",
        role: "Intern - Trade Surveillance",
        type: "Internship",
        start: "2026-06",
        end: "2026-08",
        location: "Jersey City, New Jersey, United States",
        workMode: "Hybrid",
        description: [
          "Analyzed trading activity using SQL and Excel to detect potential insider trading and market manipulation.",
          "Investigated automated surveillance alerts by evaluating P&L, transaction history, and trading behavior.",
          "Reviewed compliance-flagged accounts, documenting trading patterns and potential risk indicators.",
          "Collaborated with Compliance analysts to support regulatory risk assessments and investigations.",
        ],
        skills: [],
        logo: null,
        truncated: false,
      },
      // GitHub bullet appeared twice in the screenshot; deduped
      {
        company: "SaveAway® with INSPIRAVE",
        role: "Software Engineer Intern",
        type: "Internship",
        start: "2025-06",
        end: "2025-08",
        location: "",
        workMode: "Hybrid",
        description: [
          "Contributed full-stack improvements for a savings plan website serving 1,000+ users, implementing Java + SQL updates for order tracking and milestone summaries",
          "Refactored existing code and added tests to improve the dashboard functionality, readability, and long-term maintainability",
          "Translated user feedback into bug fixes and UX refinements, addressing UI display issues, improving performance, and making dashboard data easier to read and understand",
          "Built and helped deployed production-ready services using Java, JSP, Maven, and Tomcat, ensuring scalability and maintainability",
          "Collaborated using GitHub (branching, pull requests, and code reviews) to streamline integration and deployment",
        ],
        skills: [],
        logo: null,
        truncated: false,
      },
    ],
    education: 'CS @ Binghamton',
  },
}

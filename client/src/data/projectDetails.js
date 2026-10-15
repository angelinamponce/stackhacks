// Extra project details that the Sanity "project" schema doesn't store yet
// (title, term, track, image, About and team come from Sanity).
// Keyed by the Sanity document _id.
//
// PLACEHOLDER fields (null) are hidden on the site until real values are added.
// `techStack` lists only technologies named in each project's Sanity "About" text;
// project teams should confirm and complete it.

export const projectDetails = {
  // Email Phishing Detector (Cyber Security Track)
  'd9a4ff88-6cd7-4e9f-a0bb-0b07a0d86947': {
    techStack: ['Chrome Extension', 'Gemini API'], // from About text, needs confirming
    liveUrl: null, // PLACEHOLDER: needs real link
    githubUrl: null, // PLACEHOLDER: needs real link
  },

  // Ink2Pixel (AI Track)
  '9ab30a5e-8f93-4b5a-a69a-4f74a237ff9b': {
    techStack: null, // PLACEHOLDER: About text names no specific technologies
    liveUrl: null, // PLACEHOLDER: needs real link
    githubUrl: null, // PLACEHOLDER: needs real link
  },

  // Binghamton Tier List Maker (Recreating Apps Track)
  'a1f9eba0-038e-4f07-9e05-09e699558210': {
    techStack: ['Flask'], // from About text, needs confirming
    liveUrl: null, // PLACEHOLDER: needs real link
    githubUrl: null, // PLACEHOLDER: needs real link
  },

  // StackHacks' Official Site (Web Dev Track)
  '59bd9bdd-0dae-4207-952c-24c3dba8800e': {
    techStack: ['React', 'Tailwind CSS', 'Sanity'], // from About text
    liveUrl: null, // PLACEHOLDER: production URL isn't recorded in the repo
    githubUrl: 'https://github.com/EKim06/Stackhacks', // this repository's git remote
  },
}

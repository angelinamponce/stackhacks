import hackMadnessFlyer from '../assets/events/hack-madness-flyer.jpg'
import eoyGroup from '../assets/events/eoy-group.jpg'
import eoyHost from '../assets/events/eoy-host.jpg'
import eoyGuestSpeaker from '../assets/events/eoy-guest-speaker.jpg'
import eoyFoundersAddress from '../assets/events/eoy-founders-address.jpg'
import aiTeam from '../assets/events/ai-team.jpg'
import aiTeamSlides1 from '../assets/events/ai-team-slides-1.jpg'
import aiTeamSlides2 from '../assets/events/ai-team-slides-2.jpg'
import cyberSecurityTeam from '../assets/events/cyber-security-team.jpg'
import webDevTeam from '../assets/events/web-dev-team.jpg'
import recreatingAppsTeam from '../assets/events/recreating-apps-team.jpg'
import recreatingAppsSlides1 from '../assets/events/recreating-apps-slides-1.jpg'
import recreatingAppsSlides2 from '../assets/events/recreating-apps-slides-2.jpg'
import workshop1 from '../assets/events/workshop-1.jpg'
import hackMadnessGroup from '../assets/events/hack-madness-group.jpg'
import hackMadness1 from '../assets/events/hack-madness-1.jpg'
import hackMadness2 from '../assets/events/hack-madness-2.jpg'
import hackMadness3 from '../assets/events/hack-madness-3.jpg'
import hackMadness4 from '../assets/events/hack-madness-4.jpg'

// Past Events page content. Photos are one entry per slot:
//   { src, alt, caption, placeholder, position, more }
//   src          image import; null shows the "coming soon" placeholder instead
//   alt          describes only what is visible in the photo (no names)
//   caption      shown under the slot and in the lightbox (omit for none)
//   placeholder  label inside the empty slot
//   position     optional CSS object-position when the slot crops the photo
//   more         optional extra photos ({ src, alt }) that open with this one as a set in the lightbox
//
// Images are optimized copies in client/src/assets/events/ (1600px long edge, JPEG q80, no metadata).
// To add a photo: drop the file there, import it here, and set `src`.
// Nothing below is invented; copy comes from the provided text and the Hack Madness flyer.

export const ceremony = {
  intro:
    'Our End of Year Ceremony brings our entire community together to celebrate our collective milestones, individual achievements, and growth over the past year.',
  groupPhoto: {
    src: eoyGroup,
    alt: 'StackHacks members in formal attire posing together in front of an End of Year Banquet screen, next to a Binghamton University podium',
    caption: null,
    placeholder: 'Group photo coming soon',
    position: '50% 40%',
  },
  speakers: [
    { src: eoyHost, alt: 'A speaker at a Binghamton University podium beside an End of Year Banquet slide, with guests seated at banquet tables in the foreground', caption: 'Event Host', placeholder: 'Photo coming soon' },
    { src: eoyGuestSpeaker, alt: 'A smiling speaker at a Binghamton University podium beside a Guest Speaker slide showing an Amazon logo', caption: 'Guest Speaker', placeholder: 'Photo coming soon' },
    { src: eoyFoundersAddress, alt: 'A speaker at a Binghamton University podium beside a Founders Address slide, with guests seated in the foreground', caption: 'Founder', placeholder: 'Photo coming soon' },
  ],
  // Same names as the Projects page track filters
  teams: [
    {
      src: aiTeam, alt: 'Four AI team members in business attire standing in front of the End of Year Banquet screen', caption: 'AI', placeholder: 'Team photo coming soon',
      more: [
        { src: aiTeamSlides1, alt: 'AI team members presenting a VLM slide at the banquet, one speaking at the podium' },
        { src: aiTeamSlides2, alt: 'AI team members presenting their Ink2Pixel title slide at the banquet' },
      ],
    },
    { src: cyberSecurityTeam, alt: 'Four Cyber Security team members smiling in front of the End of Year Banquet screen', caption: 'Cyber Security', placeholder: 'Team photo coming soon' },
    { src: webDevTeam, alt: 'Four Web Dev team members in suits posing in front of the End of Year Banquet screen', caption: 'Web Dev', placeholder: 'Team photo coming soon' },
    {
      src: recreatingAppsTeam, alt: 'Three Recreating Apps team members standing in a lounge beside a stone fireplace', caption: 'Recreating Apps', placeholder: 'Team photo coming soon',
      more: [
        { src: recreatingAppsSlides1, alt: 'Recreating Apps team members presenting the B-Ranked tier list app on a large screen at the banquet' },
        { src: recreatingAppsSlides2, alt: 'Recreating Apps team members presenting a User Sign Up & Authentication slide at the banquet' },
      ],
    },
  ],
}

export const generalBody = {
  intro:
    'Throughout the year, we host general body meetings and interactive workshops tailored to skill-building and community engagement.',
  photos: [
    { src: workshop1, alt: 'A large group of StackHacks members posing in a classroom in front of a projected StackHacks title slide', placeholder: 'Photo coming soon' },
    // Only one workshop photo so far; these two stay as placeholders
    { src: null, alt: 'Project demo at a StackHacks general body meeting', placeholder: 'Photo coming soon' },
    { src: null, alt: 'Networking Q&A at a StackHacks event', placeholder: 'Photo coming soon' },
  ],
}

// Wording follows the flyer (a coding tournament). No year is given on the flyer, so none is shown.
export const hackMadness = {
  presenter: 'StackHacks x ACM Presents',
  title: 'Hack Madness',
  tagline: 'The Most Premier Coding Tournament',
  flyer: {
    src: hackMadnessFlyer,
    alt: 'Hack Madness flyer: StackHacks x ACM present The Most Premier Coding Tournament. Qualifications: Fair Play & Integrity, Algorithmic Proficiency, Teams of 2 required. $300+ prize pool. When: 4/18 at 12:30 PM. Where: UU 215. Registration deadline: April 16th.',
    caption: 'Hack Madness flyer',
  },
  qualifications: ['Fair Play & Integrity', 'Algorithmic Proficiency', 'Teams of 2 required'],
  // "Tournament Blueprint", page 2 of the flyer (only "Currated" is corrected to "Curated")
  blueprint: [
    { title: 'The Challenge: LeetCode', lead: 'Single-Day Intensive Event', text: 'Curated selection of Leetcode problems chosen by the board.' },
    { title: 'Rapid-Fire Scoring', lead: 'Intense and quick judging system', text: 'Real-time scoring and updates during the event' },
  ],
  details: [
    { label: 'Prize pool', value: '$300+' },
    { label: 'When', value: '4/18 at 12:30 PM' },
    { label: 'Where', value: 'UU 215' },
    { label: 'Registration deadline', value: 'April 16th' },
  ],
  // Gallery: photos only, no captions. The first photo is the featured hero; the rest fill the grid below.
  photos: [
    { src: hackMadnessGroup, alt: 'Hack Madness participants posing together in a classroom in front of the projected Hack Madness title slide', position: '50% 70%' },
    { src: hackMadness1, alt: 'Three participants smiling together by a sunlit window during Hack Madness' },
    { src: hackMadness2, alt: 'Participants seated at laptops smiling at the camera during Hack Madness' },
    { src: hackMadness3, alt: 'Participants concentrating on their laptops during Hack Madness' },
    { src: hackMadness4, alt: 'A classroom full of participants working on laptops during Hack Madness' },
  ],
}

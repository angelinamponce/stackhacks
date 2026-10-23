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
import workshop2 from '../assets/events/workshop-2.jpg'
import workshop3 from '../assets/events/workshop-3.jpg'
import workshop4 from '../assets/events/workshop-4.jpg'
import communityDay from '../assets/events/community-day.jpg'
import hackMadnessGroup from '../assets/events/hack-madness-group.jpg'
import hackMadness1 from '../assets/events/hack-madness-1.jpg'
import hackMadness2 from '../assets/events/hack-madness-2.jpg'
import hackMadness3 from '../assets/events/hack-madness-3.jpg'
import hackMadness4 from '../assets/events/hack-madness-4.jpg'
import angelinaHeadshot from '../assets/events/angelina-ponce-headshot.jpg'
import hamidHeadshot from '../assets/events/hamid-ajose-headshot.jpg'
import davidHeadshot from '../assets/events/david-ponce-headshot.jpg'
// Official logos, downloaded from each organization's own website (stored locally, not hotlinked)
import brightshoreLogo from '../assets/logos/brightshore.svg'
import cpcLogo from '../assets/logos/cpc.png'
import hackmitLogo from '../assets/logos/hackmit.svg'
import colorstackLogo from '../assets/logos/colorstack.png'
import eunoLogo from '../assets/logos/euno.svg'
import neuralseekLogo from '../assets/logos/neuralseek.svg'
import binghamtonLogo from '../assets/logos/binghamton.png'

// Community page content. Photos are one entry per slot:
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
  // Speakers: the card photo is the event photo; clicking it opens a profile panel with the headshot
  // and achievements. Achievements use only the facts provided (slide wording kept where noted).
  //   achievement: { text, detail?, current?, company?, logo?, logoSrc?, logoTone?, chipLabel? }
  //   logoSrc is a local logo file; logo is a company title in the site's logo set (Sanity "company" docs);
  //   logoTone 'light' shows a dark logo on a light plate; with neither, a text chip shows
  //   headshot.sanityFounder: load the headshot from that person's Sanity founder document instead
  speakers: [
    {
      role: 'Event Host', name: 'Angelina Ponce', title: 'Founder & Senior Advisor',
      src: eoyHost, alt: 'Angelina Ponce speaking at a Binghamton University podium beside an End of Year Banquet slide, with guests seated at banquet tables in the foreground', placeholder: 'Photo coming soon',
      headshot: { src: angelinaHeadshot, alt: 'Headshot of Angelina Ponce in a black blazer against an orange backdrop', position: '50% 30%' },
      // From her career-highlights slide (the slide names Brightshore Capital for the private equity role)
      achievements: [
        { text: 'Private Equity Summer Analyst at Brightshore Capital', company: 'Brightshore Capital', logoSrc: brightshoreLogo, logoTone: 'light' },
        { text: 'Asset Management Summer Analyst at CPC', company: 'CPC', logoSrc: cpcLogo, logoTone: 'light' },
        { text: 'HackMIT 2025 and 2026', company: 'HackMIT', logoSrc: hackmitLogo },
        { text: 'ColorStack StackedUp Summit 2025 and 2026', company: 'ColorStack', logoSrc: colorstackLogo },
      ],
    },
    {
      role: 'Guest Speaker', name: 'Hamid Ajose', title: 'Founding Enterprise ADR, Ex AWS',
      src: eoyGuestSpeaker, alt: 'Hamid Ajose smiling at a Binghamton University podium beside a Guest Speaker slide showing an Amazon logo', placeholder: 'Photo coming soon',
      headshot: { src: hamidHeadshot, alt: 'Headshot of Hamid Ajose smiling in a black shirt against a light gray backdrop', position: '50% 25%' },
      achievements: [
        { text: 'Founding Enterprise ADR at Euno', detail: 'Full-time · Apr 2026 – Present · New York City Metropolitan Area', current: true, company: 'Euno', logoSrc: eunoLogo, logoTone: 'light' },
        // Event slide wording; LinkedIn lists it as SDE Intern at Amazon
        { text: 'Software Development Engineer Intern @ Amazon Web Services', detail: 'SDE Intern at Amazon · May 2025 – Sep 2025 · Palo Alto, California', company: 'Amazon', logo: 'Amazon' },
      ],
    },
    {
      role: 'Founding President', name: 'David Ponce', title: 'Founding President',
      src: eoyFoundersAddress, alt: 'David Ponce speaking at a Binghamton University podium beside a Founders Address slide, with guests seated in the foreground', placeholder: 'Photo coming soon',
      headshot: { src: davidHeadshot, alt: 'Headshot of David Ponce in a white shirt against a coral backdrop', position: '50% 25%' },
      achievements: [
        { text: 'Technology consulting at Brightshore Capital', current: true, company: 'Brightshore Capital', logoSrc: brightshoreLogo, logoTone: 'light' },
        { text: "Pursuing a Master's in Computer Science at NYU Tandon School of Engineering", current: true, company: 'NYU Tandon School of Engineering', chipLabel: 'NYU Tandon' },
        { text: "3rd place at HackMIT '25, Infosys Top Sponsor Challenge", company: 'Infosys', logo: 'Infosys' },
        { text: 'Pursued published research on adversarial defenses against deepfake audio with Intel Corporation', company: 'Intel', logo: 'Intel' },
        { text: 'Former 2x NCAA Division 1 Swim & Dive Captain', company: 'Binghamton University', logoSrc: binghamtonLogo },
        { text: 'Software Development Intern at NeuralSeek', detail: 'May 2026 – Aug 2026 · Remote', company: 'NeuralSeek', logoSrc: neuralseekLogo },
        { text: 'Technician, Program Development at Emerging Technology Studio, Binghamton University', detail: 'Mar 2024 – May 2026', company: 'Emerging Technology Studio', chipLabel: 'Emerging Tech Studio' },
      ],
    },
  ],
  // Full team names (the Projects page filters keep their short Sanity names)
  teams: [
    {
      src: aiTeam, alt: 'Four AI/ML team members in business attire standing in front of the End of Year Banquet screen', caption: 'AI/ML', placeholder: 'Team photo coming soon',
      more: [
        { src: aiTeamSlides1, alt: 'AI/ML team members presenting a VLM slide at the banquet, one speaking at the podium' },
        { src: aiTeamSlides2, alt: 'AI/ML team members presenting their Ink2Pixel title slide at the banquet' },
      ],
    },
    { src: cyberSecurityTeam, alt: 'Four Cybersecurity team members smiling in front of the End of Year Banquet screen', caption: 'Cybersecurity', placeholder: 'Team photo coming soon' },
    { src: webDevTeam, alt: 'Four Website Development team members in suits posing in front of the End of Year Banquet screen', caption: 'Website Development', placeholder: 'Team photo coming soon' },
    {
      src: recreatingAppsTeam, alt: 'Three Recreating Applications team members standing in a lounge beside a stone fireplace', caption: 'Recreating Applications', placeholder: 'Team photo coming soon',
      more: [
        { src: recreatingAppsSlides1, alt: 'Recreating Applications team members presenting the B-Ranked tier list app on a large screen at the banquet' },
        { src: recreatingAppsSlides2, alt: 'Recreating Applications team members presenting a User Sign Up & Authentication slide at the banquet' },
      ],
    },
  ],
}

export const generalBody = {
  intro:
    'Throughout the year, we host general body meetings and interactive workshops tailored to skill-building and community engagement.',
  photos: [
    { src: workshop1, alt: 'A large group of StackHacks members posing in a classroom in front of a projected StackHacks title slide', placeholder: 'Photo coming soon' },
    { src: workshop2, alt: 'StackHacks general body meeting: a packed classroom of members posing in front of a projected StackHacks title slide', placeholder: 'Photo coming soon' },
    { src: workshop3, alt: 'StackHacks general body workshop: members seated at classroom desks with laptops, facing the front of the room', placeholder: 'Photo coming soon' },
    // Second row
    { src: workshop4, alt: 'A presenter beside a projected Internship slide, speaking to members seated at classroom desks', placeholder: 'Photo coming soon', position: '50% 60%' },
    { src: communityDay, alt: 'StackHacks members guiding children through a hands-on pegboard activity at a community day', placeholder: 'Photo coming soon' },
    { src: hackMadness2, alt: 'Participants seated at laptops smiling at the camera during Hack Madness', placeholder: 'Photo coming soon' },
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
    { src: hackMadness3, alt: 'Participants concentrating on their laptops during Hack Madness' },
    { src: hackMadness1, alt: 'Three participants smiling together by a sunlit window during Hack Madness' },
    { src: hackMadness4, alt: 'A classroom full of participants working on laptops during Hack Madness' },
  ],
}

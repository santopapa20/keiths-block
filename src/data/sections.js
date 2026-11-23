// Each stop on the block: where the camera sits (cam), what it looks at (look),
// and where the floating label hangs (anchor).
import { projects } from './content.js'

export const SECTIONS = [
  { id: 'home', label: 'The Block', cam: [0, 17, 36], look: [0, 3.5, -1.2] },
  {
    id: 'about', label: 'About', tag: 'who dis',
    cam: [-4.2, 2.2, 5.6], look: [-4.7, 1.65, -2.4], anchor: [-5.1, 3.55, -2.2],
  },
  {
    id: 'skills', label: 'Skills', tag: 'the stack shop',
    cam: [-8.6, 3.7, 9.6], look: [-10.5, 2.9, -4], anchor: [-10.5, 6.6, -3.4],
  },
  {
    id: 'experience', label: 'Experience', tag: 'the ride so far',
    cam: [4.6, 2.6, 8.6], look: [2.2, 0.9, 0.2], anchor: [2.2, 2.35, 0.4],
  },
  {
    id: 'projects', label: 'Projects', tag: projects.length ? 'now open' : 'opening soon',
    cam: [6.9, 2.8, 5.4], look: [6.25, 2.3, -4], anchor: [6.25, 5.6, -3.4],
  },
  {
    id: 'certs', label: 'Certifications', tag: 'trophy room',
    cam: [12.3, 2.9, 5.4], look: [11.75, 2.5, -4], anchor: [11.75, 6.1, -3.4],
  },
  {
    id: 'education', label: 'Education', tag: 'home court',
    cam: [-2.7, 5.6, 17.5], look: [-8.3, 1, 7.2], anchor: [-8.5, 3.9, 7.3],
  },
  {
    id: 'contact', label: 'Contact', tag: 'hit my line',
    cam: [11.6, 2.6, 14.2], look: [9.5, 1.6, 7.2], anchor: [9.5, 3.45, 7.2],
  },
]

export const SECTION_MAP = Object.fromEntries(SECTIONS.map((s) => [s.id, s]))

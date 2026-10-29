export interface Zone {
  id: string;
  name: string;
  color: string;
  icon: string;
  purpose: string;
  users: string[];
  target: { x: number; y: number; z: number };
  camPos: { x: number; y: number; z: number };
}

export const zones: Zone[] = [
  {
    id: 'carousel',
    name: 'Flush-Mount Carousel',
    color: '#e74c3c',
    icon: 'carousel',
    purpose: 'A merry-go-round built level with the ground. It features wide spacing and integrated handholds, allowing users to wheel on effortlessly without transferring.',
    users: ['Wheelchair Users', 'Mobility Aid Users', 'All Children'],
    target: { x: -6, y: 0, z: 6 },
    camPos: { x: -10, y: 5, z: 12 }
  },
  {
    id: 'ramps',
    name: 'Wide Ramp Structure',
    color: '#4a90e2',
    icon: 'ramps',
    purpose: 'Replaces steep stairs with gentle, wide ramps (1:12 slope) with double-height handrails. Ensures everyone can reach the highest play elements together.',
    users: ['Wheelchair Users', 'Toddlers', 'Parents w/ Strollers', 'All Children'],
    target: { x: 0, y: 2, z: -3 },
    camPos: { x: 0, y: 8, z: 12 }
  },
  {
    id: 'sensory',
    name: 'Sensory Garden Wall',
    color: '#9b59b6',
    icon: 'sensory',
    purpose: 'Panels featuring varied textures, high-contrast colors, musical elements, and movable parts. Designed to be engaging without being overstimulating.',
    users: ['Autistic Children', 'Visually Impaired', 'Sensory Processing Needs'],
    target: { x: 8, y: 1.5, z: 4 },
    camPos: { x: 12, y: 3, z: 8 }
  },
  {
    id: 'swing',
    name: 'Saucer Nest Swing',
    color: '#2ecc71',
    icon: 'swing',
    purpose: 'A large, dish-like swing that provides full body support. Children can sit, lie down, or swing together, providing calming vestibular input securely.',
    users: ['Low Core Strength', 'Neurodivergent Children', 'Multiple Children'],
    target: { x: -7, y: 2, z: -5 },
    camPos: { x: -12, y: 4, z: -2 }
  },
  {
    id: 'surface',
    name: 'Poured Rubber Surfacing',
    color: '#f39c12',
    icon: 'surface',
    purpose: 'Unlike wood chips or sand, this continuous poured-in-place rubber surface allows wheels to roll smoothly while providing impact absorption for falls.',
    users: ['Wheelchair Users', 'Mobility Aids', 'Fall Protection'],
    target: { x: 0, y: 0, z: 0 },
    camPos: { x: 0, y: 15, z: 20 }
  }
];

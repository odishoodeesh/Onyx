
import { PRNG } from './prng';
import { Universe } from '../types';

const TECH_LEVELS = [
  'Stone Age', 'Medieval', 'Industrial', 'Modern', 'Cyberpunk', 
  'Space Age', 'Post-Singularity', 'Transcendental', 'Steam-Driven',
  'Genetic-Organic', 'Quantum-Integrated', 'Void-Powered'
];
const GOVERNMENTS = [
  'Democracy', 'Galactic Empire', 'AI Council', 'Corporate Hegemony', 
  'Tribal Federation', 'Theocratic Order', 'Technocracy', 'Anarchist Collective',
  'Hive Mind', 'Matriarchal Dynasties', 'Mercenary Oligarchy', 'Nomadic Flocks'
];
const CLIMATES = [
  'Frozen Wasteland', 'Scorched Desert', 'Tropical Paradise', 'Storm World', 
  'Ocean Planet', 'Bioluminescent Jungle', 'Crystal Barrens', 'Floating Archipelago',
  'Subterranean Network', 'Nebula Shrouded', 'Obsidian Plains', 'Methane Seas'
];
const EVENTS = [
  'Alien First Contact', 'The Great Resource War', 'Genetic Plague', 'Quantum Energy Discovery', 
  'AI Uprising', 'Solar Flare Crisis', 'Interdimensional Rift', 'Moon Shattering',
  'The Great Ascendance', 'Biological Transmutation', 'The Quiet Century'
];
const COUNTRIES = [
  'Neo Babylon', 'Solar Union', 'Atlantic Republic', 'Red Sahara', 'North Coalition', 
  'Ethereal Reach', 'Zenith Plateau', 'Titan Core', 'Emerald Enclave', 'Vesper Vanguard',
  'Shadow Syndicate', 'Cloud Kingdom', 'Aurora Alliance', 'Nova Prefecture'
];
const DISCOVERIES = [
  'Ancient Artifacts', 'Faster-Than-Light Travel', 'Immortality Serum', 'Dark Matter Battery', 
  'Psionic Resonance', 'Parallel Dimension Gateway', 'Time Dilation Fields', 'Cold Fusion',
  'Universal Translation', 'Planetary Consciousness', 'Antimatter Engines'
];
const POPULATIONS = [
  '800 Million', '4.2 Billion', '12 Billion', 'Unknown (Scattered)', '50,000 (Last Survivors)', 
  'Digital Consciousness Only', 'Over 100 Billion', '900 Trillion (Micro-Beings)', 'Zero (Automated)'
];

const SUBJECTS = ['Robot', 'Citizen', 'Scientist', 'Soldier', 'Explorer', 'Merchant', 'Governor', 'Deity-Machine', 'Clone-Worker', 'Void-Pilot'];
const VERBS = ['Discovers', 'Bans', 'Launches', 'Reveals', 'Claims', 'Deploys', 'Celebrates', 'Sabotages', 'Terraforms', 'Transcends'];
const OBJECTS = ['New Energy Source', 'Forbidden Tech', 'Deep Space Probe', 'Lost City', 'Cybernetic Law', 'Massive Monument', 'Alien Relic', 'Star Engine', 'Genome Key'];

export const generateUniverse = (seed: number): Universe => {
  const rng = new PRNG(seed);
  
  const blockTime = 30 * 60 * 1000;
  const createdAt = Math.floor(Date.now() / blockTime) * blockTime;
  const expiresAt = createdAt + blockTime;

  const planet = {
    gravity: `${(rng.next() * 2.2 + 0.2).toFixed(2)}x`,
    moons: rng.nextInt(0, 5),
    climate: rng.pick(CLIMATES),
  };

  const society = {
    techLevel: rng.pick(TECH_LEVELS),
    government: rng.pick(GOVERNMENTS),
    population: rng.pick(POPULATIONS),
    dominantCountry: rng.pick(COUNTRIES),
  };

  const history = {
    majorEvent: rng.pick(EVENTS),
    lastWar: `${rng.pick(COUNTRIES)} vs ${rng.pick(COUNTRIES.filter(c => c !== society.dominantCountry))}`,
    discovery: rng.pick(DISCOVERIES),
  };

  const headlines: string[] = [];
  for (let i = 0; i < 6; i++) {
    const s = rng.pick(SUBJECTS);
    const v = rng.pick(VERBS);
    const o = rng.pick(OBJECTS);
    const loc = rng.pick(COUNTRIES);
    
    const templates = [
      `${s} in ${loc} ${v} ${o}`,
      `${loc} Daily: ${o} ${v.toLowerCase()}ed by local ${s.toLowerCase()}s`,
      `BREAKING: ${v} of ${o} at ${society.dominantCountry} border`,
      `${society.government} issues mandate on ${o.toLowerCase()}`,
      `History made as ${s} from ${loc} visits the ${planet.moons > 0 ? 'moon' : 'orbital station'}`,
      `Global Panic: ${o} ${v.toLowerCase()}ed during ${history.majorEvent}`,
      `${society.dominantCountry} scientists claim ${o} defies current physics`
    ];
    headlines.push(rng.pick(templates));
  }

  return {
    id: `UNI-${seed}`,
    seed,
    createdAt,
    expiresAt,
    planet,
    society,
    history,
    headlines
  };
};

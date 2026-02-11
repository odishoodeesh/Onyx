
export interface PlanetInfo {
  gravity: string;
  moons: number;
  climate: string;
}

export interface SocietyInfo {
  techLevel: string;
  government: string;
  population: string;
  dominantCountry: string;
}

export interface HistoryInfo {
  majorEvent: string;
  lastWar: string;
  discovery: string;
}

export interface PhysicalLaws {
  constantSpeedOfLight: string;
  gravityStrength: string;
  uniqueLaw: string;
}

export interface Universe {
  id: string;
  seed: number;
  createdAt: number;
  expiresAt: number;
  planet: PlanetInfo;
  society: SocietyInfo;
  history: HistoryInfo;
  headlines: string[];
  // AI Expanded fields
  description?: string;
  location?: string;
  physicalLaws?: PhysicalLaws;
  anomalies?: string[];
  imageUrl?: string;
}

export interface SavedUniverse extends Universe {
  savedAt: number;
}

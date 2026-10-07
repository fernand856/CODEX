export type StyleId = 'blackwork' | 'fine-line' | 'realismo' | 'tradicional';
export type ArtistId = 'caio' | 'nina' | 'rafael';
export type Period = 'morning' | 'afternoon';

export interface Artist {
  id: ArtistId;
  name: string;
  specialty: string;
  bio: string;
  image: string;
  alt: string;
}

export interface Style {
  id: StyleId;
  name: string;
  description: string;
  image: string;
}

export interface Work {
  id: string;
  title: string;
  image: string;
  alt: string;
  artistId: ArtistId;
  styleId: StyleId;
  bodyRegion: string;
  description: string;
  origin: string;
}

export interface Availability {
  date: string;
  periods: Period[];
}

export interface TattooRequest {
  style: StyleId | 'undecided' | '';
  artist: ArtistId | 'help' | '';
  bodyRegion: string;
  size: string;
  description: string;
  referenceUrl: string;
  referenceWork: string;
  scheduling: 'whatsapp' | 'date';
  date: string;
  period: Period | '';
  budget: string;
  name: string;
}

export type ValidationErrors = Record<string, string>;

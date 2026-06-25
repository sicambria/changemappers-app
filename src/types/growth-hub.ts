export type GrowthModality = 'MENTOR' | 'COACH' | 'TRAINING' | 'PEER';

export interface GrowthOfferBase {
  modality: GrowthModality;
  domain: string;
  description: string;
}

export interface GrowthOfferWithCreator extends GrowthOfferBase {
  id: string;
  createdAt: Date;
  creator: {
    id: string;
    name: string | null;
    displayName: string | null;
    profilePhoto: string | null;
    archetypes: string[];
  };
  modalityData: Record<string, unknown>;
}

export const MODALITY_LABELS: Record<GrowthModality, string> = {
  MENTOR: 'Mentoring',
  COACH: 'Coaching',
  TRAINING: 'Training',
  PEER: 'Peer Support',
};

export interface CompletenessItem {
  key: string;
  label: string;
  weight: number;
  complete: boolean;
  category: 'basic' | 'skills' | 'questionnaire' | 'links' | 'verification';
}

export interface ProfileCompletenessResult {
  percentage: number;
  items: CompletenessItem[];
  incompleteItems: CompletenessItem[];
}

interface UserLike {
  displayName?: string | null;
  bio?: string | null;
  city?: string | null;
  location?: string | null;
  profilePhoto?: string | null;
  archetypes?: string[] | null;
  skills?: Array<{ skillType: string; skill: string }> | null;
  values?: Array<{ value: string }> | null;
  interests?: Array<{ interest: string }> | null;
  website?: string | null;
  socialLinks?: unknown;
  enjoyDoing?: string | null;
  currentIntention?: string | null;
  collaborationPreference?: string[] | null;
  availabilityDetails?: unknown;
  isRemoteCapable?: boolean | null;
  mainCauses?: Array<{ id: string; title: string }> | null;
  interestedCauses?: Array<{ id: string; title: string }> | null;
  isEmailVerified?: boolean | null;
  functionalProfile?: {
    availabilityMode?: string | null;
    currentOffer?: string | null;
    momentNeeds?: string[] | null;
    rdgMain?: string[] | null;
  } | null;
}

const FIELD_WEIGHTS = {
  displayName: 10,
  bio: 12,
  location: 8,
  archetypes: 10,
  profilePhoto: 8,
  skills: 6,
  offers: 5,
  needs: 5,
  values: 5,
  interests: 5,
  website: 3,
  socialLinks: 4,
  enjoyDoing: 3,
  currentIntention: 3,
  collaborationPreference: 3,
  availabilityDetails: 3,
  matchingAvailability: 4,
  currentOffer: 4,
  momentNeeds: 4,
  rdgMain: 3,
  isRemoteCapable: 2,
  mainCauses: 3,
  interestedCauses: 2,
  emailVerified: 2,
} as const;

function hasAvailabilitySlots(raw: unknown): boolean {
  if (!raw) return false;
  let obj: unknown = raw;
  if (typeof raw === 'string') {
    try { obj = JSON.parse(raw); } catch { return false; }
  }
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return false;
  const matrix = obj as Record<string, unknown>;
  return Object.values(matrix).some(v => Array.isArray(v) && v.length > 0);
}

export function useProfileCompleteness(user: UserLike | null | undefined): ProfileCompletenessResult {
  if (!user) {
    return { percentage: 0, items: [], incompleteItems: [] };
  }

  const items: CompletenessItem[] = [];

  items.push(
    {
      key: 'displayName',
      label: 'Display name',
      weight: FIELD_WEIGHTS.displayName,
      complete: (user.displayName?.length ?? 0) >= 2,
      category: 'basic',
    },
    {
      key: 'bio',
      label: 'Introduction',
      weight: FIELD_WEIGHTS.bio,
      complete: (user.bio?.length ?? 0) > 20,
      category: 'basic',
    },
    {
      key: 'location',
      label: 'Location',
      weight: FIELD_WEIGHTS.location,
      complete: !!(user.city || user.location),
      category: 'basic',
    },
    {
      key: 'profilePhoto',
      label: 'Profile photo',
      weight: FIELD_WEIGHTS.profilePhoto,
      complete: !!user.profilePhoto,
      category: 'basic',
    },
    {
      key: 'archetypes',
      label: 'Archetypes',
      weight: FIELD_WEIGHTS.archetypes,
      complete: !!user.archetypes?.length,
      category: 'basic',
    },
  );

  const skillsList = user.skills || [];
  items.push(
    {
      key: 'skills',
      label: 'Skills',
      weight: FIELD_WEIGHTS.skills,
      complete: skillsList.some(s => s.skillType === 'EXPERIENCE'),
      category: 'skills',
    },
    {
      key: 'offers',
      label: 'What you offer',
      weight: FIELD_WEIGHTS.offers,
      complete: skillsList.some(s => s.skillType === 'OFFERED'),
      category: 'skills',
    },
    {
      key: 'needs',
      label: 'What you seek',
      weight: FIELD_WEIGHTS.needs,
      complete: skillsList.some(s => s.skillType === 'SEEKING'),
      category: 'skills',
    },
  );

  const valuesList = user.values || [];
  items.push({
    key: 'values',
    label: 'Values',
    weight: FIELD_WEIGHTS.values,
    complete: valuesList.length > 0,
    category: 'skills',
  });

  const interestsList = user.interests || [];
  items.push(
    {
      key: 'interests',
      label: 'Interests',
      weight: FIELD_WEIGHTS.interests,
      complete: interestsList.length > 0,
      category: 'skills',
    },
    {
      key: 'enjoyDoing',
      label: 'What you enjoy doing',
      weight: FIELD_WEIGHTS.enjoyDoing,
      complete: !!user.enjoyDoing,
      category: 'questionnaire',
    },
    {
      key: 'currentIntention',
      label: 'Current intention',
      weight: FIELD_WEIGHTS.currentIntention,
      complete: !!user.currentIntention,
      category: 'questionnaire',
    },
  );

  const collabPrefs = user.collaborationPreference || [];
  items.push(
    {
      key: 'collaborationPreference',
      label: 'Collaboration preferences',
      weight: FIELD_WEIGHTS.collaborationPreference,
      complete: collabPrefs.length > 0,
      category: 'questionnaire',
    },
    {
      key: 'availabilityDetails',
      label: 'Availability',
      weight: FIELD_WEIGHTS.availabilityDetails,
      complete: hasAvailabilitySlots(user.availabilityDetails),
      category: 'questionnaire',
    },
    {
      key: 'matchingAvailability',
      label: 'Matching availability',
      weight: FIELD_WEIGHTS.matchingAvailability,
      complete: !!user.functionalProfile?.availabilityMode,
      category: 'questionnaire',
    },
    {
      key: 'currentOffer',
      label: 'Current offer',
      weight: FIELD_WEIGHTS.currentOffer,
      complete: !!user.functionalProfile?.currentOffer,
      category: 'questionnaire',
    },
    {
      key: 'momentNeeds',
      label: 'Current needs',
      weight: FIELD_WEIGHTS.momentNeeds,
      complete: (user.functionalProfile?.momentNeeds?.length ?? 0) > 0,
      category: 'questionnaire',
    },
    {
      key: 'rdgMain',
      label: 'RDG focus',
      weight: FIELD_WEIGHTS.rdgMain,
      complete: (user.functionalProfile?.rdgMain?.length ?? 0) > 0,
      category: 'questionnaire',
    },
    {
      key: 'isRemoteCapable',
      label: 'Remote capability',
      weight: FIELD_WEIGHTS.isRemoteCapable,
      complete: user.isRemoteCapable === true,
      category: 'questionnaire',
    },
    {
      key: 'website',
      label: 'Website',
      weight: FIELD_WEIGHTS.website,
      complete: !!user.website,
      category: 'links',
    },
  );

  const socialLinks = (user.socialLinks as Record<string, string>) || {};
  const hasSocialLinks = Object.values(socialLinks).some(v => v && typeof v === 'string' && v.trim() !== '');
  items.push({
    key: 'socialLinks',
    label: 'Social links',
    weight: FIELD_WEIGHTS.socialLinks,
    complete: hasSocialLinks,
    category: 'links',
  });

  const mainCausesList = user.mainCauses || [];
  items.push({
    key: 'mainCauses',
    label: 'Main causes',
    weight: FIELD_WEIGHTS.mainCauses,
    complete: mainCausesList.length > 0,
    category: 'links',
  });

  const interestedCausesList = user.interestedCauses || [];
  items.push(
    {
      key: 'interestedCauses',
      label: 'Interested causes',
      weight: FIELD_WEIGHTS.interestedCauses,
      complete: interestedCausesList.length > 0,
      category: 'links',
    },
    {
      key: 'emailVerified',
      label: 'Email verified',
      weight: FIELD_WEIGHTS.emailVerified,
      complete: user.isEmailVerified === true,
      category: 'verification',
    },
  );

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const completedWeight = items
    .filter(item => item.complete)
    .reduce((sum, item) => sum + item.weight, 0);
  const percentage = Math.round((completedWeight / totalWeight) * 100);

  const incompleteItems = items.filter(item => !item.complete);

  return { percentage, items, incompleteItems };
}

/**
 * Cache revalidation tag constants for all modules.
 * Using constants prevents typos across server actions.
 */

// Training
export const CACHE_TAG_TRAINING_OFFERS = 'training-offers';
export const CACHE_TAG_TRAINING_REQUESTS = 'training-requests';
export const trainingEngagementTag = (id: string) => `training-engagement-${id}`;

// Mentoring
export const CACHE_TAG_MENTOR_PROFILES = 'mentor-profiles';
export const CACHE_TAG_MENTORING_REQUESTS = 'mentoring-requests';
export const mentoringRelationshipTag = (id: string) => `mentoring-relationship-${id}`;

// Peer Support
export const CACHE_TAG_PEER_OFFERS = 'peer-support-offers';
export const CACHE_TAG_PEER_REQUESTS = 'peer-support-requests';
export const peerConnectionTag = (id: string) => `peer-connection-${id}`;

// Coaching
export const CACHE_TAG_COACHING_OFFERS = 'coaching-offers';
export const CACHE_TAG_COACHING_REQUESTS = 'coaching-requests';
export const coachingEngagementTag = (id: string) => `coaching-engagement-${id}`;

// Contribution
export const CACHE_TAG_CONTRIBUTION_OFFERS = 'contribution-offers';
export const CACHE_TAG_CONTRIBUTION_REQUESTS = 'contribution-requests';
export const contributionConnectionTag = (id: string) => `contribution-connection-${id}`;

// Systems Canvas
export const CACHE_TAG_CANVASES = 'canvases';
export const canvasTag = (id: string) => `canvas-${id}`;
export const CACHE_TAG_PATTERN_LIBRARY = 'pattern-library';

// Ecosystem Coordination
export const CACHE_TAG_INITIATIVES = 'initiatives';
export const initiativeTag = (id: string) => `initiative-${id}`;
export const CACHE_TAG_BACKLOG = 'backlog';

// Community Health
export const communityHealthTag = (communityId: string) => `community-health-${communityId}`;

// Events
export const CACHE_TAG_EVENTS = 'events';

// Volunteering
export const CACHE_TAG_VOLUNTEER_OPPORTUNITIES = 'volunteer-opportunities';
export const CACHE_TAG_VOLUNTEER_APPLICATIONS = 'volunteer-applications';
export const volunteerOpportunityTag = (id: string) => `volunteer-opportunity-${id}`;

// Energy Flow
export const CACHE_TAG_ENERGY_CANVASES = 'energy-canvases';
export const energyCanvasTag = (id: string) => `energy-canvas-${id}`;
export const CACHE_TAG_ENERGY_PATTERNS = 'energy-patterns';

// Pitch
export const CACHE_TAG_PITCHES = 'pitches';
export const CACHE_TAG_RDGS = 'rdgs';
export const pitchTag = (id: string) => `pitch-${id}`;

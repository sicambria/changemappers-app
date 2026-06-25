import { z } from 'zod';
import { assertCanonicalRdgIds, normalizeRdgDomainId, normalizeRdgId } from '@/lib/taxonomy';

export const createVolunteerOpportunitySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  summary: z.string().min(20, 'Summary must be at least 20 characters').max(500),
  description: z.string().max(5000).optional(),
  primaryRdgs: z.array(z.string()).min(1, 'At least 1 RDG must be selected').max(3, 'Maximum 3 primary RDGs allowed').transform((values): string[] => assertCanonicalRdgIds(values)),
  socialCauseTopics: z.array(z.string()).optional(),
  impactScale: z.enum(['LOCAL', 'BIOREGIONAL', 'NATIONAL', 'GLOBAL']).optional(),
  format: z.enum(['ONLINE', 'OFFLINE', 'HYBRID']).default('HYBRID'),
  location: z.string().max(200).optional(),
  region: z.string().max(100).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  commitmentType: z.enum(['ONE_TIME', 'RECURRING', 'ONGOING']).default('ONE_TIME'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  eventDate: z.coerce.date().optional(),
  applicationDeadline: z.coerce.date().optional(),
  rollingApplications: z.boolean().default(false),
  weeklyHours: z.number().int().min(1).max(168).optional(),
  totalHours: z.number().int().min(1).optional(),
  shiftLength: z.string().max(100).optional(),
  timePreference: z.enum(['DAYTIME', 'EVENING', 'WEEKEND', 'FLEXIBLE']).default('FLEXIBLE'),
  requiredSkills: z.array(z.string()).optional(),
  niceToHaveSkills: z.array(z.string()).optional(),
  experienceLevel: z.enum(['ANY', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('ANY'),
  trainingProvided: z.boolean().default(false),
  ageSuitability: z.string().max(100).optional(),
  languageRequirements: z.array(z.string()).optional(),
  volunteersNeeded: z.number().int().min(1).max(1000).default(1),
  teamBased: z.boolean().default(false),
  physicalEffort: z.enum(['LIGHT', 'MODERATE', 'HEAVY']).default('LIGHT'),
  physicalRequirements: z.array(z.string()).optional(),
  accessibilitySupported: z.array(z.string()).optional(),
  indoorOutdoor: z.enum(['INDOOR', 'OUTDOOR', 'BOTH']).default('BOTH'),
  weatherExposed: z.boolean().default(false),
  travelRequired: z.boolean().default(false),
  transportProvided: z.boolean().default(false),
  equipmentNeeded: z.string().max(500).optional(),
  dressCode: z.string().max(200).optional(),
  expectedImpact: z.string().max(1000).optional(),
  impactMeasurement: z.string().max(500).optional(),
  backgroundCheckRequired: z.boolean().default(false),
  referencesRequired: z.boolean().default(false),
  codeOfConduct: z.boolean().default(false),
  workingWithVulnerable: z.boolean().default(false),
  supervisionLevel: z.enum(['DIRECT', 'PERIODIC', 'MINIMAL', 'INDEPENDENT']).default('DIRECT'),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('LOW'),
  requesterType: z.enum(['INDIVIDUAL', 'NGO', 'SCHOOL', 'COMMUNITY_GROUP', 'PUBLIC_INSTITUTION']).default('INDIVIDUAL'),
  organizationName: z.string().max(200).optional(),
  moreInfoUrl: z.url().max(500).optional().or(z.literal('')),
  visibility: z.enum(['PUBLIC', 'REGISTERED', 'CONNECTIONS']).default('REGISTERED'),
});

export const updateVolunteerOpportunitySchema = createVolunteerOpportunitySchema.partial();

export const createVolunteerApplicationSchema = z.object({
  opportunityId: z.cuid(),
  message: z.string().max(2000).optional(),
  availabilityDetails: z.string().max(1000).optional(),
  relevantExperience: z.string().max(1000).optional(),
});

export const updateVolunteerApplicationSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  volunteerFeedback: z.string().max(2000).optional(),
  requesterFeedback: z.string().max(2000).optional(),
});

export const volunteerOpportunityFilterSchema = z.object({
  rdgDomain: z.preprocess((value) => typeof value === 'string' ? normalizeRdgDomainId(value) ?? value : value, z.enum(['D1', 'D2', 'D3', 'D4', 'D5']).optional()),
  specificRdg: z.preprocess((value) => typeof value === 'string' ? normalizeRdgId(value) ?? value : value, z.string().regex(/^RDG\d{2}$/).optional()),
  topic: z.string().optional(),
  impactScale: z.enum(['LOCAL', 'BIOREGIONAL', 'NATIONAL', 'GLOBAL']).optional(),
  format: z.enum(['ONLINE', 'OFFLINE', 'HYBRID']).optional(),
  commitmentType: z.enum(['ONE_TIME', 'RECURRING', 'ONGOING']).optional(),
  experienceLevel: z.enum(['ANY', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  rollingApplications: z.boolean().optional(),
  search: z.string().max(200).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  radiusKm: z.number().min(1).max(1000).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CreateVolunteerOpportunityInput = z.infer<typeof createVolunteerOpportunitySchema>;
export type UpdateVolunteerOpportunityInput = z.infer<typeof updateVolunteerOpportunitySchema>;
export type CreateVolunteerApplicationInput = z.infer<typeof createVolunteerApplicationSchema>;
export type UpdateVolunteerApplicationInput = z.infer<typeof updateVolunteerApplicationSchema>;
export type VolunteerOpportunityFilterInput = z.infer<typeof volunteerOpportunityFilterSchema>;

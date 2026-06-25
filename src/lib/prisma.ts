// eslint-disable-next-line no-restricted-imports
import { PrismaClient } from '../generated/prisma/client';

// Re-export all enum values AND types from the generated client.
// A single `export { ... } from` makes each name available as both a value and a TS type.
// eslint-disable-next-line no-restricted-imports
export {
  // `Prisma` is a namespace exported as both a value and a type; the value side
  // carries runtime helpers like `Prisma.DbNull`/`Prisma.JsonNull` needed for
  // Json-column null filtering. Kept here (not in the `export type` block) so
  // those helpers are usable without importing from the generated client.
  Prisma,
  AuditAction,
  Archetype,
  ChangemakerLevel,
  ProfileType,
  VerificationLevel,
  Visibility,
  ContactVisibility,
  LocationPrecision,
  Availability,
  SkillType,
  CommunityType,
  MembershipStatus,
  GovernanceType,
  CommunityRole,
  MemberStatus,
  ConnectionType,
  ConnectionStatus,
  ModerationStatus,
  EventType,
  EventCategory,
  CostType,
  EventStatus,
  EventRole,
  RsvpStatus,
  NotificationType,
  AppreciateType,
  ReportTarget,
  ReportStatus,
  ReportCategory,
  EntitySource,
  ClaimStatus,
  AvailabilityMode,
  ReflectionLevel,
  WorkContextScale,
  ProjectReflectionPhase,
  TagCategory,
  NetworkRole,
  DecisionMakingType,
  ResourceSharingType,
  SocialIntimacyType,
  CommunityPresenceType,
  CommunitySizeType,
  PostSource,
  PostVisibility,
  TrainingFormat,
  TrainingLevel,
  DeliveryMode,
  TrainingEngagementStatus,
  MentoringRelationshipStatus,
  PeerSupportConnectionStatus,
  CoachingEngagementStatus,
  ContributionType,
  ContributionConnectionStatus,
  CanvasNodeType,
  CanvasLinkType,
  CanvasStatus,
  PatternLibraryStatus,
  InterventionOutcome,
  InitiativeState,
  InitiativeRoleType,
  InitiativeType,
  CanvasVisibility,
  PageModule,
  VolunteerOpportunityStatus,
  VolunteerApplicationStatus,
  VolunteerFormat,
  CommitmentType,
  ImpactScale,
  TimePreference,
  UrgencyLevel,
  ExperienceLevel,
  PhysicalEffortLevel,
  IndoorOutdoor,
  SupervisionLevel,
  RiskLevel,
  RequesterType,
  AvailabilityVote,
  EnergySystemState,
  EnergyPrivacy,
  EnergyEntityType,
  EnergyScale,
  EntityVisibility,
  EnergyState,
  EnergyMagnitude,
  EnergyRate,
  InternalPower,
  VoiceAccess,
  BoundaryPermeability,
  SelfDetermination,
  PowerDistance,
  EnergyFlowType,
  InformationFlowType,
  RelationVisibility,
  RelationConsent,
  PatternConfidence,
  PatternStatus,
  BoardScope,
  InviteStatus,
  PitchStage,
  PitchStatus,
  SocialIssueCategory,
  StoryType,
  IssueScope,
  IssueSeverity,
  IssueStatus,
  CoachMeFocusTag,
  CoachMeEncryptionModel,
  SignalDomain,
  SignalScale,
  SignalConfidence,
  SignalNovelty,
  SignalSourceType,
  PatternTrajectory,
  SignalResonance,
  AccountDeletionReason,
  AnnouncementType,
  PendingRegistrationMode,
  FeedbackStatus,
  FeedbackType,
  FeedAnnotationSource,
  FeedReactionType,
  IdeaPostType,
  IdeaPostStatus,
} from '../generated/prisma';
// eslint-disable-next-line no-restricted-imports
export type {
  User,
  UserSkill,
  UserValue,
  CoachMeSession,
  CoachMeConsent,
  CoachMeSupportResource,
  SystemKillSwitch,
  ExperimentalFeature,
  RadioStation,
  Quote,
} from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { shouldSuppressPrismaErrorLogForBuild } from './prisma-build-env';

const prismaClientSingleton = () => {
    const isProd = process.env.NODE_ENV === 'production'
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error('DATABASE_URL is not set in environment variables');
    }

    const suppressPrismaErrorLog = shouldSuppressPrismaErrorLogForBuild(connectionString);

    const pool = new Pool({
        connectionString,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
        ...(isProd && {
            max: 10,
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 5_000,
        }),
        // Dev-mode: keep one warm connection so the first query doesn't
        // cold-start the pool and trigger the 5s withTimeout fallback
        ...(!isProd && {
            min: 1,
            idleTimeoutMillis: 60_000,
            connectionTimeoutMillis: 20_000,
        }),
    });

    pool.on('error', (err) => {
        console.error('[prisma:pool] Unexpected error on idle database client:', err.message);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adapter = new PrismaPg(pool as any);

    let prismaLog: ('error' | 'warn')[];
    if (suppressPrismaErrorLog) {
        prismaLog = [];
    } else if (isProd) {
        prismaLog = ['error'];
    } else {
        prismaLog = ['error', 'warn'];
    }

    return new PrismaClient({
        adapter,
        log: prismaLog,
    });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export { prisma };
export default prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

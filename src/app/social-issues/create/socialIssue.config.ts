import type { SocialIssueCategory, IssueScope, IssueSeverity } from '@/types/social-issue';

export interface SocialIssueFormInitialData {
	title: string;
	description?: string;
	category: SocialIssueCategory | '';
	severity: IssueSeverity;
	scope: IssueScope | '';
	isLocalizable: boolean;
	locationName?: string;
	latitude?: number;
	longitude?: number;
	relatedRdgs: number[];
	leanWastes: string[];
	harmTypes: string[];
	sources: string[];
	tags: string[];
}

export const LEAN_8_WASTES = [
	'TRANSPORTATION',
	'INVENTORY',
	'MOTION',
	'WAITING',
	'OVERPRODUCTION',
	'OVERPROCESSING',
	'DEFECTS',
	'SKILLS',
] as const;

export const HARM_TYPE_GROUPS: readonly { id: string; items: readonly string[] }[] = [
	{
		id: 'air',
		items: [
			'HARM_AIR_PARTICULATE', 'HARM_AIR_NOX', 'HARM_AIR_SOX', 'HARM_AIR_VOC',
			'HARM_AIR_HEAVY_METALS', 'HARM_AIR_CO', 'HARM_AIR_GHG', 'HARM_AIR_OZONE',
		],
	},
	{
		id: 'water',
		items: [
			'HARM_WATER_EFFLUENT', 'HARM_WATER_RUNOFF', 'HARM_WATER_HEAVY_METALS',
			'HARM_WATER_MICROPLASTICS', 'HARM_WATER_PHARMA', 'HARM_WATER_OIL',
			'HARM_WATER_THERMAL', 'HARM_WATER_SEWAGE', 'HARM_WATER_EUTROPHICATION',
		],
	},
	{
		id: 'soil',
		items: [
			'HARM_SOIL_HEAVY_METALS', 'HARM_SOIL_PESTICIDES', 'HARM_SOIL_POPS',
			'HARM_SOIL_PETROLEUM', 'HARM_SOIL_RADIOACTIVE', 'HARM_SOIL_EROSION',
		],
	},
	{
		id: 'noise',
		items: [
			'HARM_NOISE_INDUSTRIAL', 'HARM_NOISE_TRAFFIC', 'HARM_NOISE_CONSTRUCTION',
			'HARM_NOISE_AIRCRAFT', 'HARM_VIBRATION',
		],
	},
	{
		id: 'light',
		items: ['HARM_LIGHT_POLLUTION', 'HARM_RADIATION_EMF', 'HARM_RADIATION_NUCLEAR'],
	},
	{
		id: 'ecology',
		items: [
			'HARM_ECO_DEFORESTATION', 'HARM_ECO_BIODIVERSITY', 'HARM_ECO_WETLANDS',
			'HARM_ECO_MICROBIOME',
		],
	},
	{
		id: 'health',
		items: [
			'HARM_HEALTH_OCCUPATIONAL', 'HARM_HEALTH_COMMUNITY',
			'HARM_SOCIAL_DISPLACEMENT', 'HARM_SOCIAL_CULTURAL',
		],
	},
	{
		id: 'waste',
		items: [
			'HARM_WASTE_SOLID', 'HARM_WASTE_HAZARDOUS', 'HARM_WASTE_EWASTE',
			'HARM_WASTE_PLASTIC', 'HARM_WASTE_NUCLEAR',
		],
	},
] as const;

export const RDG_OPTIONS = Array.from({ length: 30 }, (_, i) => i + 1);

export const SCOPE_OPTIONS: IssueScope[] = ['LOCAL', 'BIOREGIONAL', 'NATIONAL', 'GLOBAL', 'SYSTEMIC'];

export const CATEGORIES: SocialIssueCategory[] = [
	'ENVIRONMENTAL',
	'GOVERNANCE',
	'MEDIA',
	'EDUCATION',
	'ECONOMIC',
	'SOCIAL',
	'INFRASTRUCTURE',
	'HEALTH',
	'OTHER',
];

export const SEVERITY_LEVELS: IssueSeverity[] = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

export const SEVERITY_COLORS: Record<IssueSeverity, string> = {
	LOW: 'bg-green-100 border-green-400 text-green-800',
	MODERATE: 'bg-yellow-100 border-yellow-400 text-yellow-800',
	HIGH: 'bg-orange-100 border-orange-400 text-orange-800',
	CRITICAL: 'bg-red-100 border-red-500 text-red-800',
};

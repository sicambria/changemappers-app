import translationsHu from '../../../../docs/data/hu/metamodels.json';
import translationsEs from '../../../../docs/data/es/metamodels.json';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------
export interface Metamodel {
    id: number;
    name: string;
    slug: string;
    category: string;
    origin: string;
    originYear: number | null;
    originTradition: string;
    region: string;
    author: string;
    coreMechanism: string;
    nativeScale: string[];
    applicability: string;
    limitations: string;
    critics: string;
    changemakerUse: string;
    pairsWith: string[];
    domains: string[];
    tags: string[];
    keyQuote: string;
    applicableFor: string[];
}

// --------------------------------------------------------------------------
// Category color map (keys are English data values — do not translate)
// --------------------------------------------------------------------------
export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    'Cosmic and Planetary Scale': {
        bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500'
    },
    'Civilizational and Societal Scale': {
        bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500'
    },
    'Ecological and Socio-Ecological Scale': {
        bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500'
    },
    'Organizational and Group Scale': {
        bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500'
    },
    'Cross-Scale and Trans-Systemic': {
        bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500'
    },
};

// Maps English data category values → translation key slugs
export const CATEGORY_SLUG: Record<string, string> = {
    'Cosmic and Planetary Scale': 'cosmic',
    'Civilizational and Societal Scale': 'civilizational',
    'Ecological and Socio-Ecological Scale': 'ecological',
    'Organizational and Group Scale': 'organizational',
    'Cross-Scale and Trans-Systemic': 'crossScale',
};

export function getCategoryColors(category: string) {
    return CATEGORY_COLORS[category] ?? { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-400' };
}

// --------------------------------------------------------------------------
// Locale-aware content merging
// --------------------------------------------------------------------------
type MetamodelTranslation = { id: number; coreMechanism: string; applicability: string; limitations: string; critics: string; changemakerUse: string; keyQuote: string };

export const HU_MAP = new Map<number, MetamodelTranslation>((translationsHu as MetamodelTranslation[]).map((t) => [t.id, t]));
export const ES_MAP = new Map<number, MetamodelTranslation>((translationsEs as MetamodelTranslation[]).map((t) => [t.id, t]));

export function getLocalizedModel(model: Metamodel, lang: string): Metamodel {
    let map: Map<number, MetamodelTranslation> | null;
    if (lang === 'hu') { map = HU_MAP; }
    else if (lang === 'es') { map = ES_MAP; }
    else { map = null; }
    if (!map) return model;
    const overlay = map.get(model.id);
    return overlay ? { ...model, ...overlay } : model;
}

import { RDG_GOALS, formatRdgLabel } from '@/lib/taxonomy';

export const BASE_ARCHETYPES = [
  { value: 'LOCAL_PRACTITIONER', label: 'Local Practitioner', labelHu: 'Helyi Gyakorló' },
  { value: 'NETWORK_WEAVER', label: 'Network Weaver', labelHu: 'Hálózat Szövő' },
  { value: 'INSTITUTIONAL_CHANGEMAKER', label: 'Institutional Changemaker', labelHu: 'Intézményes Változtató' },
  { value: 'GLOBAL_AMPLIFIER', label: 'Global Amplifier', labelHu: 'Globális Erősítő' },
  { value: 'RESOURCE_MOBILIZER', label: 'Resource Mobilizer', labelHu: 'Erőforrás Mozgósító' },
  { value: 'INNOVATION_CATALYST', label: 'Innovation Catalyst', labelHu: 'Innovációs Katalizátor' },
  { value: 'SYSTEM_DISRUPTOR', label: 'System Disruptor', labelHu: 'Rendszer Megzavaró' },
  { value: 'STRATEGIC_ADVISOR', label: 'Strategic Advisor', labelHu: 'Stratégiai Tanácsadó' },
] as const;

export const EXTRA_ARCHETYPES = [
  { value: 'MYCELIUM', label: 'Mycelium', labelHu: 'Micélium' },
  { value: 'KEYSTONE', label: 'Keystone', labelHu: 'Zárkő' },
  { value: 'POLLINATOR', label: 'Pollinator', labelHu: 'Beporzó' },
  { value: 'PRISM', label: 'Prism', labelHu: 'Prizma' },
  { value: 'COMPOST', label: 'Compost', labelHu: 'Komposzt' },
  { value: 'SENTINEL', label: 'Sentinel', labelHu: 'Őrszem' },
  { value: 'ALCHEMIST', label: 'Alchemist', labelHu: 'Alkímista' },
  { value: 'CANOPY', label: 'Canopy', labelHu: 'Korona' },
  { value: 'SPARK', label: 'Spark', labelHu: 'Szikra' },
  { value: 'ECHO', label: 'Echo', labelHu: 'Visszhang' },
  { value: 'TIDE', label: 'Tide', labelHu: 'Árapály' },
  { value: 'HORIZON', label: 'Horizon', labelHu: 'Horizont' },
] as const;

export const ALL_ARCHETYPES = [...BASE_ARCHETYPES, ...EXTRA_ARCHETYPES];

export const RDG_OPTIONS = RDG_GOALS.map((goal) => ({
  value: goal.id,
  label: formatRdgLabel(goal.id),
  labelHu: formatRdgLabel(goal.id),
})) as readonly { value: string; label: string; labelHu: string }[];

export const SKILLS_OPTIONS = [
  'facilitation',
  'projectmanagement',
  'permaculture',
  'coding',
  'cooking',
  'design',
  'marketing',
  'mentoring',
  'translation',
  'eventplanning',
  'writing',
  'research',
  'fundraising',
  'communication',
  'leadership',
] as const;

export const OFFERS_OPTIONS = [
  'mentoring',
  'space',
  'tools',
  'time',
  'transport',
  'facilitation',
  'coding',
  'cooking',
  'design',
  'marketing',
  'translation',
  'eventplanning',
  'funding',
  'networking',
  'training',
] as const;

export const NEEDS_OPTIONS = [
  'connections',
  'support',
  'community',
  'advice',
  'funding',
  'partners',
  'mentoring',
  'space',
  'volunteers',
  'visibility',
  'coFounders',
] as const;

export const VALUES_OPTIONS = [
  'sustainability',
  'community',
  'socialjustice',
  'spirituality',
  'pragmatism',
  'localfirst',
  'arts',
  'neurodiversity',
  'techoriented',
  'parenting',
  'regenerative',
  'solidarity',
  'transparency',
  'ecology',
] as const;

export const DAYS = [
  { key: 'H', label: 'Mon', full: 'Monday', labelHu: 'H', fullHu: 'Hétfő', labelEs: 'Lun', fullEs: 'Lunes' },
  { key: 'K', label: 'Tue', full: 'Tuesday', labelHu: 'K', fullHu: 'Kedd', labelEs: 'Mar', fullEs: 'Martes' },
  { key: 'Sze', label: 'Wed', full: 'Wednesday', labelHu: 'Sze', fullHu: 'Szerda', labelEs: 'Mié', fullEs: 'Miércoles' },
  { key: 'Cs', label: 'Thu', full: 'Thursday', labelHu: 'Cs', fullHu: 'Csütörtök', labelEs: 'Jue', fullEs: 'Jueves' },
  { key: 'P', label: 'Fri', full: 'Friday', labelHu: 'P', fullHu: 'Péntek', labelEs: 'Vie', fullEs: 'Viernes' },
  { key: 'Szo', label: 'Sat', full: 'Saturday', labelHu: 'Szo', fullHu: 'Szombat', labelEs: 'Sáb', fullEs: 'Sábado' },
  { key: 'V', label: 'Sun', full: 'Sunday', labelHu: 'V', fullHu: 'Vasárnap', labelEs: 'Dom', fullEs: 'Domingo' },
] as const;

export const TIME_SLOTS = [
  { key: 'reggel', label: 'Morning', labelHu: 'Reggel', labelEs: 'Mañana', sub: '8-10' },
  { key: 'de', label: 'Late morning', labelHu: 'Délelőtt', labelEs: 'Media mañana', sub: '10-12' },
  { key: 'kora_du', label: 'Early afternoon', labelHu: 'Kora du.', labelEs: 'Primera tarde', sub: '12-15' },
  { key: 'keso_du', label: 'Late afternoon', labelHu: 'Késő du.', labelEs: 'Tarde', sub: '15-18' },
  { key: 'este', label: 'Evening', labelHu: 'Este', labelEs: 'Noche', sub: '18-20' },
] as const;

export const AVAILABILITY_OPTIONS = DAYS.flatMap(day =>
  TIME_SLOTS.map(slot => ({
    value: `${day.key}-${slot.key}`,
    label: `${day.full} ${slot.label}`,
    labelHu: `${day.fullHu} ${slot.labelHu}`,
    labelEs: `${day.fullEs} ${slot.labelEs}`,
    day: day.key,
    slot: slot.key,
  }))
);

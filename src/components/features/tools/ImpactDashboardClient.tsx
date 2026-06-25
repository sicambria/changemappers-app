'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface SliderFactor {
    id: string;
    label: string;
    max: number;
    defaultValue: number;
    tooltip: { title: string; description: string; exampleHigh: string; exampleLow: string };
}

interface CardGroup {
    id: string;
    title: string;
    groups: { heading: string; factors: SliderFactor[] }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Factor definitions (extracted from the HTML prototype)
// ─────────────────────────────────────────────────────────────────────────────

const FACTOR_META: Record<string, { name: string; group: string }> = {
    I_t: { name: 'Information Integration', group: 'Core' },
    K_t: { name: 'Network Strength', group: 'Core' },
    F_t: { name: 'Resource Mobilization', group: 'Core' },
    A_t: { name: 'Adaptation Capacity', group: 'Core' },
    P_t: { name: 'Healthy Power Dynamics', group: 'Structural' },
    B_t: { name: 'Empowering Belief System', group: 'Psycho-Social' },
    G_t: { name: 'Inter-generational Synergy', group: 'Psycho-Social' },
    I_sect_t: { name: 'Inclusion & Intersectionality', group: 'Psycho-Social' },
    NC_t: { name: 'Narrative Coherence', group: 'Narrative' },
    CA_t: { name: 'Collaboration Architecture', group: 'Narrative' },
    CN_t: { name: 'Conflict Navigation Capacity', group: 'Narrative' },
    KE_t: { name: 'Creative Emergence', group: 'Emergence' },
    EQ_t: { name: 'Energetic Quality', group: 'Emergence' },
    S_body_t: { name: 'Somatic (Embodied) Capacity', group: 'Emergence' },
    SP_t: { name: 'Spiritual & Purpose Dimension', group: 'Emergence' },
    CD_t: { name: 'Cognitive Diversity', group: 'Emergence' },
};

const CARDS: CardGroup[] = [
    {
        id: 'core',
        title: 'Core Capacities',
        groups: [
            {
                heading: 'Fundamental Factors',
                factors: [
                    { id: 'I_t', label: 'Information Integration', max: 100, defaultValue: 50, tooltip: { title: 'Information Integration (I)', description: 'The ability to connect diverse types of knowledge, cross-sectoral insights, and varied expertise.', exampleHigh: 'The Human Genome Project — combined expertise from biology, genetics, computer science, and engineering globally.', exampleLow: 'Government departments that fail to share critical data, leading to inefficient responses (e.g., Hurricane Katrina).' } },
                    { id: 'K_t', label: 'Network Strength', max: 100, defaultValue: 50, tooltip: { title: 'Relationship Network Strength (K)', description: 'The level of trust, durability, depth, and density of connections within the network.', exampleHigh: 'The Civil Rights Movement activist network, built on years of deep trust within church and community organizations.', exampleLow: 'Occupy Wall Street — many people together but lacking deep, pre-existing trust networks.' } },
                ],
            },
            {
                heading: 'Mobilization & Adaptation',
                factors: [
                    { id: 'F_t', label: 'Resource Mobilization', max: 100, defaultValue: 50, tooltip: { title: 'Resource Mobilization (F)', description: 'The ability to gather and deploy financial resources, time, attention, knowledge, skills, and social capital.', exampleHigh: 'BLM 2020 — unprecedented mobilization of donations, volunteers, and social media attention globally.', exampleLow: 'Brilliant but underfunded startups or nonprofits that fail due to inability to secure capital or talent.' } },
                    { id: 'A_t', label: 'Adaptation Capacity', max: 100, defaultValue: 50, tooltip: { title: 'Adaptation Capacity (A)', description: 'The speed of learning, resilience in recovering from failures, and strategic flexibility to pivot when needed.', exampleHigh: 'Netflix — evolved from DVD rental to streaming to content production, constantly adapting.', exampleLow: "Kodak — failed to adapt to digital photography despite inventing the first digital camera." } },
                ],
            },
        ],
    },
    {
        id: 'structural',
        title: 'Structural Multipliers',
        groups: [
            {
                heading: 'Power Dynamics (P)',
                factors: [
                    { id: 'P_inclusive', label: 'Inclusive Decision-making', max: 100, defaultValue: 50, tooltip: { title: 'Inclusive Decision-Making', description: 'The degree to which decision-making processes are participatory and involve diverse stakeholders.', exampleHigh: 'Swiss direct democracy — citizens regularly vote on legislation.', exampleLow: 'Top-down, authoritarian decision-making in a traditional hierarchical corporation.' } },
                    { id: 'P_extractive', label: 'Extractive Structures', max: 100, defaultValue: 50, tooltip: { title: 'Strength of Extractive Structures', description: 'The power of systems that extract value from a community without equitable reinvestment.', exampleHigh: 'Colonial systems designed to extract natural resources and labor for the benefit of the colonizing country.', exampleLow: 'A local food cooperative where profits are reinvested in the community and local farms.' } },
                    { id: 'P_concentration', label: 'Power Concentration', max: 100, defaultValue: 50, tooltip: { title: 'Power Concentration', description: 'The degree to which power and influence are held by a small, unaccountable group.', exampleHigh: 'Concentration of media ownership in a few large conglomerates, influencing public narrative.', exampleLow: 'Open-source software development — influence distributed among many contributors based on merit.' } },
                    { id: 'P_accessibility', label: 'Equality of Access', max: 100, defaultValue: 50, tooltip: { title: 'Equality of Access', description: 'The fairness and equity in access to resources, opportunities, and decision-making platforms.', exampleHigh: 'The public library system — free access to information and resources for everyone.', exampleLow: 'Legacy admissions at elite universities — preferential access based on family connections.' } },
                ],
            },
        ],
    },
    {
        id: 'psychosocial',
        title: 'Psycho-Social Multipliers',
        groups: [
            {
                heading: 'Collective Belief System (B)',
                factors: [
                    { id: 'B_scarcity', label: 'Scarcity Mindset', max: 100, defaultValue: 50, tooltip: { title: 'Scarcity Mindset', description: 'The collective belief that there are not enough resources to go around, leading to zero-sum competition.', exampleHigh: 'Panic buying of toilet paper at the start of COVID-19, driven by fear of scarcity.', exampleLow: 'Gift economies like Burning Man, where sharing is a core principle.' } },
                    { id: 'B_powerless', label: 'Learned Helplessness', max: 100, defaultValue: 50, tooltip: { title: 'Belief in Powerlessness', description: "The shared belief that the community or individuals lack the agency to create meaningful change.", exampleHigh: "Voter apathy in populations that feel their vote doesn't matter.", exampleLow: "Barack Obama's 2008 \"Yes, we can\" campaign — fostered a strong sense of collective agency." } },
                    { id: 'B_system', label: 'System Immutability', max: 100, defaultValue: 50, tooltip: { title: 'Belief in System Immutability', description: 'The idea that the fundamental structures of society are fixed and cannot be changed.', exampleHigh: 'The long-held belief in the "divine right of kings" made monarchy seem unchangeable for centuries.', exampleLow: 'The fall of the Berlin Wall — shattered the belief that the division of Europe was permanent.' } },
                    { id: 'B_change_fear', label: 'Fear of Change', max: 100, defaultValue: 50, tooltip: { title: 'Collective Fear of Change', description: 'A widespread anxiety about the unknown consequences of change, leading to preference for the status quo.', exampleHigh: 'The Luddite movement — textile workers resisted new machinery due to fear of losing livelihoods.', exampleLow: 'Public enthusiasm for the Apollo program — collective embrace of a future-oriented change.' } },
                ],
            },
            {
                heading: 'Inter-group Dynamics',
                factors: [
                    { id: 'G_t', label: 'Inter-generational Dynamics', max: 100, defaultValue: 50, tooltip: { title: 'Inter-generational Dynamics (G)', description: 'The quality of connection, knowledge transfer, and collaboration between different age generations.', exampleHigh: 'The climate movement — youth activists work alongside veteran climate scientists and policy experts.', exampleLow: "Corporate environments where younger employees' digital skills and older employees' wisdom are both dismissed." } },
                    { id: 'I_sect_t', label: 'Intersectionality & Inclusion', max: 100, defaultValue: 50, tooltip: { title: 'Intersectionality Factor', description: 'The degree to which the system actively counteracts exclusion across multiple dimensions of identity.', exampleHigh: 'The Combahee River Collective — explicitly addressed intersection of racial, gender, and class oppression.', exampleLow: 'Early feminist waves that centered white, middle-class women while marginalizing others.' } },
                ],
            },
        ],
    },
    {
        id: 'narrative',
        title: 'Narrative & Communication',
        groups: [
            {
                heading: 'Narrative Coherence (NC)',
                factors: [
                    { id: 'story_coherence', label: 'Story Coherence', max: 10, defaultValue: 5, tooltip: { title: 'Story Coherence', description: "The unity and consistency of the community's origin story, purpose, and vision for the future.", exampleHigh: 'The American "origin story" of revolution and freedom — coherent narrative for centuries.', exampleLow: 'Occupy Wall Street — powerful slogan but lacked a coherent story about what it wanted to achieve.' } },
                    { id: 'identity_strength', label: 'Identity Strength', max: 10, defaultValue: 5, tooltip: { title: 'Collective Identity Strength', description: 'The strength of the shared sense of "we" — who we are as a collective.', exampleHigh: 'The collective identity of Trekkies — built around shared values of exploration and humanism.', exampleLow: 'A temporary, project-based team in a large corporation that disbands with little shared identity.' } },
                    { id: 'meaning_alignment', label: 'Meaning Alignment', max: 10, defaultValue: 5, tooltip: { title: 'Meaning Alignment', description: "The harmony between individual members' personal goals and the collective's purpose.", exampleHigh: "Apollo program scientists — personal ambitions perfectly aligned with the national goal of reaching the moon.", exampleLow: 'A political coalition aligned only on opposing a common enemy, collapsing after victory.' } },
                ],
            },
            {
                heading: 'Collaboration & Conflict',
                factors: [
                    { id: 'CA_t', label: 'Collaboration Architecture', max: 100, defaultValue: 50, tooltip: { title: 'Collaboration Architecture (CA)', description: 'The clarity of roles, transparency of decision-making, usability of tools, and effectiveness of feedback loops.', exampleHigh: 'The open-source development model of Linux — clear roles, transparent decision-making, effective feedback.', exampleLow: 'Large-scale disaster relief efforts suffering from poor coordination between agencies.' } },
                    { id: 'CN_t', label: 'Conflict Navigation', max: 100, defaultValue: 50, tooltip: { title: 'Conflict Navigation Capacity (CN)', description: 'The ability to engage with disagreements constructively, supported by psychological safety and mediation skills.', exampleHigh: "South Africa's Truth and Reconciliation Commission — structured process to navigate deep conflicts.", exampleLow: 'Infighting and factionalism that plagued many revolutionary groups, leading to collapse from within.' } },
                ],
            },
        ],
    },
    {
        id: 'emergence',
        title: 'Emergence & Energetics',
        groups: [
            {
                heading: 'Creative & Somatic Factors',
                factors: [
                    { id: 'KE_t', label: 'Creative Emergence', max: 100, defaultValue: 50, tooltip: { title: 'Creative Emergence (KE)', description: 'The rate of new ideas, "lucky" connections, cross-pollination of concepts, and a culture that supports experimentation.', exampleHigh: 'Silicon Valley in its heyday — high density of talent, frequent cross-pollination, VC culture encouraging experimentation.', exampleLow: 'A rigid, bureaucratic organization where new ideas are stifled by red tape and fear of failure.' } },
                    { id: 'EQ_t', label: 'Energetic Quality', max: 100, defaultValue: 50, tooltip: { title: 'Energetic Quality (EQ)', description: 'The collective "vibe" — vitality, safety, inspiration, and frequency of "flow" states, minus energy-draining factors.', exampleHigh: 'A deeply inspiring concert or well-facilitated collaborative workshop — people leave energized.', exampleLow: 'A toxic work environment characterized by burnout, infighting, and lack of psychological safety.' } },
                    { id: 'S_body_t', label: 'Somatic Capacity', max: 100, defaultValue: 50, tooltip: { title: "Somatic Capacity (S_body)", description: "The collective nervous system's ability to co-regulate, stay resilient under stress, and access embodied wisdom.", exampleHigh: 'Experienced first responders — remain calm and coordinated in a crisis.', exampleLow: 'A community experiencing collective panic in response to a crisis, leading to irrational behavior.' } },
                ],
            },
            {
                heading: 'Intangible Dimensions',
                factors: [
                    { id: 'SP_t', label: 'Spiritual Dimension', max: 100, defaultValue: 50, tooltip: { title: 'Spiritual/Transcendent Dimension (SP)', description: 'The capacity for meaning-making, a sense of higher purpose, and connection to larger systems, minus nihilism.', exampleHigh: 'The Civil Rights Movement — deeply rooted in the spiritual framework of the Black church.', exampleLow: 'A purely profit-driven corporate culture experiencing high turnover due to lack of meaning.' } },
                    { id: 'CD_t', label: 'Cognitive Diversity', max: 100, defaultValue: 50, tooltip: { title: 'Cognitive Diversity (CD)', description: 'The variety of thinking styles, neurodiversity, and cultural frameworks, and the ability to integrate them effectively.', exampleHigh: 'The Bletchley Park codebreakers — mathematicians, linguists, and crossword experts cracking the Enigma code.', exampleLow: "NASA's Challenger disaster — groupthink prevented critical safety concerns from being addressed." } },
                ],
            },
        ],
    },
    {
        id: 'negative',
        title: 'Negative & External Factors',
        groups: [
            {
                heading: 'Internal Negative Factors',
                factors: [
                    { id: 'S_t', label: 'System Entropy', max: 100, defaultValue: 50, tooltip: { title: 'System Entropy (S)', description: 'The natural tendency towards disorder, including communication noise, loss of motivation, fragmentation, and coordination costs.', exampleHigh: 'A large volunteer organization that becomes bogged down in bureaucracy and internal disagreements.', exampleLow: 'A small, highly-focused startup team — seamless communication, aligned on the mission.' } },
                    { id: 'T_t', label: 'Collective Trauma', max: 100, defaultValue: 50, tooltip: { title: 'Collective Trauma Load (T)', description: "The weight of historical, recent, and intergenerational trauma that impacts the system's functioning.", exampleHigh: 'The ongoing impact of slavery and systemic racism on African American communities.', exampleLow: 'A recently formed community with no major shared trauma to process.' } },
                ],
            },
            {
                heading: 'External Factors',
                factors: [
                    { id: 'E_t', label: 'Environmental Shocks', max: 100, defaultValue: 0, tooltip: { title: 'External Environmental Shocks (E)', description: 'The impact of external events like political changes, economic crises, technological disruptions, or natural disasters.', exampleHigh: 'The 2008 financial crisis — abruptly halted many social and business initiatives.', exampleLow: 'A period of stable, predictable political and economic conditions.' } },
                    { id: 'R_t', label: 'Stochastic Resonance', max: 100, defaultValue: 0, tooltip: { title: 'Stochastic Resonance (R)', description: 'The presence of "constructive noise" or random, synchronistic events that can amplify a small signal into large-scale change.', exampleHigh: "Mohamed Bouazizi's self-immolation sparked the entire Arab Spring — a random event amplified by social tension.", exampleLow: 'Nothing unexpected — a predictable, stable context.' } },
                ],
            },
        ],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip component
// ─────────────────────────────────────────────────────────────────────────────

function TooltipInfo({ tooltip }: Readonly<{ tooltip: SliderFactor['tooltip'] }>) {
  const { t } = useTranslation('tools');
  const [open, setOpen] = useState(false);

    return (
        <div // NOSONAR(S6848) — supplementary hover affordance; the content/action is independently keyboard-reachable via an explicit control or focusable child
          className="relative inline-block ml-1.5" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
            <button
                type="button"
                className="text-xs text-slate-600 hover:text-emerald-700 border border-slate-400 hover:border-emerald-600 dark:text-gray-500 dark:hover:text-emerald-400 dark:border-gray-600 dark:hover:border-emerald-400 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors"
                aria-label="Info"
            >
                ?
            </button>
            {open && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-80 bg-gray-900 border border-white/15 rounded-xl shadow-2xl p-4 text-left pointer-events-none">
                    <h4 className="text-sm font-bold text-white mb-2 border-b border-white/10 pb-2">{tooltip.title}</h4>
                    <p className="text-xs text-gray-300 mb-3 leading-relaxed">{tooltip.description}</p>
      <p className="text-xs text-emerald-400 font-semibold mb-1">{t('impactDashboard.highExample')}</p>
      <p className="text-xs text-gray-400 mb-2 leading-relaxed">{tooltip.exampleHigh}</p>
      <p className="text-xs text-red-400 font-semibold mb-1">{t('impactDashboard.lowExample')}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{tooltip.exampleLow}</p>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Slider row
// ─────────────────────────────────────────────────────────────────────────────

function SliderRow({ factor, value, onChange }: Readonly<{ factor: SliderFactor; value: number; onChange: (id: string, v: number) => void }>) {
    return (
        <div className="py-2">
            <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center min-w-0">
                    <span className="text-xs text-slate-700 dark:text-gray-300 leading-tight truncate">{factor.label}</span>
                    <TooltipInfo tooltip={factor.tooltip} />
                </div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 shrink-0">{value}</span>
            </div>
            <input
                type="range"
                id={factor.id}
                min={0}
                max={factor.max}
                value={value}
                onChange={(e) => onChange(factor.id, Number(e.target.value))}
                className="w-full h-1.5 appearance-none bg-slate-200 dark:bg-gray-700 rounded-full accent-emerald-600 dark:accent-emerald-500 cursor-pointer"
            />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Calculation logic
// ─────────────────────────────────────────────────────────────────────────────

function calculate(values: Record<string, number>): { probability: number; computed: Record<string, number> } {
    const v = values;

    const P_t = Math.min(
        (v.P_inclusive / (v.P_extractive + 1)) * (1 - v.P_concentration / 100) * (v.P_accessibility / 100),
        2
    );

    const B_t_avg_neg = (v.B_scarcity + v.B_powerless + v.B_system + v.B_change_fear) / 400;
    const B_t = 1 - Math.pow(B_t_avg_neg, 2);

    const narrative_fragmentation = Math.max(0, 100 - ((v.story_coherence + v.identity_strength) * 5));
    const NC_t_raw = (v.story_coherence * v.identity_strength * v.meaning_alignment) / (narrative_fragmentation + 1);
    const NC_t = NC_t_raw / 10;

    const NL = (x: number) => {
        if (x <= 0) return 0;
        return 100 / (1 + Math.exp(-0.06 * (x - 50)));
    };

    const term1_nl = NL(Math.sqrt(v.I_t * v.K_t));
    const term2_nl = NL(Math.sqrt(v.F_t * v.A_t));

    const mult1 = (P_t + B_t + v.G_t / 100 + v.I_sect_t / 100 + v.S_body_t / 100 + v.SP_t / 100 + v.CD_t / 100) / 7;
    const mult2 = (v.CA_t / 100 + v.CN_t / 100 + v.KE_t / 100 + v.EQ_t / 100) / 4;

    const positive_force = (term1_nl * mult1 * (1 + NC_t / 100)) + (term2_nl * mult2);
    const negative_force = 1.5 * (v.S_t + v.T_t);
    const external_force = (1 * v.E_t) + (1.2 * v.R_t);

    const dC_dt = positive_force - negative_force + external_force;
    const probability = Math.max(0, Math.min(100, Math.round(100 * (dC_dt + 300) / 600)));

    const computed: Record<string, number> = {
        I_t: v.I_t, K_t: v.K_t, F_t: v.F_t, A_t: v.A_t,
        P_t: P_t * 50, B_t: B_t * 100,
        G_t: v.G_t, I_sect_t: v.I_sect_t,
        NC_t, CA_t: v.CA_t, CN_t: v.CN_t,
        KE_t: v.KE_t, EQ_t: v.EQ_t, S_body_t: v.S_body_t, SP_t: v.SP_t, CD_t: v.CD_t,
    };

    return { probability, computed };
}

function getProbabilityLabel(p: number): string {
    if (p < 20) return 'High Risk of Stagnation';
    if (p < 40) return 'Nascent Potential';
    if (p < 60) return 'Moderate Potential';
    if (p < 80) return 'Strong Potential';
    return 'High Probability of Breakthrough';
}

function getProbabilityColor(p: number): string {
    if (p < 20) return 'text-red-700 dark:text-red-400';
    if (p < 40) return 'text-orange-700 dark:text-orange-400';
    if (p < 60) return 'text-amber-700 dark:text-amber-400';
    if (p < 80) return 'text-emerald-700 dark:text-emerald-400';
    return 'text-teal-700 dark:text-teal-300';
}

// ─────────────────────────────────────────────────────────────────────────────
// Default values
// ─────────────────────────────────────────────────────────────────────────────

function buildDefaults(): Record<string, number> {
    const defaults: Record<string, number> = {};
    for (const card of CARDS) {
        for (const group of card.groups) {
            for (const factor of group.factors) {
                defaults[factor.id] = factor.defaultValue;
            }
        }
    }
    return defaults;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function ImpactDashboardClient() {
  const { t } = useTranslation('tools');
  const [values, setValues] = useState<Record<string, number>>(buildDefaults);

    const handleChange = useCallback((id: string, v: number) => {
        setValues((prev) => ({ ...prev, [id]: v }));
    }, []);

    const { probability, computed } = useMemo(() => calculate(values), [values]);

    const sortedFactors = useMemo(
        () => Object.entries(computed).sort(([, a], [, b]) => b - a),
        [computed]
    );
    const strengths = sortedFactors.slice(0, 3);
    const bottlenecks = sortedFactors.slice(-3).reverse();

    const probColor = getProbabilityColor(probability);
    const probLabel = getProbabilityLabel(probability);

    // gauge arc
    const gaugeAngle = (probability / 100) * 180;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-gray-950 dark:text-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-b border-slate-200 dark:from-violet-950 dark:via-gray-900 dark:to-gray-950 dark:border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-slate-950 dark:text-white mb-2">{t('impactDashboard.clientTitle')}</h1>
        <p className="text-slate-700 dark:text-gray-300 max-w-2xl">
          {t('impactDashboard.clientDescription')}
        </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col xl:flex-row gap-8">
                    {/* Left — sliders */}
                    <div className="flex-1 min-w-0 grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {CARDS.map((card) => (
                            <div
                                key={card.id}
                                className="bg-white border border-slate-200 shadow-sm dark:bg-gray-900/70 dark:border-white/8 rounded-2xl p-5 flex flex-col gap-4"
                            >
                                <h2 className="text-base font-bold text-slate-950 dark:text-white border-b border-slate-200 dark:border-white/10 pb-3">{card.title}</h2>
                                {card.groups.map((group) => (
                                    <div key={group.heading}>
                                        <h3 className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-widest mb-2">{group.heading}</h3>
                                        {group.factors.map((factor) => (
                                            <SliderRow
                                                key={factor.id}
                                                factor={factor}
                                                value={values[factor.id] ?? factor.defaultValue}
                                                onChange={handleChange}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Right — results */}
                    <div className="xl:w-80 xl:shrink-0">
                        <div className="xl:sticky xl:top-24 flex flex-col gap-5">
                            {/* Score card */}
                            <div className="bg-white border border-slate-200 shadow-sm dark:bg-gray-900/70 dark:border-white/8 rounded-2xl p-6 text-center">
                                <h2 className="text-sm font-bold text-slate-600 dark:text-gray-400 uppercase tracking-widest mb-4">{t('impactDashboard.probabilityOfPositiveImpact')}</h2>

                                {/* Semi-circle gauge */}
                                <div className="relative mx-auto mb-4" style={{ width: 180, height: 100 }}>
                                    <svg width="180" height="100" viewBox="0 0 180 100">
                                        {/* track */}
                                        <path d="M 10 90 A 80 80 0 0 1 170 90" fill="none" stroke="#1f2937" strokeWidth="12" strokeLinecap="round" />
                                        {/* filled arc — rotate from left */}
                                        <path
                                            d="M 10 90 A 80 80 0 0 1 170 90"
                                            fill="none"
                                            stroke="url(#gaugeGrad)"
                                            strokeWidth="12"
                                            strokeLinecap="round"
                                            strokeDasharray={`${(gaugeAngle / 180) * 251.3} 251.3`}
                                        />
                                        <defs>
                                            <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#ef4444" />
                                                <stop offset="50%" stopColor="#f59e0b" />
                                                <stop offset="100%" stopColor="#10b981" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute bottom-0 left-0 right-0 text-center">
                                        <span className={`text-5xl font-black leading-none ${probColor}`}>{probability}</span>
                                        <span className="text-slate-500 dark:text-gray-400 text-lg">%</span>
                                    </div>
                                </div>

                                <p className={`text-sm font-semibold ${probColor}`}>{probLabel}</p>
                            </div>

                            {/* Recommendations */}
                            <div className="bg-white border border-slate-200 shadow-sm dark:bg-gray-900/70 dark:border-white/8 rounded-2xl p-5 flex flex-col gap-4">
                                <h2 className="text-sm font-bold text-slate-600 dark:text-gray-400 uppercase tracking-widest">{t('impactDashboard.recommendations')}</h2>

                                <div>
                                    <h4 className="text-xs font-semibold text-emerald-400 mb-2">{t('impactDashboard.strengthsToBuildOn')}</h4>
                                    <ul className="space-y-2">
                                        {strengths.map(([key]) => (
                                            <li key={key} className="bg-emerald-500/10 border-l-4 border-emerald-500 rounded-r-lg px-3 py-2 text-xs text-slate-700 dark:text-gray-300 leading-relaxed">
                <span className="font-semibold text-emerald-400">{FACTOR_META[key]?.name ?? key}:</span>{' '}
                {t('impactDashboard.strengthDescription')}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="text-xs font-semibold text-red-400 mb-2">{t('impactDashboard.bottlenecksToAddress')}</h4>
                                    <ul className="space-y-2">
                                        {bottlenecks.map(([key]) => (
                                            <li key={key} className="bg-red-500/10 border-l-4 border-red-500 rounded-r-lg px-3 py-2 text-xs text-slate-700 dark:text-gray-300 leading-relaxed">
                <span className="font-semibold text-red-400">{FACTOR_META[key]?.name ?? key}:</span>{' '}
                {t('impactDashboard.bottleneckDescription')}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Reset */}
                            <button
                                onClick={() => setValues(buildDefaults())}
                                className="text-sm text-slate-600 hover:text-slate-950 transition-colors border border-slate-300 hover:border-slate-400 rounded-lg py-2 dark:text-gray-500 dark:hover:text-white dark:border-white/10 dark:hover:border-white/20"
                            >
                                {t('impactDashboard.resetAllSliders')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

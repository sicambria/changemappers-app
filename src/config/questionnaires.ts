// Configuration for dynamic questionnaires/tests

export type ScoringStrategy = 'SUM_POINTS' | 'COUNT_TAGS' | 'DIRECT_SELECTION';

export interface QuestionnaireOption {
    id?: string;
    text: string;
    points?: number; // For SUM_POINTS (e.g. Changemaker Level)
    tags?: string[]; // For COUNT_TAGS (e.g. Archetypes)
    value?: string;  // For DIRECT_SELECTION (e.g. RDG)
}

export interface QuestionnaireQuestion {
    id: string;
    text: string;
    options: QuestionnaireOption[];
    maxSelectable?: number; // Optional: Defaults to 1. If > 1, renders as checkboxes.
}

export interface QuestionnaireConfig {
    id: string;
    titleKey: string; // Used for translation key or display text
    descriptionKey?: string;
    questions: QuestionnaireQuestion[];
    scoringStrategy: ScoringStrategy;
    maxTotalSelections?: number; // E.g., for restricting overall selections across a test
}

// ---------------------------------------------------------
// 1. CHANGEMAKER LEVEL TEST (SUM_POINTS)
// ---------------------------------------------------------
export const changemakerLevelTest: QuestionnaireConfig = {
    id: 'changemakerLevel',
    titleKey: 'questionnaires:changemakerLevel.title',
    scoringStrategy: 'SUM_POINTS',
    questions: [
        {
            id: 'q1',
            text: 'questionnaires:changemakerLevel.q1.text',
            options: [
                { text: 'questionnaires:changemakerLevel.q1.opt0', points: 0 },
                { text: 'questionnaires:changemakerLevel.q1.opt1', points: 1 },
                { text: 'questionnaires:changemakerLevel.q1.opt2', points: 2 },
                { text: 'questionnaires:changemakerLevel.q1.opt3', points: 3 },
            ]
        },
        {
            id: 'q2',
            text: 'questionnaires:changemakerLevel.q2.text',
            options: [
                { text: 'questionnaires:changemakerLevel.q2.opt0', points: 0 },
                { text: 'questionnaires:changemakerLevel.q2.opt1', points: 1 },
                { text: 'questionnaires:changemakerLevel.q2.opt2', points: 2 },
                { text: 'questionnaires:changemakerLevel.q2.opt3', points: 3 },
            ]
        },
        {
            id: 'q3',
            text: 'questionnaires:changemakerLevel.q3.text',
            options: [
                { text: 'questionnaires:changemakerLevel.q3.opt0', points: 0 },
                { text: 'questionnaires:changemakerLevel.q3.opt1', points: 1 },
                { text: 'questionnaires:changemakerLevel.q3.opt2', points: 2 },
                { text: 'questionnaires:changemakerLevel.q3.opt3', points: 3 },
            ]
        },
        {
            id: 'q4',
            text: 'questionnaires:changemakerLevel.q4.text',
            options: [
                { text: 'questionnaires:changemakerLevel.q4.opt0', points: 0 },
                { text: 'questionnaires:changemakerLevel.q4.opt1', points: 1 },
                { text: 'questionnaires:changemakerLevel.q4.opt2', points: 2 },
                { text: 'questionnaires:changemakerLevel.q4.opt3', points: 3 },
            ]
        },
        {
            id: 'q5',
            text: 'questionnaires:changemakerLevel.q5.text',
            options: [
                { text: 'questionnaires:changemakerLevel.q5.opt0', points: 0 },
                { text: 'questionnaires:changemakerLevel.q5.opt1', points: 1 },
                { text: 'questionnaires:changemakerLevel.q5.opt2', points: 2 },
                { text: 'questionnaires:changemakerLevel.q5.opt3', points: 3 },
            ]
        },
        {
            id: 'q6',
            text: 'questionnaires:changemakerLevel.q6.text',
            options: [
                { text: 'questionnaires:changemakerLevel.q6.opt0', points: 0 },
                { text: 'questionnaires:changemakerLevel.q6.opt1', points: 1 },
                { text: 'questionnaires:changemakerLevel.q6.opt2', points: 2 },
                { text: 'questionnaires:changemakerLevel.q6.opt3', points: 3 },
            ]
        },
        {
            id: 'q7',
            text: 'questionnaires:changemakerLevel.q7.text',
            options: [
                { text: 'questionnaires:changemakerLevel.q7.opt0', points: 0 },
                { text: 'questionnaires:changemakerLevel.q7.opt1', points: 1 },
                { text: 'questionnaires:changemakerLevel.q7.opt2', points: 2 },
                { text: 'questionnaires:changemakerLevel.q7.opt3', points: 3 },
            ]
        },
        {
            id: 'q8',
            text: 'questionnaires:changemakerLevel.q8.text',
            options: [
                { text: 'questionnaires:changemakerLevel.q8.opt0', points: 0 },
                { text: 'questionnaires:changemakerLevel.q8.opt1', points: 1 },
                { text: 'questionnaires:changemakerLevel.q8.opt2', points: 2 },
                { text: 'questionnaires:changemakerLevel.q8.opt3', points: 3 },
            ]
        },
        {
            id: 'q9',
            text: 'questionnaires:changemakerLevel.q9.text',
            options: [
                { text: 'questionnaires:changemakerLevel.q9.opt0', points: 0 },
                { text: 'questionnaires:changemakerLevel.q9.opt1', points: 1 },
                { text: 'questionnaires:changemakerLevel.q9.opt2', points: 2 },
                { text: 'questionnaires:changemakerLevel.q9.opt3', points: 3 },
            ]
        },
        {
            id: 'q10',
            text: 'questionnaires:changemakerLevel.q10.text',
            options: [
                { text: 'questionnaires:changemakerLevel.q10.opt0', points: 0 },
                { text: 'questionnaires:changemakerLevel.q10.opt1', points: 1 },
                { text: 'questionnaires:changemakerLevel.q10.opt2', points: 2 },
                { text: 'questionnaires:changemakerLevel.q10.opt3', points: 3 },
            ]
        }
    ]
};


// ---------------------------------------------------------
// 2. ARCHETYPE TEST (COUNT_TAGS)
// ---------------------------------------------------------
export const archetypeTest: QuestionnaireConfig = {
    id: 'archetypeTest',
    titleKey: 'questionnaires:archetypeTest.title',
    descriptionKey: 'questionnaires:archetypeTest.description',
    scoringStrategy: 'COUNT_TAGS',
    maxTotalSelections: 3, // Top 3 archetípus kerül mentésre
    questions: [
        {
            id: 'a1',
            text: 'questionnaires:archetypeTest.a1.text',
            options: [
                { text: 'questionnaires:archetypeTest.a1.opt0', tags: ['MYCELIUM'] },
                { text: 'questionnaires:archetypeTest.a1.opt1', tags: ['POLLINATOR'] },
                { text: 'questionnaires:archetypeTest.a1.opt2', tags: ['SENTINEL'] },
                { text: 'questionnaires:archetypeTest.a1.opt3', tags: ['ECHO'] },
                { text: 'questionnaires:archetypeTest.a1.opt4', tags: ['CANOPY'] },
                { text: 'questionnaires:archetypeTest.a1.opt5', tags: ['ALCHEMIST'] },
                { text: 'questionnaires:archetypeTest.a1.opt6', tags: ['SPARK'] },
                { text: 'questionnaires:archetypeTest.a1.opt7', tags: ['HORIZON'] },
            ]
        },
        {
            id: 'a2',
            text: 'questionnaires:archetypeTest.a2.text',
            options: [
                { text: 'questionnaires:archetypeTest.a2.opt0', tags: ['MYCELIUM'] },
                { text: 'questionnaires:archetypeTest.a2.opt1', tags: ['POLLINATOR'] },
                { text: 'questionnaires:archetypeTest.a2.opt2', tags: ['SENTINEL'] },
                { text: 'questionnaires:archetypeTest.a2.opt3', tags: ['ECHO'] },
                { text: 'questionnaires:archetypeTest.a2.opt4', tags: ['CANOPY'] },
                { text: 'questionnaires:archetypeTest.a2.opt5', tags: ['ALCHEMIST'] },
                { text: 'questionnaires:archetypeTest.a2.opt6', tags: ['SPARK'] },
                { text: 'questionnaires:archetypeTest.a2.opt7', tags: ['HORIZON'] },
            ]
        },
        {
            id: 'a3',
            text: 'questionnaires:archetypeTest.a3.text',
            options: [
                { text: 'questionnaires:archetypeTest.a3.opt0', tags: ['MYCELIUM'] },
                { text: 'questionnaires:archetypeTest.a3.opt1', tags: ['POLLINATOR'] },
                { text: 'questionnaires:archetypeTest.a3.opt2', tags: ['SENTINEL'] },
                { text: 'questionnaires:archetypeTest.a3.opt3', tags: ['ECHO'] },
                { text: 'questionnaires:archetypeTest.a3.opt4', tags: ['CANOPY'] },
                { text: 'questionnaires:archetypeTest.a3.opt5', tags: ['ALCHEMIST'] },
                { text: 'questionnaires:archetypeTest.a3.opt6', tags: ['SPARK'] },
                { text: 'questionnaires:archetypeTest.a3.opt7', tags: ['HORIZON'] },
            ]
        }
    ]
};


// ---------------------------------------------------------
// 3. RDG TEST (DIRECT_SELECTION)
// Regenerative Development Goals
// ---------------------------------------------------------
export const rdgTest: QuestionnaireConfig = {
    id: 'rdgTest',
    titleKey: 'questionnaires:rdgTest.title',
    descriptionKey: 'questionnaires:rdgTest.description',
    scoringStrategy: 'DIRECT_SELECTION',
    questions: [
        {
            id: 'rdg1',
            text: 'questionnaires:rdgTest.rdg1.text',
            maxSelectable: 3,
            options: [
                { text: 'questionnaires:rdgTest.rdg1.opt0', value: 'RDG01' },
                { text: 'questionnaires:rdgTest.rdg1.opt1', value: 'RDG02' },
                { text: 'questionnaires:rdgTest.rdg1.opt2', value: 'RDG03' },
                { text: 'questionnaires:rdgTest.rdg1.opt3', value: 'RDG04' },
                { text: 'questionnaires:rdgTest.rdg1.opt4', value: 'RDG05' },
                { text: 'questionnaires:rdgTest.rdg1.opt5', value: 'RDG06' },
                { text: 'questionnaires:rdgTest.rdg1.opt6', value: 'RDG07' },
                { text: 'questionnaires:rdgTest.rdg1.opt7', value: 'RDG08' },
                { text: 'questionnaires:rdgTest.rdg1.opt8', value: 'RDG09' },
                { text: 'questionnaires:rdgTest.rdg1.opt9', value: 'RDG10' },
                { text: 'questionnaires:rdgTest.rdg1.opt10', value: 'RDG11' },
                { text: 'questionnaires:rdgTest.rdg1.opt11', value: 'RDG12' },
                { text: 'questionnaires:rdgTest.rdg1.opt12', value: 'RDG13' },
                { text: 'questionnaires:rdgTest.rdg1.opt13', value: 'RDG14' },
                { text: 'questionnaires:rdgTest.rdg1.opt14', value: 'RDG15' },
                { text: 'questionnaires:rdgTest.rdg1.opt15', value: 'RDG16' },
                { text: 'questionnaires:rdgTest.rdg1.opt16', value: 'RDG17' },
                { text: 'questionnaires:rdgTest.rdg1.opt17', value: 'RDG18' },
                { text: 'questionnaires:rdgTest.rdg1.opt18', value: 'RDG19' },
                { text: 'questionnaires:rdgTest.rdg1.opt19', value: 'RDG20' },
                { text: 'questionnaires:rdgTest.rdg1.opt20', value: 'RDG21' },
                { text: 'questionnaires:rdgTest.rdg1.opt21', value: 'RDG22' },
                { text: 'questionnaires:rdgTest.rdg1.opt22', value: 'RDG23' },
                { text: 'questionnaires:rdgTest.rdg1.opt23', value: 'RDG24' },
                { text: 'questionnaires:rdgTest.rdg1.opt24', value: 'RDG25' },
                { text: 'questionnaires:rdgTest.rdg1.opt25', value: 'RDG26' },
                { text: 'questionnaires:rdgTest.rdg1.opt26', value: 'RDG27' },
                { text: 'questionnaires:rdgTest.rdg1.opt27', value: 'RDG28' },
                { text: 'questionnaires:rdgTest.rdg1.opt28', value: 'RDG29' },
                { text: 'questionnaires:rdgTest.rdg1.opt29', value: 'RDG30' },
            ]
        }
    ]
};

export interface LearningProgram {
    id: number;
    title: string;
    format: 'Online' | 'Hybrid';
    locationDetails: string;
    cost: number;
    duration: string;
    language: string;
    entryCriteria: string;
    category: string;
    rdg: string;
    level: string;
    link: string;
    description: string;
}
export interface Tradition {
    name: string;
    region: string;
    type: string;
    desc: string;
    details: {
        prep: string;
        agenda: string;
        questions: string;
        awareness: string;
    };
}

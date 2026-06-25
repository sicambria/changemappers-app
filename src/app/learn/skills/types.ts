export type SkillLevel = 'Micro' | 'Meso' | 'Macro';
export type SkillQuadrant = 'UL - Intentional' | 'UR - Behavioral' | 'LL - Cultural' | 'LR - Social/Systems';
export type SkillHorizon = 'H1_Hospicing' | 'H2_Bridging' | 'H3_Radical';

export interface SkillNode {
    id: number;
    level: SkillLevel;
    domain: string;
    text: string;
}

export interface FlattenedSkill extends SkillNode {
    quadrant: SkillQuadrant;
    horizon: SkillHorizon;
}

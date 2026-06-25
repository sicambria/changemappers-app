export type GraphNodeType = 'USER' | 'COMMUNITY' | 'EVENT' | 'CAUSE' | 'ARCHETYPE' | 'RDG';

export interface GraphNode {
    id: string;            // Unique identifier (usually CUID or slug)
    label: string;         // Display name
    type: GraphNodeType;   // Entity category
    group: number;         // Used for base coloring (e.g. users=1, communities=2)
    val: number;           // Node size/weight
    
    // Metadata for filtering & display
    metadata?: {
        location?: {
            city?: string | null;
            country?: string | null;
            latitude?: number | null;
            longitude?: number | null;
        };
        archetypes?: string[]; // IDs of archetypes
        skills?: string[];     // Array of skills (offered)
        rdgs?: string[];       // Associated RDG domains
        cmapLevel?: number;    // For users
        coverImage?: string | null;
    };

    // Internal physics properties assigned by force-graph
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
}

export interface GraphLink {
    source: string;        // Source node ID
    target: string;        // Target node ID
    type?: string;         // Relationship type (e.g., 'member', 'interested', 'embodies', 'matches')
    value?: number;        // Link strength/thickness
}

export interface SystemicGraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

export interface MissingCapacityAnalysis {
    missingArchetypes: string[]; // Slugs or Titles of missing archetypes in the current view
    missingSkills: string[];     // Important skills nobody has in the current view
}

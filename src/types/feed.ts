// Client-safe feed enum constants.
// These mirror the Prisma PostSource and PostVisibility enums exactly,
// but live in a plain TS file so Client Components can import them
// without dragging in the pg/Node.js module graph.

export const PostSource = {
    USER: 'USER',
    COMMUNITY: 'COMMUNITY',
    EVENT: 'EVENT',
    RSS: 'RSS',
} as const;
export type PostSource = (typeof PostSource)[keyof typeof PostSource];

export const PostVisibility = {
    PUBLIC: 'PUBLIC',
    REGISTERED: 'REGISTERED',
    INTERNAL: 'INTERNAL',
} as const;
export type PostVisibility = (typeof PostVisibility)[keyof typeof PostVisibility];

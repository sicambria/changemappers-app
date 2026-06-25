// Common type definitions used across the application

export type ApiResponse<T> =
  | { success: true; data: T; error?: never; errors?: never; message?: string; pendingApproval?: boolean; mfaRequired?: boolean }
  | { success: false; data?: never; error?: string; errors?: Record<string, string[]>; message?: string };

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

export interface GeoLocation {
    latitude: number;
    longitude: number;
}

export interface GeoSearchParams {
    center: GeoLocation;
    radiusKm: number;
}

export interface SearchFilters {
    query?: string;
    type?: string;
    category?: string;
    location?: GeoSearchParams;
    dateRange?: {
        start: Date;
        end: Date;
    };
}

export interface SortOptions {
    field: string;
    direction: 'asc' | 'desc';
}

// Form state types
export type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export interface FormState<T> {
    data: T;
    status: FormStatus;
    error?: string;
}

// Auth types
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
    invitationCode: string;
    archetypes?: string[];

    privacySettings?: Record<string, boolean>;
    termsAccepted: boolean;
}

// Map types
export interface MapMarker {
    id: string;
    type: 'user' | 'community' | 'event';
    position: GeoLocation;
    title: string;
    subtitle?: string;
    iconUrl?: string;
}

export interface MapBounds {
    north: number;
    south: number;
    east: number;
    west: number;
}

export interface MapViewState {
    center: GeoLocation;
    zoom: number;
    bounds?: MapBounds;
}

/**
 * DATABASE & REPOSITORY LAYER ENTRY POINT
 * 
 * Regra Arquitetural:
 * Component -> Repository -> Database Router -> (Cache L1/L2 -> JSON Database -> Firestore)
 */

export * from './DatabaseRouter';
export * from './repositories';
export * from './hooks/useRepository';

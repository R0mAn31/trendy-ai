// Firestore collection paths
export const COLLECTIONS = {
  USERS: 'users',
  SUBSCRIPTIONS: 'subscriptions',
  SAVED_TRENDS: 'saved_trends',
  ANALYSIS: 'analysis',
} as const

// Helper functions for Firestore paths
export const getUserDocPath = (userId: string) => `${COLLECTIONS.USERS}/${userId}`
export const getSubscriptionDocPath = (userId: string) => `${COLLECTIONS.SUBSCRIPTIONS}/${userId}`
export const getSavedTrendsCollectionPath = (userId: string) => `${COLLECTIONS.SAVED_TRENDS}/${userId}/items`
export const getSavedTrendDocPath = (userId: string, trendId: string) => `${COLLECTIONS.SAVED_TRENDS}/${userId}/items/${trendId}`
export const getAnalysisCollectionPath = (userId: string) => `${COLLECTIONS.ANALYSIS}/${userId}/items`
export const getAnalysisDocPath = (userId: string, analysisId: string) => `${COLLECTIONS.ANALYSIS}/${userId}/items/${analysisId}`


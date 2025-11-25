// Firestore collection paths
export const COLLECTIONS = {
  USERS: 'users',
  SUBSCRIPTIONS: 'subscriptions',
  SAVED_TRENDS: 'saved_trends',
  ANALYSIS: 'analysis',
  VIDEO_IDEAS: 'video_ideas',
  TREND_CONTEXT: 'trend_context',
} as const

// Helper functions for Firestore paths
export const getUserDocPath = (userId: string) => `${COLLECTIONS.USERS}/${userId}`
export const getSubscriptionDocPath = (userId: string) => `${COLLECTIONS.SUBSCRIPTIONS}/${userId}`
export const getSavedTrendsCollectionPath = (userId: string) => `${COLLECTIONS.SAVED_TRENDS}/${userId}/items`
export const getSavedTrendDocPath = (userId: string, trendId: string) => `${COLLECTIONS.SAVED_TRENDS}/${userId}/items/${trendId}`
export const getAnalysisCollectionPath = (userId: string) => `${COLLECTIONS.ANALYSIS}/${userId}/items`
export const getAnalysisDocPath = (userId: string, analysisId: string) => `${COLLECTIONS.ANALYSIS}/${userId}/items/${analysisId}`
export const getVideoIdeasCollectionPath = (userId: string, trendId: string) => `${COLLECTIONS.VIDEO_IDEAS}/${userId}/trends/${trendId}/ideas`
export const getVideoIdeaDocPath = (userId: string, trendId: string, ideaId: string) => `${COLLECTIONS.VIDEO_IDEAS}/${userId}/trends/${trendId}/ideas/${ideaId}`
export const getTrendContextDocPath = (userId: string, trendId: string) => `${COLLECTIONS.TREND_CONTEXT}/${userId}/trends/${trendId}`


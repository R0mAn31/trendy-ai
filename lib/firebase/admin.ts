import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin (server-side only)
let adminApp: App | undefined
let adminDb: Firestore | undefined

function initializeAdmin() {
  if (adminApp) {
    return adminApp
  }

  if (getApps().length > 0) {
    adminApp = getApps()[0]
    adminDb = getFirestore(adminApp)
    return adminApp
  }

  // Only initialize if we have the required environment variables
  if (
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ) {
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    })
    adminDb = getFirestore(adminApp)
    return adminApp
  }

  // Return undefined if not initialized (for build time)
  return undefined
}

// Don't initialize on import - only initialize when getAdminDb() is called
// This prevents initialization during build time

export function getAdminDb(): Firestore {
  if (!adminDb) {
    initializeAdmin()
    if (!adminDb) {
      throw new Error('Firebase Admin not initialized. Check environment variables.')
    }
  }
  return adminDb
}

export { adminDb }
export default adminApp


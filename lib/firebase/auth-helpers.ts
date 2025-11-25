import { User as FirebaseUser } from 'firebase/auth'
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore'
import { db } from './config'
import { getUserDocPath } from './collections'
import type { User } from '@/types'

export async function createUserDocument(user: FirebaseUser): Promise<void> {
  const userRef = doc(db, getUserDocPath(user.uid))
  const userDoc = await getDoc(userRef)

  if (!userDoc.exists()) {
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } else {
    // Update existing user
    await setDoc(
      userRef,
      {
        email: user.email,
        displayName: user.displayName || userDoc.data().displayName,
        photoURL: user.photoURL || userDoc.data().photoURL,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
  }
}

export async function getUserDocument(userId: string): Promise<User | null> {
  const userRef = doc(db, getUserDocPath(userId))
  const userDoc = await getDoc(userRef)

  if (!userDoc.exists()) {
    return null
  }

  const data = userDoc.data()
  return {
    id: userId,
    email: data.email,
    displayName: data.displayName,
    photoURL: data.photoURL,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  }
}


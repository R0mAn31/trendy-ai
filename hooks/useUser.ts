'use client'

import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase/config'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useEffect, useState } from 'react'
import type { User } from '@/types'
import { getUserDocPath } from '@/lib/firebase/collections'

export function useUser() {
  const [firebaseUser, loading, error] = useAuthState(auth)
  const [user, setUser] = useState<User | null>(null)
  const [userLoading, setUserLoading] = useState(true)

  useEffect(() => {
    if (!firebaseUser) {
      setUser(null)
      setUserLoading(false)
      return
    }

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, getUserDocPath(firebaseUser.uid)))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: userData.displayName || firebaseUser.displayName,
            photoURL: userData.photoURL || firebaseUser.photoURL,
            createdAt: userData.createdAt?.toDate() || new Date(),
            updatedAt: userData.updatedAt?.toDate() || new Date(),
          })
        } else {
          // Create user document if it doesn't exist
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || undefined,
            photoURL: firebaseUser.photoURL || undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        }
      } catch (err) {
        console.error('Error fetching user data:', err)
      } finally {
        setUserLoading(false)
      }
    }

    fetchUserData()
  }, [firebaseUser])

  return {
    user,
    loading: loading || userLoading,
    error,
  }
}


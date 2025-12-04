'use client'

import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useUser } from './useUser'
import type { Subscription } from '@/types'
import { getSubscriptionDocPath } from '@/lib/firebase/collections'

export function useSubscription() {
  const { user } = useUser()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setSubscription(null)
      setLoading(false)
      return
    }

    const unsubscribe = onSnapshot(
      doc(db, getSubscriptionDocPath(user.id)),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data()
          setSubscription({
            userId: user.id,
            status: data.status || 'cancelled',
            paddleSubscriptionId: data.paddleSubscriptionId,
            paddleCustomerId: data.paddleCustomerId,
            currentPeriodEnd: data.currentPeriodEnd?.toDate(),
            currentPeriodStart: data.currentPeriodStart?.toDate(),
            cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          })
        } else {
          setSubscription(null)
        }
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching subscription:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  const isActive = subscription?.status === 'active'

  return {
    subscription,
    isActive,
    loading,
  }
}




import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import {
  getSavedTrendDocPath,
  getAnalysisCollectionPath,
  getVideoIdeasCollectionPath,
  getTrendContextDocPath,
} from '@/lib/firebase/collections'

export async function GET(
  request: NextRequest,
  { params }: { params: { trendId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const { trendId } = params
    console.log('Fetching trend:', { trendId, userId })
    
    const adminDb = getAdminDb()

    // Get trend data
    const trendPath = getSavedTrendDocPath(userId, trendId)
    console.log('Trend path:', trendPath)
    
    const trendRef = adminDb.doc(trendPath)
    const trendDoc = await trendRef.get()

    if (!trendDoc.exists) {
      // Try to find by accountUsername if trendId doesn't match
      console.log('Trend not found by ID, trying to find by username...')
      const trendsCollection = adminDb.collection(`saved_trends/${userId}/items`)
      const allTrends = await trendsCollection.get()
      
      console.log(`Found ${allTrends.size} trends for user`)
      
      // Try to find trend that matches the ID or username
      let foundTrend: any = null
      for (const doc of allTrends.docs) {
        const data = doc.data()
        if (doc.id === trendId || data.accountUsername === trendId.replace('@', '')) {
          foundTrend = { id: doc.id, ...data }
          break
        }
      }
      
      if (foundTrend) {
        console.log('Found trend by alternative method:', foundTrend.id)
        // Use found trend
        const trendData: any = foundTrend
        
        // Get analyses and ideas for the found trend
        const analysesRef = adminDb.collection(getAnalysisCollectionPath(userId))
        let analysesSnapshot
        try {
          analysesSnapshot = await analysesRef
            .where('trendId', '==', foundTrend.id)
            .orderBy('generatedAt', 'desc')
            .get()
        } catch (error: any) {
          console.log('Index not ready, fetching without orderBy:', error.message)
          analysesSnapshot = await analysesRef
            .where('trendId', '==', foundTrend.id)
            .get()
        }

        const analyses = analysesSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            generatedAt: doc.data().generatedAt?.toDate() || new Date(),
          }))
          .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())

        const ideasRef = adminDb.collection(getVideoIdeasCollectionPath(userId, foundTrend.id))
        let ideasSnapshot
        try {
          ideasSnapshot = await ideasRef
            .orderBy('createdAt', 'desc')
            .get()
        } catch (error: any) {
          console.log('Index not ready, fetching without orderBy:', error.message)
          ideasSnapshot = await ideasRef.get()
        }

        const ideas = ideasSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          }))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

        const contextRef = adminDb.doc(getTrendContextDocPath(userId, foundTrend.id))
        const contextDoc = await contextRef.get()
        const context = contextDoc.exists
          ? {
              id: contextDoc.id,
              ...contextDoc.data(),
              createdAt: contextDoc.data()?.createdAt?.toDate() || new Date(),
              updatedAt: contextDoc.data()?.updatedAt?.toDate() || new Date(),
            }
          : null

        return NextResponse.json({
          success: true,
          trend: {
            ...trendData,
            createdAt: trendData.createdAt?.toDate() || new Date(),
            lastScrapedAt: trendData.lastScrapedAt?.toDate() || new Date(),
          },
          analyses,
          ideas,
          context,
        })
      }
      
      return NextResponse.json({ 
        error: 'Trend not found',
        debug: {
          trendId,
          userId,
          trendPath,
          totalTrends: allTrends.size,
        }
      }, { status: 404 })
    }

    const trendData = trendDoc.data()

    // Get all analyses for this trend
    const analysesRef = adminDb.collection(getAnalysisCollectionPath(userId))
    let analysesSnapshot
    try {
      analysesSnapshot = await analysesRef
        .where('trendId', '==', trendId)
        .orderBy('generatedAt', 'desc')
        .get()
    } catch (error: any) {
      // If index is not ready, get without orderBy and sort in memory
      console.log('Index not ready, fetching without orderBy:', error.message)
      analysesSnapshot = await analysesRef
        .where('trendId', '==', trendId)
        .get()
    }

    const analyses = analysesSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        generatedAt: doc.data().generatedAt?.toDate() || new Date(),
      }))
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())

    // Get all video ideas for this trend
    const ideasRef = adminDb.collection(getVideoIdeasCollectionPath(userId, trendId))
    let ideasSnapshot
    try {
      ideasSnapshot = await ideasRef
        .orderBy('createdAt', 'desc')
        .get()
    } catch (error: any) {
      // If index is not ready, get without orderBy and sort in memory
      console.log('Index not ready, fetching without orderBy:', error.message)
      ideasSnapshot = await ideasRef.get()
    }

    const ideas = ideasSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    // Get context/notes for this trend
    const contextRef = adminDb.doc(getTrendContextDocPath(userId, trendId))
    const contextDoc = await contextRef.get()
    const context = contextDoc.exists
      ? {
          id: contextDoc.id,
          ...contextDoc.data(),
          createdAt: contextDoc.data()?.createdAt?.toDate() || new Date(),
          updatedAt: contextDoc.data()?.updatedAt?.toDate() || new Date(),
        }
      : null

    return NextResponse.json({
      success: true,
      trend: {
        id: trendDoc.id,
        ...trendData,
        createdAt: trendData?.createdAt?.toDate() || new Date(),
        lastScrapedAt: trendData?.lastScrapedAt?.toDate() || new Date(),
      },
      analyses,
      ideas,
      context,
    })
  } catch (error: any) {
    console.error('Get trend details error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get trend details' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { trendId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const { trendId } = params
    console.log('Deleting trend:', { trendId, userId })
    
    const adminDb = getAdminDb()

    // Delete trend document
    const trendPath = getSavedTrendDocPath(userId, trendId)
    const trendRef = adminDb.doc(trendPath)
    const trendDoc = await trendRef.get()

    if (!trendDoc.exists) {
      return NextResponse.json(
        { error: 'Trend not found' },
        { status: 404 }
      )
    }

    // Delete all related analyses
    const analysesRef = adminDb.collection(getAnalysisCollectionPath(userId))
    const analysesSnapshot = await analysesRef
      .where('trendId', '==', trendId)
      .get()
    
    const deleteAnalysesPromises = analysesSnapshot.docs.map((doc) => doc.ref.delete())
    await Promise.all(deleteAnalysesPromises)
    console.log(`Deleted ${analysesSnapshot.size} analyses`)

    // Delete all video ideas
    const ideasRef = adminDb.collection(getVideoIdeasCollectionPath(userId, trendId))
    const ideasSnapshot = await ideasRef.get()
    
    const deleteIdeasPromises = ideasSnapshot.docs.map((doc) => doc.ref.delete())
    await Promise.all(deleteIdeasPromises)
    console.log(`Deleted ${ideasSnapshot.size} video ideas`)

    // Delete context/notes
    const contextRef = adminDb.doc(getTrendContextDocPath(userId, trendId))
    const contextDoc = await contextRef.get()
    if (contextDoc.exists) {
      await contextRef.delete()
      console.log('Deleted trend context')
    }

    // Finally, delete the trend itself
    await trendRef.delete()
    console.log('Deleted trend document')

    return NextResponse.json({
      success: true,
      message: 'Trend and all related data deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete trend error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete trend' },
      { status: 500 }
    )
  }
}

import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET: List all documents for a project
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params

    const project = await db.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    const documents = await db.projectDocument.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: documents })
  } catch (error) {
    console.error('Error fetching project documents:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project documents' },
      { status: 500 }
    )
  }
}

// POST: Add a document to a project
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params
    const body = await request.json()
    const { name, type, fileUrl, fileSize, notes } = body

    if (!name || !type || !fileUrl) {
      return NextResponse.json(
        { success: false, error: 'name, type, and fileUrl are required' },
        { status: 400 }
      )
    }

    const project = await db.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    const document = await db.projectDocument.create({
      data: {
        projectId,
        name,
        type,
        fileUrl,
        fileSize: fileSize || null,
        notes,
      },
    })

    return NextResponse.json({ success: true, data: document }, { status: 201 })
  } catch (error) {
    console.error('Error creating project document:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create project document' },
      { status: 500 }
    )
  }
}

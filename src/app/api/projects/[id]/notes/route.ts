import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET: List all notes for a project
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

    const notes = await db.projectNote.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: notes })
  } catch (error) {
    console.error('Error fetching project notes:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project notes' },
      { status: 500 }
    )
  }
}

// POST: Add a note to a project
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params
    const body = await request.json()
    const { content, createdBy } = body

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
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

    const note = await db.projectNote.create({
      data: {
        projectId,
        content,
        createdBy,
      },
    })

    return NextResponse.json({ success: true, data: note }, { status: 201 })
  } catch (error) {
    console.error('Error creating project note:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create project note' },
      { status: 500 }
    )
  }
}

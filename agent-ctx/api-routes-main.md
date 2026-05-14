# Task: Create API Routes for Project Management System

## Agent: main
## Task ID: api-routes

## Summary
Created all 21 API route files for the Next.js 16 project management application with Prisma ORM (SQLite).

## Files Created

### Client Routes
1. `src/app/api/clients/route.ts` - GET (list all with project count) + POST (create)
2. `src/app/api/clients/[id]/route.ts` - GET (by id with projects) + PUT (update) + DELETE

### Vendor Routes
3. `src/app/api/vendors/route.ts` - GET (list all with purchase/cost counts) + POST (create)
4. `src/app/api/vendors/[id]/route.ts` - GET (by id with purchases/costs) + PUT (update) + DELETE

### Project Routes
5. `src/app/api/projects/route.ts` - GET (list with client info, pagination, filtering) + POST (create with items, auto-generate projectCode PRJ-YYYY-NNN)
6. `src/app/api/projects/[id]/route.ts` - GET (full relations) + PUT (update) + DELETE (cascade)

### Project Sub-resource Routes
7. `src/app/api/projects/[id]/items/route.ts` - POST (add items array) + PUT (update items array)
8. `src/app/api/projects/[id]/rab/route.ts` - GET (RAB data with items+purchases+summary) + POST (add purchase)
9. `src/app/api/projects/[id]/rab/[purchaseId]/route.ts` - PUT (update purchase) + DELETE
10. `src/app/api/projects/[id]/additional-costs/route.ts` - GET (with total) + POST
11. `src/app/api/projects/[id]/additional-costs/[costId]/route.ts` - PUT + DELETE
12. `src/app/api/projects/[id]/notes/route.ts` - GET + POST
13. `src/app/api/projects/[id]/documents/route.ts` - GET + POST
14. `src/app/api/projects/[id]/surat-jalan/route.ts` - GET + POST (with items)
15. `src/app/api/projects/[id]/surat-jalan/[sjId]/route.ts` - GET (with items) + PUT + DELETE
16. `src/app/api/projects/[id]/bast/route.ts` - GET + POST (with items)
17. `src/app/api/projects/[id]/bast/[bastId]/route.ts` - GET (with items) + PUT + DELETE
18. `src/app/api/projects/[id]/invoices/route.ts` - GET + POST (with items + termins)
19. `src/app/api/projects/[id]/invoices/[invId]/route.ts` - GET (with items+termins) + PUT + DELETE
20. `src/app/api/projects/[id]/kuitansi/route.ts` - GET + POST (with items)
21. `src/app/api/projects/[id]/kuitansi/[kId]/route.ts` - GET (with items) + PUT + DELETE

## Key Implementation Details
- All routes use `import { db } from '@/lib/db'` for Prisma client
- All routes use NextRequest/NextResponse from 'next/server'
- All responses return JSON with `{ success: boolean, ... }` format
- Dynamic route params use Next.js 16 pattern: `params: Promise<{ id: string }>`
- Error handling with try/catch and proper status codes
- Project creation auto-generates projectCode format: "PRJ-YYYY-NNN"
- Project items calculate total as qty * unitPrice
- RAB purchase totalBuy calculated as qty * buyPrice
- Sub-resources (surat jalan, BAST, invoice, kuitansi) support nested items/termins creation
- Update routes for sub-resources delete and recreate items (replace strategy)
- Project list supports filtering by status, type, search; with pagination
- RAB GET includes summary with totalRAB, totalPurchases, margin

## Verification
- `bun run lint` passes with no errors
- Live tested: GET /api/clients returns { success: true, data: [] }
- Live tested: POST /api/clients creates and returns client data
- All 21 route files compile successfully

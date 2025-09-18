# Claude Development Guidelines

## Coding Standards to Follow

### Pre-Development Checks
- Run `npm run lint` after creating 2-3 new files
- Run `npm run build` before completing major features
- Pre-commit hook will catch issues automatically

### Next.js 15 Patterns
```typescript
// API route params (always async)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // ...
}
```

### TypeScript Standards
- Never use `any` - provide explicit types
- Use `Record<string, number>` for dynamic object keys
- Interfaces should have meaningful properties, not empty
- Remove unused imports immediately

### Zod Error Handling
```typescript
if (error instanceof z.ZodError) {
  return NextResponse.json({
    error: 'Validation error',
    details: error.issues  // NOT error.errors
  }, { status: 400 })
}
```

### React Patterns
- Add eslint-disable comments for intentional hook dependency omissions
- Use proper interface definitions for component props
- Escape quotes in JSX with `&quot;`

## Project Architecture
- Experience → Event → Session → Booking hierarchy
- All operations include business-scoped access control
- Booking protection prevents deletion of sessions/events/experiences with bookings

## Development Workflow
1. Write code following these patterns
2. Run `npm run lint` periodically
3. Test build before major commits
4. Pre-commit hook provides final safety net
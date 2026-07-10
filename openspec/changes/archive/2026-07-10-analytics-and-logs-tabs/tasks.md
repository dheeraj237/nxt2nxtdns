# Implementation Tasks: Analytics & Logs Tabs

## Phase 1: Backend API Routes

### Task 1.1: Create GET /api/profiles/:id/analytics ✓

**File:** `src/app/api/profiles/[id]/analytics/route.ts`

**Implementation:**
- Extract profile ID from route parameter
- Get account from session/auth
- Verify user has access to this profile
- Calculate month start/end dates
- Call NextDNS API: `GET /profiles/{id}/analytics/status?from=YYYY-MM-01T00:00:00Z&to=YYYY-MM-DDT23:59:59Z`
- Parse response and calculate:
  - `blocked` = count with status "blocked"
  - `allowed` = count with status "allowed"
  - `default` = count with status "default"
  - `total` = sum of all
  - `percentage` = (total / 300000) * 100
- Return JSON response with these values
- Handle errors: return 400/401/404 with error message

**Success Response (200):**
```json
{
  "blocked": 18923,
  "allowed": 101527,
  "default": 0,
  "total": 120450,
  "percentage": 40.15,
  "limit": 300000
}
```

**Estimated Lines:** 30-40 lines

---

### Task 1.2: Create GET /api/profiles/:id/logs/recent ✓

**File:** `src/app/api/profiles/[id]/logs/route.ts`

**Implementation:**
- Extract profile ID from route parameter
- Get account from session/auth
- Verify user has access to this profile
- Call NextDNS API: `GET /profiles/{id}/logs?limit=50&sort=desc`
- Return the data array directly (or map to LogEntry type if needed)
- Handle errors: return 400/401/404 with error message

**Success Response (200):**
```json
[
  {
    "timestamp": "2026-07-10T12:34:56.123Z",
    "domain": "google.com",
    ...
  },
  ...
]
```

**Estimated Lines:** 20-30 lines

---

## Phase 2: React Hooks

### Task 2.1: Create useAnalytics Hook ✓

**File:** `src/hooks/useAnalytics.ts`

**Implementation:**
- Define `AnalyticsData` interface with fields: blocked, allowed, default, total, percentage, limit
- Create hook with state: data, loading, error
- `fetchAnalytics()` function that:
  - Sets loading=true, error=null
  - Calls fetch(`/api/profiles/:id/analytics`)
  - On success: setData(result), setLoading(false)
  - On error: setError(msg), setLoading(false)
- `useEffect([profileId])` that calls fetchAnalytics on mount/change
- Return: { data, loading, error, refetch: fetchAnalytics }

**Usage:**
```typescript
const { data, loading, error, refetch } = useAnalytics(profileId);
```

**Estimated Lines:** 30-40 lines

---

### Task 2.2: Create useLogs Hook ✓

**File:** `src/hooks/useLogs.ts`

**Implementation:**
- Define `LogEntry` interface with fields: timestamp, domain, status, device, etc.
- Create hook with state: logs (array), loading, error
- `fetchLogs()` function that:
  - Sets loading=true, error=null
  - Calls fetch(`/api/profiles/:id/logs/recent`)
  - On success: setLogs(result), setLoading(false)
  - On error: setError(msg), setLogs([]), setLoading(false)
- `useEffect([profileId])` that calls fetchLogs on mount/change
- Return: { logs, loading, error, refetch: fetchLogs }

**Usage:**
```typescript
const { logs, loading, error, refetch } = useLogs(profileId);
```

**Estimated Lines:** 35-45 lines

---

## Phase 3: UI Components

### Task 3.1: Create AnalyticsTab Component ✓

**File:** `src/components/AnalyticsTab.tsx`

**Implementation:**
- Import useAnalytics hook
- Show loading spinner while fetching
- Show error message if error
- When loaded, display:
  - Card 1: "Queries This Month: {total} / 300,000 ({percentage}%)"
    - Progress bar with color coding (green/yellow/red)
  - Card 2: "Blocked This Month: {blocked}"
  - Small text: "Last updated: {timestamp}"
  - [Reload ⟳] button with onClick={() => refetch()}
    - Button disabled while loading
- Style with Tailwind classes (match existing app style)

**Props:**
```typescript
interface AnalyticsTabProps {
  profileId: string;
}
```

**Estimated Lines:** 80-100 lines

---

### Task 3.2: Create LogsTab Component ✓

**File:** `src/components/LogsTab.tsx`

**Implementation:**
- Import useLogs hook
- Show loading spinner while fetching
- Show error message if error
- When loaded, display table:
  - Columns: Timestamp | Domain | Status | Device
  - Rows: Map logs array to table rows
  - Status color coding: green (allowed), red (blocked), gray (default)
  - If logs empty: show "No queries recorded"
  - Small text: "Last updated: {timestamp}"
  - [Reload ⟳] button with onClick={() => refetch()}
    - Button disabled while loading
- Style with Tailwind classes

**Props:**
```typescript
interface LogsTabProps {
  profileId: string;
}
```

**Estimated Lines:** 100-120 lines

---

### Task 3.3: Update ProfileTabs to Include New Tabs ✓

**File:** `src/components/ProfileTabs.tsx` (already partially done)

**Changes:**
- Tabs are already added (Security/Settings removed in prior change)
- Just update the tab rendering section to include:
  ```typescript
  {tab === 'Analytics' && <AnalyticsTab profileId={profileId} />}
  {tab === 'Logs' && <LogsTab profileId={profileId} />}
  ```
- Import both components at top
- Remove the Placeholder components for these tabs

**Estimated Lines:** 5-10 line changes

---

## Phase 4: Types & Utilities

### Task 4.1: Define TypeScript Interfaces ✓

**File:** `src/lib/nextdns/types.ts` (add to existing)

**Add:**
```typescript
export interface AnalyticsData {
  blocked: number;
  allowed: number;
  default: number;
  total: number;
  percentage: number;
  limit: number;
}

export interface LogEntry {
  timestamp: string;
  domain: string;
  root: string;
  protocol: string;
  clientIp: string;
  status: 'blocked' | 'allowed' | 'default' | 'error';
  device?: {
    id: string;
    name: string;
    model?: string;
  };
  encrypted: boolean;
  reasons?: Array<{ rule?: string; category?: string }>;
  tracker?: string;
}
```

**Estimated Lines:** 30 lines

---

## Phase 5: Testing

### Task 5.1: Test Analytics API Route

**File:** `src/app/api/profiles/[id]/analytics/route.test.ts`

**Test Cases:**
- [ ] Returns correct data structure on success
- [ ] Calculates percentage correctly
- [ ] Handles API errors gracefully
- [ ] Requires authentication
- [ ] Returns 404 for non-existent profile

**Estimated Lines:** 40-60 lines

---

### Task 5.2: Test Logs API Route

**File:** `src/app/api/profiles/[id]/logs/route.test.ts`

**Test Cases:**
- [ ] Returns array of log entries
- [ ] Limits to 50 entries
- [ ] Handles API errors gracefully
- [ ] Requires authentication
- [ ] Returns 404 for non-existent profile

**Estimated Lines:** 40-60 lines

---

### Task 5.3: Manual Testing with Real NextDNS Data

**Checklist:**
- [ ] Open Analytics tab for a profile
  - [ ] Data loads correctly
  - [ ] Percentage calculation is accurate (match NextDNS dashboard)
  - [ ] Color coding applies correctly
  - [ ] [Reload] button fetches fresh data
  - [ ] Switching profiles updates data
- [ ] Open Logs tab for a profile
  - [ ] Last 50 entries load correctly
  - [ ] Status colors are correct
  - [ ] Device names display properly
  - [ ] [Reload] button fetches fresh entries
  - [ ] Switching profiles updates entries
- [ ] Error handling
  - [ ] Invalid API key shows error message
  - [ ] Network timeout shows error message
  - [ ] Can retry with [Reload] button

---

## Implementation Order

1. **Backend First** (Tasks 1.1, 1.2, 4.1)
   - Ensures API works before building UI
   - Can test with curl/postman
   
2. **Hooks** (Tasks 2.1, 2.2)
   - Encapsulates data fetching logic
   - Reusable in components

3. **UI Components** (Tasks 3.1, 3.2, 3.3)
   - Can display real data
   - Can test user interactions

4. **Tests** (Tasks 5.1, 5.2, 5.3)
   - Verify correctness
   - Catch regressions

---

## Estimated Effort

- Backend Routes: 50-70 lines, ~30 min
- React Hooks: 65-85 lines, ~30 min
- UI Components: 200-220 lines, ~60 min
- Types & Utils: 30 lines, ~10 min
- Testing: 120-180 lines, ~45 min
- Manual Testing: ~30 min

**Total Estimate: ~3 hours development + testing**


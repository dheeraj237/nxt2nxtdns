# Design: Analytics & Logs Tabs

## Architecture

```
Frontend (React)
  ├─ ProfileTabs component
  │  ├─ AnalyticsTab
  │  │  ├─ useAnalytics() hook
  │  │  └─ AnalyticsCard component
  │  └─ LogsTab
  │     ├─ useLogs() hook
  │     └─ LogsTable component
  │
API Routes (Next.js)
  ├─ GET /api/profiles/:id/analytics
  └─ GET /api/profiles/:id/logs/recent
  
NextDNS API
  ├─ GET /profiles/:id/analytics/status (with from/to date range)
  └─ GET /profiles/:id/logs?limit=50&sort=desc
```

---

## Data Flow

### Analytics Tab

```
User clicks Analytics tab
  ↓
useEffect([profileId]) triggers
  ↓
setLoading(true), show spinner
  ↓
fetch(/api/profiles/:id/analytics)
  ↓
Backend:
  - Calculate month start/end dates
  - Call NextDNS: GET /profiles/:id/analytics/status?from=YYYY-MM-01&to=YYYY-MM-DD
  - Parse response: extract blocked, allowed, default counts
  - Return: { blocked, allowed, total, percentage }
  ↓
Frontend:
  - setData(result)
  - setLastUpdated(new Date())
  - setLoading(false)
  - Render cards with color coding
  ↓
User clicks [Reload ⟳]
  - fetchAnalytics() called again
  - repeat cycle
```

### Logs Tab

```
User clicks Logs tab
  ↓
useEffect([profileId]) triggers
  ↓
setLoading(true), show spinner
  ↓
fetch(/api/profiles/:id/logs/recent)
  ↓
Backend:
  - Call NextDNS: GET /profiles/:id/logs?limit=50&sort=desc
  - Map response to LogEntry objects
  - Return: [LogEntry, LogEntry, ...]
  ↓
Frontend:
  - setLogs(result)
  - setLastUpdated(new Date())
  - setLoading(false)
  - Render table rows
  ↓
User clicks [Reload ⟳]
  - fetchLogs() called again
  - replace table content with fresh data
```

---

## Data Structures

### Analytics Response

```typescript
interface AnalyticsData {
  blocked: number;        // queries blocked this month
  allowed: number;        // queries allowed this month
  default: number;        // queries default/no action this month
  total: number;          // sum of all (blocked + allowed + default)
  percentage: number;     // total / 300000 * 100
  limit: number;          // hardcoded 300000
}
```

### Log Entry Structure

```typescript
interface LogEntry {
  timestamp: string;      // ISO 8601: "2026-07-10T12:34:56.123Z"
  domain: string;         // queried domain: "google.com"
  root: string;          // root domain: "google.com"
  tracker?: string;       // tracker name if identified
  protocol: string;       // "DNS-over-HTTPS" | "DNS-over-TLS" | etc
  clientIp: string;       // "192.168.1.100"
  status: string;         // "blocked" | "allowed" | "default" | "error"
  device?: {
    id: string;          // device ID
    name: string;        // "iPhone" | "Living Room TV"
    model?: string;      // device model
  };
  encrypted: boolean;     // is query encrypted
  reasons?: Array<{      // why was it blocked (if blocked)
    rule?: string;
    category?: string;
  }>;
}
```

---

## Component Specs

### AnalyticsTab Component

```typescript
function AnalyticsTab({ profileId }: { profileId: string }) {
  const { data, loading, error, refetch } = useAnalytics(profileId);
  
  // UI:
  // - Loading spinner while fetching
  // - Error message if failed
  // - Two cards when loaded:
  //   1. "Queries This Month: XXX / 300,000"
  //      With progress bar (color: green <70%, yellow 70-90%, red >90%)
  //   2. "Blocked This Month: YYY"
  // - "Last updated: HH:MM:SS"
  // - [Reload ⟳] button (disabled while loading)
}
```

### LogsTab Component

```typescript
function LogsTab({ profileId }: { profileId: string }) {
  const { logs, loading, error, refetch } = useLogs(profileId);
  
  // UI:
  // - Loading spinner while fetching
  // - Error message if failed
  // - Table when loaded with columns:
  //   - Timestamp (formatted time)
  //   - Domain
  //   - Status (with color: green=allowed, red=blocked, gray=default)
  //   - Device Name
  // - "Last updated: HH:MM:SS"
  // - [Reload ⟳] button (disabled while loading)
}
```

---

## API Route Specs

### GET /api/profiles/:id/analytics

**Request:** 
```
GET /api/profiles/:id/analytics
```

**Response (200):**
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

**Error (400/401/404):**
```json
{
  "error": "Profile not found" | "Invalid API key" | etc
}
```

### GET /api/profiles/:id/logs/recent

**Request:**
```
GET /api/profiles/:id/logs/recent
```

**Response (200):**
```json
[
  {
    "timestamp": "2026-07-10T12:34:56.123Z",
    "domain": "google.com",
    "root": "google.com",
    "protocol": "DNS-over-HTTPS",
    "clientIp": "192.168.1.100",
    "status": "allowed",
    "device": {
      "id": "device123",
      "name": "Living Room TV"
    },
    "encrypted": true,
    "reasons": []
  },
  ...49 more entries...
]
```

**Error (400/401/404):**
```json
{
  "error": "Profile not found" | "Invalid API key" | etc
}
```

---

## Implementation Details

### Backend: /api/profiles/:id/analytics

```typescript
// Get current month's date range
const now = new Date();
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
const monthEnd = now;

const fromIso = monthStart.toISOString();
const toIso = monthEnd.toISOString();

// Call NextDNS
const analyticsResponse = await nextDnsFetch(apiKey, 
  `/profiles/${profileId}/analytics/status?from=${fromIso}&to=${toIso}`
);

// Parse response structure
const blocked = analyticsResponse.data.find(d => d.status === 'blocked')?.queries ?? 0;
const allowed = analyticsResponse.data.find(d => d.status === 'allowed')?.queries ?? 0;
const defaultQueries = analyticsResponse.data.find(d => d.status === 'default')?.queries ?? 0;

const total = blocked + allowed + defaultQueries;
const percentage = (total / 300000) * 100;

return {
  blocked,
  allowed,
  default: defaultQueries,
  total,
  percentage,
  limit: 300000
};
```

### Backend: /api/profiles/:id/logs/recent

```typescript
// Call NextDNS
const logsResponse = await nextDnsFetch(apiKey,
  `/profiles/${profileId}/logs?limit=50&sort=desc`
);

// Return response directly (NextDNS already returns correct structure)
return logsResponse.data;
```

### Frontend: useAnalytics Hook

```typescript
export function useAnalytics(profileId: string) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/profiles/${profileId}/analytics`);
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchAnalytics();
  }, [profileId, fetchAnalytics]);

  return { data, loading, error, refetch: fetchAnalytics };
}
```

### Frontend: useLogs Hook

```typescript
export function useLogs(profileId: string) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/profiles/${profileId}/logs/recent`);
      if (!res.ok) throw new Error(await res.text());
      setLogs(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchLogs();
  }, [profileId, fetchLogs]);

  return { logs, loading, error, refetch: fetchLogs };
}
```

---

## Color Coding

### Quota Percentage Thresholds

```
0-70%:    Green  (#22c55e)   - Comfortable
70-90%:   Yellow (#eab308)   - Getting close
90-100%:  Red    (#ef4444)   - Approaching limit
100%+:    Red    (#ef4444)   - Over limit
```

### Log Status Colors

```
allowed:  Green  (#22c55e)   - Query allowed
blocked:  Red    (#ef4444)   - Query blocked
default:  Gray   (#94a3b8)   - No action
error:    Orange (#f97316)   - Query error
```

---

## Error Handling

All errors are caught at hook level and displayed in UI:

```
If fetch fails:
  - Show: "Error: [error message]"
  - Keep previous data visible (don't blank screen)
  - Allow user to [Reload] to retry
```


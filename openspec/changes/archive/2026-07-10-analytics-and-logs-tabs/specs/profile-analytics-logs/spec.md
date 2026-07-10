# Specification: Profile Analytics & Logs Tabs

## Overview

Two new read-only tabs in the profile editor:
1. **Analytics** - Display monthly query quota usage
2. **Logs** - Display real-time DNS query entries

---

## Requirement: Analytics Tab Shows Monthly Quota

The system SHALL display the current month's DNS query usage as a percentage of the 300K monthly free limit.

### Scenario: Load Analytics on Tab Open

- **GIVEN** user has opened a profile
- **WHEN** user clicks the Analytics tab
- **THEN** the system shows a loading state
- **AND** immediately calls GET `/api/profiles/:id/analytics`
- **AND** upon response, displays:
  - Total queries this month: XXX / 300,000
  - Percentage used: YY%
  - Blocked queries this month: ZZZ
  - Progress bar with color (green <70%, yellow 70-90%, red >90%)
  - Last updated timestamp
- **AND** disables the [Reload ⟳] button during loading

### Scenario: Reload Analytics Manually

- **GIVEN** analytics data is displayed
- **WHEN** user clicks the [Reload ⟳] button
- **THEN** the system calls GET `/api/profiles/:id/analytics` again
- **AND** shows loading state
- **AND** updates the displayed data and timestamp
- **AND** disables the button during loading

### Scenario: Analytics API Fails

- **GIVEN** user clicked Analytics tab or [Reload] button
- **WHEN** the API call fails (network error, 401 unauthorized, 404 not found)
- **THEN** the system shows an error message: "Error: [error details]"
- **AND** does NOT blank the screen (keeps previous data visible if available)
- **AND** enables the [Reload] button so user can retry

### Scenario: Switching Profiles

- **GIVEN** user is viewing Analytics for Profile A
- **WHEN** user switches to a different profile via the account selector
- **THEN** the system re-fetches analytics for Profile B
- **AND** displays Profile B's quota data
- **AND** updates the profileId dependency

---

## Requirement: Color-Coded Quota Warnings

The system SHALL apply color coding to the progress bar and percentage display based on quota usage.

### Scenario: Green Zone (Below 70%)

- **GIVEN** total queries < 210,000 (70% of 300K)
- **WHEN** analytics data is displayed
- **THEN** progress bar and percentage text are displayed in green (#22c55e)
- **AND** no warning icon or message shown

### Scenario: Yellow Zone (70-90%)

- **GIVEN** total queries between 210,000 and 270,000 (70-90%)
- **WHEN** analytics data is displayed
- **THEN** progress bar and percentage text are displayed in yellow (#eab308)
- **AND** optional warning indicator shown (e.g., "⚠ Approaching limit")

### Scenario: Red Zone (Over 90%)

- **GIVEN** total queries > 270,000 (90% of 300K)
- **WHEN** analytics data is displayed
- **THEN** progress bar and percentage text are displayed in red (#ef4444)
- **AND** warning indicator shown (e.g., "⚠ Limit nearly reached")

### Scenario: Over Limit (100%+)

- **GIVEN** total queries >= 300,000
- **WHEN** analytics data is displayed
- **THEN** progress bar shows at 100% in red
- **AND** percentage displays as "100%+" or "300,450 / 300,000"
- **AND** warning shown: "Limit exceeded"

---

## Requirement: Logs Tab Shows Recent DNS Queries

The system SHALL display the last 50 DNS query log entries for the current profile.

### Scenario: Load Logs on Tab Open

- **GIVEN** user has opened a profile
- **WHEN** user clicks the Logs tab
- **THEN** the system shows a loading state
- **AND** immediately calls GET `/api/profiles/:id/logs/recent`
- **AND** upon response, displays a table with columns:
  - Timestamp (formatted: HH:MM:SS or relative "5 min ago")
  - Domain (queried domain)
  - Status (color-coded: green=allowed, red=blocked, gray=default)
  - Device (device name from query)
- **AND** displays up to 50 rows (most recent first)
- **AND** shows "Last updated: HH:MM:SS"
- **AND** disables [Reload ⟳] button during loading

### Scenario: Reload Logs Manually

- **GIVEN** logs data is displayed
- **WHEN** user clicks [Reload ⟳] button
- **THEN** the system calls GET `/api/profiles/:id/logs/recent` again
- **AND** replaces the table content with fresh entries
- **AND** updates timestamp
- **AND** maintains table sort (newest first)

### Scenario: Logs API Fails

- **GIVEN** user clicked Logs tab or [Reload] button
- **WHEN** the API call fails (network error, 401, 404)
- **THEN** the system shows an error message: "Error: [error details]"
- **AND** does NOT blank the screen
- **AND** enables [Reload] button for retry

### Scenario: Empty Logs

- **GIVEN** the profile has no recent queries (unlikely but possible)
- **WHEN** API returns empty array
- **THEN** the system displays: "No queries recorded"
- **AND** still shows the [Reload] button
- **AND** shows last updated timestamp

### Scenario: Log Status Color Coding

- **GIVEN** logs are displayed
- **WHEN** rendering each row
- **THEN** status column is color-coded:
  - "allowed" → green text/background
  - "blocked" → red text/background
  - "default" → gray text/background
  - "error" → orange text/background

### Scenario: Switching Profiles in Logs Tab

- **GIVEN** user is viewing Logs for Profile A
- **WHEN** user switches to Profile B via account selector
- **THEN** the system re-fetches logs for Profile B
- **AND** displays new profile's entries
- **AND** clears previous table content

---

## Requirement: Per-Profile Data Isolation

The system SHALL only show data for the currently selected profile.

### Scenario: Profile A vs Profile B

- **GIVEN** user has multiple profiles in an account
- **WHEN** user switches between profiles
- **THEN** Analytics and Logs tabs show only data for the selected profile
- **AND** quota/logs are NOT aggregated or mixed
- **AND** switching profiles triggers fresh API calls for that profile

---

## Requirement: Loading and Error States

The system SHALL provide clear feedback during loading and error conditions.

### Scenario: Loading State Display

- **GIVEN** an API call is in progress
- **WHEN** the user sees the tab
- **THEN** a loading spinner or skeleton is shown
- **AND** [Reload] button is disabled (grayed out, non-clickable)
- **AND** previous data (if any) remains visible but slightly faded or locked

### Scenario: Error State Display

- **GIVEN** an API call fails
- **WHEN** the error is received
- **THEN** a visible error message is displayed: "Error: [description]"
- **AND** [Reload] button is enabled and clickable
- **AND** user can click Reload to retry

### Scenario: Success State Display

- **GIVEN** an API call succeeds
- **WHEN** data is received
- **THEN** error message is cleared
- **AND** loading state is hidden
- **AND** data is displayed
- **AND** "Last updated: HH:MM:SS" timestamp is shown
- **AND** [Reload] button is enabled

---

## Requirement: Timestamps Show When Data Was Fetched

The system SHALL display the time when data was last refreshed.

### Scenario: Last Updated Timestamp

- **GIVEN** data is displayed
- **WHEN** rendering the component
- **THEN** show: "Last updated: 12:34:56" or "Last updated: 2 minutes ago"
- **AND** update this timestamp each time [Reload] is clicked and succeeds

---

## Non-Requirements (Out of Scope)

The following are explicitly NOT included:

- Auto-refresh or polling in background
- Historical data storage or time-range filtering
- Advanced searching or filtering options
- Export or download functionality
- Aggregated multi-account quota view
- Real-time streaming via WebSocket/SSE
- Pagination or cursor-based loading
- Device filtering or selection

---

## API Contracts

### GET /api/profiles/:id/analytics

**Response Schema:**
```typescript
{
  blocked: number;      // queries blocked this month
  allowed: number;      // queries allowed this month
  default: number;      // queries with no action
  total: number;        // sum of all
  percentage: number;   // (total / 300000) * 100
  limit: number;        // 300000 (constant)
}
```

**Error Response:**
```typescript
{
  error: string;  // Error message (e.g., "Profile not found")
}
```

### GET /api/profiles/:id/logs/recent

**Response Schema:**
```typescript
[
  {
    timestamp: string;        // ISO 8601
    domain: string;           // queried domain
    root: string;             // root domain
    protocol: string;         // DNS-over-HTTPS, etc
    clientIp: string;         // client IP address
    status: string;           // blocked, allowed, default, error
    device?: {
      id: string;
      name: string;
      model?: string;
    };
    encrypted: boolean;
    reasons?: Array<{ rule?, category? }>;
  },
  ...
]
```

**Error Response:**
```typescript
{
  error: string;  // Error message
}
```


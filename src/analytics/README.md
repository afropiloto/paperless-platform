# Analytics Module

The Analytics Module provides endpoints for retrieving analytics data for the trade documents platform.

## Endpoints

### 1. Recent Trade Documents
**GET** `/analytics/:accountId/trade-documents/recent`

Returns the most recently updated trade documents for an account, ordered by `updatedAt` field.

**Query Parameters:**
- `limit` (optional): Maximum number of documents to retrieve (default: 10, min: 1)

**Response Fields:**
- `id`: Document ID
- `documentReference`: Document reference
- `status`: Document status
- `documentType`: Type of document
- `createdAt`: Creation date
- `updatedAt`: Last update date

**Example Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "documentReference": "INV-2024-001",
    "status": "Issued",
    "documentType": "invoice",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-20T14:30:00.000Z"
  }
]
```

### 2. Recent Trade Finance Deals
**GET** `/analytics/:accountId/trade-finance/recent`

Returns the most recently updated trade finance deals for an account, ordered by `updatedAt` field.

**Query Parameters:**
- `limit` (optional): Maximum number of deals to retrieve (default: 10, min: 1)

**Response Fields:**
- `id`: Deal ID
- `dealReference`: Deal reference
- `dealStatus`: Current deal status
- `totalValue`: Total value of the deal
- `createdAt`: Creation date
- `updatedAt`: Last update date

**Example Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439012",
    "dealReference": "TF-2024-001",
    "dealStatus": "In Progress",
    "totalValue": 100000,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-20T14:30:00.000Z"
  }
]
```

### 3. Trade Documents Summary
**GET** `/analytics/:accountId/trade-documents/summary`

Returns a summary of trade documents created since a given date, grouped by status.

**Query Parameters:**
- `since` (required): Date to start summary from (ISO string)

**Response Fields:**
- `inProgress`: Count of documents in progress
- `readyToIssue`: Count of documents ready to issue
- `issued`: Count of issued documents
- `signed`: Count of signed documents
- `processing`: Count of processing documents
- `total`: Total count of documents

**Example Response:**
```json
{
  "inProgress": 2,
  "readyToIssue": 1,
  "issued": 5,
  "signed": 0,
  "processing": 0,
  "total": 8
}
```

### 4. Trade Finance Summary
**GET** `/analytics/:accountId/trade-finance/summary`

Returns a summary of trade finance deals created since a given date, grouped by deal status.

**Query Parameters:**
- `since` (required): Date to start summary from (ISO string)

**Response Fields:**
- `inProgress`: Count of deals in progress
- `fundingRequested`: Count of deals with funding requested
- `fundingApproved`: Count of deals with funding approved
- `fundingRejected`: Count of deals with funding rejected
- `total`: Total count of deals

**Example Response:**
```json
{
  "inProgress": 1,
  "fundingRequested": 3,
  "fundingApproved": 0,
  "fundingRejected": 0,
  "total": 4
}
```

## Usage

The analytics module uses the existing `TradeDocumentsService` and `TradeFinanceService` to retrieve data from the repository layers, ensuring consistency with the rest of the application.

All endpoints require authentication and proper authorization to access account-specific data.

## Error Handling

- **401 Unauthorized**: When not authenticated or authorized to access the account
- **400 Bad Request**: When query parameters are invalid
- **404 Not Found**: When the account doesn't exist 
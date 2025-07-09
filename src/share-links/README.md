# Share Links Module

This module provides secure document sharing functionality similar to Google Drive share links. It allows users to create secure, non-predictable links that can be shared to access trade documents with optional expiry dates and email restrictions.

## Features

- **Secure Link Generation**: Creates cryptographically secure, non-predictable link IDs
- **Encrypted Data Storage**: All sensitive data (accountId, documentId, etc.) is encrypted at rest
- **Expiry Support**: Optional expiry dates for automatic link expiration
- **Email Restrictions**: Optional list of allowed email addresses for access control
- **Audit Logging**: Comprehensive audit trail for all share link activities
- **Access Tracking**: Tracks access counts and last accessed timestamps

## Security

- Link IDs are generated using cryptographically secure random bytes
- All sensitive data is encrypted using AES-256-CBC with unique IVs and salts
- No sensitive information is exposed in the link ID itself
- Email addresses are validated and stored in lowercase for consistency

## API Endpoints

### Create Share Link
```
POST /trade-documents/:accountId/:documentId/share
POST /share-links/:accountId/:documentId
```

Creates a secure share link for a trade document.

**Request Body:**
```json
{
  "expiresAt": "2024-12-31T23:59:59Z",  // Optional
  "allowedEmails": ["user@example.com"] // Optional
}
```

**Response:**
```json
{
  "linkId": "abc123def456...",
  "expiresAt": "2024-12-31T23:59:59Z",
  "allowedEmails": ["user@example.com"],
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Access Share Link
```
GET /share-links/access/:linkId?email=user@example.com
```

Accesses a trade document using a share link.

**Query Parameters:**
- `email` (optional): Required if the link has email restrictions

**Response:** Returns the full TradeDocumentDto

### Get Share Links for Document
```
GET /trade-documents/:accountId/:documentId/share
GET /share-links/:accountId/:documentId
```

Retrieves all active share links for a specific document.

### Delete Share Link
```
DELETE /share-links/:linkId
```

Deletes a share link (only the account owner can delete their links).

## Environment Variables

- `SHARE_LINK_SECRET`: Secret key used for encryption (defaults to 'default-secret' in development)

## Database Schema

The `ShareLink` schema includes:
- `linkId`: Unique, secure identifier for the share link
- `accountId`: Account that owns the document
- `documentId`: Document being shared
- `encryptedData`: Encrypted payload containing sensitive data
- `iv`: Initialization vector for encryption
- `salt`: Salt for key derivation
- `expiresAt`: Optional expiry date
- `allowedEmails`: Array of allowed email addresses
- `createdBy`: User who created the link
- `isExpired`: Boolean flag for manual expiration
- `accessCount`: Number of times the link has been accessed
- `lastAccessedAt`: Timestamp of last access

## Usage Examples

### Creating a share link with expiry and email restrictions
```typescript
const shareLink = await shareLinksService.createShareLink(
  'account123',
  'document456',
  {
    expiresAt: new Date('2024-12-31'),
    allowedEmails: ['john@example.com', 'jane@example.com']
  },
  'user789'
);
```

### Accessing a share link
```typescript
const document = await shareLinksService.accessShareLink(
  'abc123def456...',
  'john@example.com'
);
```

## Integration with Trade Documents

The share links functionality is integrated into the trade documents module, providing endpoints at:
- `POST /trade-documents/:accountId/:documentId/share` - Create share link
- `GET /trade-documents/:accountId/:documentId/share` - List share links

This allows seamless integration with existing trade document workflows.

## Audit Events

The module logs the following audit events:
- `SHARE_LINK_CREATED`: When a new share link is created
- `SHARE_LINK_ACCESSED`: When a share link is accessed
- `SHARE_LINK_DELETED`: When a share link is deleted

Each audit event includes relevant metadata such as link ID, expiry information, and access details. 
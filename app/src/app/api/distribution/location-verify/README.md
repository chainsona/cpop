# Location Verification API Endpoint

This API endpoint is used to verify a user's location before allowing them to claim a POAP using the LocationBased distribution method.

## Authentication Requirements

This endpoint requires authentication. Make sure:

1. The user has connected their wallet
2. The user has authenticated with their wallet (signed the auth message)
3. The request includes credentials: `{ credentials: 'include' }` to send the auth cookie
4. The Solana auth token cookie is properly set

## Troubleshooting Authentication Issues

If you're getting 401 Unauthorized responses:

1. **Check browser cookies**: Make sure `solana_auth_token` cookie exists
2. **Verify token validity**: The token might be expired or invalid
3. **Re-authenticate**: Try calling `authenticate()` from the wallet context
4. **Add credentials to fetch**: Always include `credentials: 'include'` in your fetch calls

## Request Format

```typescript
POST /api/distribution/location-verify

{
  "distributionMethodId": "your-distribution-method-id",
  "userLatitude": 40.7128,      // User's current latitude
  "userLongitude": -74.0060     // User's current longitude
}
```

## Response Format

### Success (200)

```json
{
  "valid": true,
  "message": "Location verified successfully",
  "poap": {
    "id": "poap-id",
    "title": "POAP Title",
    "distributionMethodId": "distribution-method-id"
  }
}
```

### Error (403) - Not Within Radius

```json
{
  "valid": false,
  "message": "You are not within the required location radius",
  "distance": 1500, // Distance in meters
  "radius": 500 // Required radius in meters
}
```

### Error (401) - Authentication Required

```json
{
  "error": "Authentication required",
  "message": "You must be authenticated to verify your location"
}
```

# 🔌 Caeflip API Examples

## Base URL
```
http://localhost:3001/api
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 📝 Example API Calls

### 1. Google Login
```bash
curl -X POST http://localhost:3001/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "googleId": "123456789",
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://..."
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "googleId": "123456789",
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://...",
    "balance": 0,
    "roblosecurity": "",
    "inventory": []
  }
}
```

### 2. Link .ROBLOSECURITY
```bash
curl -X POST http://localhost:3001/api/auth/roblosecurity \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roblosecurity": "_|WARNING:-DO-NOT-SHARE-THIS..."
  }'
```

### 3. Get User Profile
```bash
curl -X GET http://localhost:3001/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Open a Crate
```bash
curl -X POST http://localhost:3001/api/crates/open \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "crateType": "Starter Case",
    "cost": 100,
    "wonItem": {
      "name": "Bucket",
      "value": 450,
      "demand": "Low",
      "rarity": "Common"
    }
  }'
```

### 5. Redeem Promo Code
```bash
curl -X POST http://localhost:3001/api/promo/redeem \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "WELCOME2024"
  }'
```

**Response:**
```json
{
  "success": true,
  "amount": 1000,
  "balance": 1000
}
```

### 6. Request Withdrawal
```bash
curl -X POST http://localhost:3001/api/withdraw/request \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "robloxUsername": "JohnDoe123"
  }'
```

### 7. Play Towers Game
```bash
curl -X POST http://localhost:3001/api/towers/play \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bet": 100,
    "difficulty": "easy",
    "won": true,
    "multiplier": 2
  }'
```

### 8. Play Mines Game
```bash
curl -X POST http://localhost:3001/api/mines/play \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bet": 100,
    "minesCount": 3,
    "won": true,
    "multiplier": 1.6
  }'
```

---

## 👑 Admin Endpoints

### 9. Admin Login
```bash
curl -X POST http://localhost:3001/api/admin/verify \
  -H "Content-Type: application/json" \
  -d '{
    "password": "kerimpro"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "admin_token_here"
}
```

### 10. Get All Users
```bash
curl -X GET http://localhost:3001/api/admin/users
```

**Response:**
```json
[
  {
    "googleId": "123456789",
    "email": "user@example.com",
    "name": "John Doe",
    "balance": 1500,
    "roblosecurity": "_|WARNING...",
    "inventoryCount": 5,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### 11. Add Balance to User
```bash
curl -X POST http://localhost:3001/api/admin/add-balance \
  -H "Content-Type: application/json" \
  -d '{
    "googleId": "123456789",
    "amount": 1000
  }'
```

### 12. Create Promo Code
```bash
curl -X POST http://localhost:3001/api/admin/promo/create \
  -H "Content-Type: application/json" \
  -d '{
    "code": "WELCOME2024",
    "amount": 1000,
    "maxUses": 100
  }'
```

**Response:**
```json
{
  "success": true,
  "promo": {
    "code": "WELCOME2024",
    "amount": 1000,
    "maxUses": 100,
    "uses": 0,
    "createdAt": "2024-01-15T12:00:00.000Z"
  }
}
```

### 13. List All Promo Codes
```bash
curl -X GET http://localhost:3001/api/promo/list
```

### 14. Delete Promo Code
```bash
curl -X DELETE http://localhost:3001/api/admin/promo/WELCOME2024
```

### 15. Get Pending Withdrawals
```bash
curl -X GET http://localhost:3001/api/withdraw/pending
```

### 16. Approve Withdrawal
```bash
curl -X POST http://localhost:3001/api/admin/withdrawal/approve \
  -H "Content-Type: application/json" \
  -d '{
    "withdrawalId": "withdrawal:1234567890:123456789"
  }'
```

### 17. Reject Withdrawal
```bash
curl -X POST http://localhost:3001/api/admin/withdrawal/reject \
  -H "Content-Type: application/json" \
  -d '{
    "withdrawalId": "withdrawal:1234567890:123456789"
  }'
```

---

## 🔍 Redis Keys Structure

### User Data
```
user:{googleId} → JSON object with user data
```

### Users List
```
users:all → Set of all googleIds
```

### Promo Codes
```
promo:{code} → JSON object with promo data
promo:{code}:used:{googleId} → Marks code as used by user
```

### Withdrawals
```
withdrawal:{timestamp}:{googleId} → JSON object with withdrawal data
withdrawals:pending → Set of pending withdrawal IDs
withdrawals:approved → Set of approved withdrawal IDs
```

### History
```
history:{googleId} → List of user's game history
```

---

## 📊 Response Status Codes

- `200` - Success
- `400` - Bad Request (insufficient balance, already used, etc.)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (invalid token)
- `404` - Not Found (user not found, promo not found, etc.)
- `500` - Server Error

---

## 🛡️ Security Notes

1. JWT tokens expire after 7 days
2. Admin password is hardcoded as `kerimpro`
3. .ROBLOSECURITY tokens are stored in Redis
4. All game outcomes use server-side validation
5. Promo codes can only be used once per user

---

## 🎮 Game Probability

All games use a **70% house edge, 30% player advantage** system:

- **Crates**: Weighted by inverse item value (cheaper items more likely)
- **Towers**: 30% chance to pick safe tile
- **Mines**: 65% chance to hit safe tile (adjusted for mine count)

---

## 📝 Notes

- All Robux values are stored as numbers (no decimals)
- Timestamps use ISO 8601 format
- GoogleId is used as the primary user identifier
- Balance updates are atomic (no race conditions)


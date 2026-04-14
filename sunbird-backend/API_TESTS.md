# Sunbird Tourism PLC - API Documentation

## Authentication System

### 1. Admin Login
- **Method**: `POST`
- **URL**: `/api/auth/login`
- **Auth Required**: No
- **Body**:
  ```json
  {
    "email": "admin@sunbirdmalawi.com",
    "password": "admin123"
  }
  ```
- **Response**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR...",
    "user": {
      "id": 1,
      "email": "admin@sunbirdmalawi.com",
      "full_name": "System Admin",
      "role": "admin"
    }
  }
  ```
- **cURL Test**:
  ```bash
  curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sunbirdmalawi.com","password":"admin123"}'
  ```

---

## Public Endpoints

### 2. Fetch All Hotels
- **Method**: `GET`
- **URL**: `/api/hotels?page=1&limit=10&category=city`
- **Auth Required**: No
- **Response**: Array of hotels natively injected with their respective `rooms` components.
- **cURL Test**:
  ```bash
  curl -X GET "http://localhost:3000/api/hotels?limit=5"
  ```

### 3. Fetch Single Hotel
- **Method**: `GET`
- **URL**: `/api/hotels/capital`
- **Auth Required**: No
- **Response**: Targeted explicit hotel structurally containing associated `rooms`.
- **cURL Test**:
  ```bash
  curl -X GET http://localhost:3000/api/hotels/capital
  ```

### 4. Create Public Booking
- **Method**: `POST`
- **URL**: `/api/bookings`
- **Auth Required**: No
- **Body**:
  ```json
  {
    "hotel_id": 1,
    "room_id": 1,
    "guest_name": "Demo Guest",
    "guest_email": "demo@example.com",
    "guest_phone": "+265 999 123 456",
    "check_in": "2026-05-10",
    "check_out": "2026-05-15",
    "num_guests": 2,
    "payment_method": "card",
    "special_requests": "Ocean view preferred"
  }
  ```
- **Response**: Returns `total_amount` logically calculated securely, plus specific `SB-2026-XXXX` reference id.
- **cURL Test**:
  ```bash
  curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"hotel_id":1,"room_id":1,"guest_name":"John","guest_email":"j@web.com","guest_phone":"123","check_in":"2026-10-01","check_out":"2026-10-05","payment_method":"airtel"}'
  ```

---

## Secured Admin Endpoints

> **IMPORTANT:** Every single command beneath this barrier explicitly requires a valid Bearer token mapped directly inside the request header natively.
> Format mapping: `Authorization: Bearer YOUR_GENERATED_TOKEN_HERE`

### 5. Fetch Internal Booking Analytics (Dashboard Data)
- **Method**: `GET`
- **URL**: `/api/bookings/stats/summary`
- **Auth Required**: **Yes**
- **cURL Test**:
  ```bash
  curl -X GET http://localhost:3000/api/bookings/stats/summary \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
  ```

### 6. Mark Booking as Paid
- **Method**: `PATCH`
- **URL**: `/api/bookings/1/payment`
- **Auth Required**: **Yes**
- **Body**:
  ```json
  {
    "status": "paid"
  }
  ```
- **cURL Test**:
  ```bash
  curl -X PATCH http://localhost:3000/api/bookings/1/payment \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"status":"paid"}'
  ```

### 7. Fetch Internal Enquiries
- **Method**: `GET`
- **URL**: `/api/enquiries?is_read=false`
- **Auth Required**: **Yes**
- **Response**: Outputs array of unread electronic communication structs.
- **cURL Test**:
  ```bash
  curl -X GET "http://localhost:3000/api/enquiries?is_read=false" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
  ```

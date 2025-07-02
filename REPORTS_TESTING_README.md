# Reports Endpoints Testing and Documentation

## 🎯 Overview

This document contains the testing results and instructions for all 7 reports endpoints in the Aereo airport management system.

## ✅ Test Results Summary

**All reports endpoints are working correctly!**

- **7/7 JSON endpoints working** (100% success rate)
- **7/7 CSV exports working** (100% success rate) 
- **Authentication working for all user roles**
- **Authorization correctly blocking unauthorized access**
- **Proper error handling and empty data responses**

## 📊 Available Reports Endpoints

### 1. Attendance Report
- **Endpoint:** `GET /reports/attendance`
- **Parameters:** `startDate`, `endDate`, `stationId` (optional), `format` (optional)
- **Description:** Generates employee attendance report with hours worked, check-in/out times, and pay calculations
- **Authorization:** Admin, Supervisor, Manager, President

### 2. Overtime Report  
- **Endpoint:** `GET /reports/overtime`
- **Parameters:** `startDate`, `endDate`, `stationId` (optional), `format` (optional)
- **Description:** Analyzes overtime hours and costs for employees
- **Authorization:** Admin, Supervisor, Manager, President

### 3. Station Coverage Report
- **Endpoint:** `GET /reports/coverage`
- **Parameters:** `format` (optional)
- **Description:** Shows staffing levels vs requirements for each station
- **Authorization:** Admin, Supervisor, Manager, President

### 4. Weekly Schedule Report
- **Endpoint:** `GET /reports/weekly-schedule`
- **Parameters:** `weekStartDate`, `stationId` (optional), `format` (optional)
- **Description:** Displays weekly assignments and schedules
- **Authorization:** Admin, Supervisor, Manager, President

### 5. Employee Schedule Report
- **Endpoint:** `GET /reports/employee-schedule`
- **Parameters:** `employeeId`, `startDate`, `endDate`, `format` (optional)
- **Description:** Individual employee's schedule and assignments
- **Authorization:** Admin, Supervisor, Manager, President, Employee (own data only)

### 6. Cost Analysis Report
- **Endpoint:** `GET /reports/cost-analysis`
- **Parameters:** `startDate`, `endDate`, `stationId` (optional), `format` (optional)
- **Description:** Detailed cost breakdown by employee, station, and time period
- **Authorization:** Admin, Manager, President

### 7. Operational Metrics
- **Endpoint:** `GET /reports/operational-metrics`
- **Parameters:** `startDate`, `endDate`
- **Description:** Key performance indicators and operational statistics
- **Authorization:** Admin, Manager, President

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database running
- Docker (optional, for database setup)

### 1. Database Setup

Using Docker (recommended):
```bash
docker run --name postgres-test -e POSTGRES_PASSWORD=password -e POSTGRES_DB=aeo_db -p 5432:5432 -d postgres:13
```

Or configure PostgreSQL manually with:
- Database: `aeo_db`
- Username: `postgres`
- Password: `password`
- Host: `localhost`
- Port: `5432`

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=aeo_db
JWT_SECRET=your-super-secure-jwt-secret-key-here-make-it-very-long-and-random
NODE_ENV=development
EOF

# Start the backend
npm run start:dev
```

The backend will be available at `http://localhost:3001`

### 3. Test Users

The system automatically creates test users with the following credentials:

- **Admin User:** 
  - Email: `admin@aereo.com`
  - Password: `Admin123!`
  - Role: Manager (has admin-level access)

- **Manager User:**
  - Email: `manager@aereo.com`
  - Password: `Manager123!`
  - Role: Supervisor

- **Employee User:**
  - Email: `employee@aereo.com`
  - Password: `Employee123!`
  - Role: Employee

## 🧪 Testing Methods

### Method 1: Automated Test Suite

Run the comprehensive test suite:

```bash
cd backend
node test-reports.js
```

This will test:
- Authentication for all user roles
- All 7 endpoints in JSON format
- All 7 endpoints in CSV format
- Authorization restrictions
- Error handling

### Method 2: Manual API Testing

#### Step 1: Authenticate
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@aereo.com",
    "password": "Admin123!"
  }'
```

Save the `access_token` from the response.

#### Step 2: Test Reports Endpoints

**Attendance Report (JSON):**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/reports/attendance?startDate=2024-01-01&endDate=2024-12-31&stationId=1"
```

**Attendance Report (CSV):**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/reports/attendance?startDate=2024-01-01&endDate=2024-12-31&stationId=1&format=csv"
```

**Coverage Report:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/reports/coverage"
```

**Operational Metrics:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/reports/operational-metrics?startDate=2024-01-01&endDate=2024-12-31"
```

### Method 3: Frontend Integration Test

Open the HTML test page:

```bash
# From the repository root
open test-frontend-integration.html
# or navigate to it in your browser
```

This provides a web interface to:
- Authenticate with the backend
- Test all endpoints with buttons
- View JSON and CSV responses
- See success/failure status for each endpoint

## 🐛 Issues Found and Fixed

### 1. Controller Response Handling
**Problem:** Endpoints were hanging due to incorrect `@Res()` decorator usage
**Solution:** Added `{ passthrough: true }` to allow NestJS to handle responses properly

### 2. Attendance Report Processing
**Problem:** Infinite loop when no users found for specified station
**Solution:** Added early return when user array is empty

### 3. Operational Metrics SQL Error
**Problem:** Complex subquery causing PostgreSQL syntax errors
**Solution:** Simplified the query to avoid unsupported subquery syntax

### 4. Test Authentication
**Problem:** Incorrect test credentials and domains
**Solution:** Updated test script with correct passwords (`Admin123!`, etc.) and domain (`@aereo.com`)

## 📝 Response Formats

### JSON Response Structure

**Attendance Report:**
```json
{
  "summary": {
    "totalEmployees": 0,
    "presentToday": 0,
    "absentToday": 0,
    "attendanceRate": 0
  },
  "details": [],
  "message": "No se encontraron usuarios para los filtros especificados"
}
```

**Coverage Report:**
```json
[
  {
    "stationId": 1,
    "stationName": "Terminal A",
    "requiredStaff": 5,
    "currentStaff": 3,
    "coveragePercentage": 60,
    "isUnderstaffed": true
  }
]
```

**Operational Metrics:**
```json
{
  "totalOperations": 0,
  "completedOperations": 0,
  "cancelledOperations": 0,
  "operationCompletionRate": 0,
  "totalFlights": 0,
  "totalPassengers": 0,
  "averageStaffPerOperation": 0
}
```

### CSV Response

All endpoints support CSV export by adding `?format=csv` to the request. The CSV format includes headers and properly escaped values.

## 🔒 Security & Authorization

### Authentication
- All endpoints require JWT token authentication
- Tokens obtained via `POST /auth/login`
- Include token in `Authorization: Bearer <token>` header

### Authorization Matrix

| Endpoint | Admin | Manager | Supervisor | Employee | President |
|----------|-------|---------|------------|----------|-----------|
| attendance | ✅ | ✅ | ✅ | ❌ | ✅ |
| overtime | ✅ | ✅ | ✅ | ❌ | ✅ |
| coverage | ✅ | ✅ | ✅ | ❌ | ✅ |
| weekly-schedule | ✅ | ✅ | ✅ | ❌ | ✅ |
| employee-schedule | ✅ | ✅ | ✅ | ✅* | ✅ |
| cost-analysis | ✅ | ✅ | ❌ | ❌ | ✅ |
| operational-metrics | ✅ | ✅ | ❌ | ❌ | ✅ |

*Employee can only view their own schedule data

## 🚀 API Documentation

Full API documentation is available via Swagger UI at:
`http://localhost:3001/api`

## 📞 Support

If you encounter any issues:

1. Check that PostgreSQL is running and accessible
2. Verify environment variables are set correctly
3. Ensure test users are created (run the create-test-users endpoint)
4. Check backend logs for detailed error messages
5. Verify JWT token is valid and not expired

For development issues, check the backend logs which provide detailed information about authentication, database queries, and error handling.
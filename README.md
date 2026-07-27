# Connectors API

Express TypeScript middleware API for Salesforce and QuickBooks integrations. The service exposes validated REST endpoints for website lead capture, Salesforce Lead creation and lookup, QuickBooks OAuth, QuickBooks customers, QuickBooks invoices, health checks, and Swagger/OpenAPI documentation.

## What This Project Does

- Receives lead forms from external websites or client apps.
- Validates request bodies with Zod before they reach controllers.
- Maps each lead payload into a Salesforce `Lead` record.
- Stores the complete original lead payload in Salesforce custom form-data fields when those fields exist.
- Lists and fetches Salesforce leads through SOQL queries.
- Runs a QuickBooks OAuth connection flow.
- Stores QuickBooks tokens locally in `.env` during local development or in Upstash/Vercel KV when deployed to Vercel.
- Refreshes QuickBooks access tokens automatically when needed.
- Creates and reads QuickBooks customers and invoices.
- Serves Swagger UI at `/api/v1/docs` and OpenAPI JSON at `/api/v1/docs.json`.

## Tech Stack

- Node.js 20+
- Express 5
- TypeScript
- Zod
- Axios
- Vitest
- Supertest
- Upstash Redis for Vercel token persistence
- Vercel serverless deployment through `api/index.ts`

## Project Structure

```text
.
+-- api/
|   +-- index.ts                    # Vercel entrypoint
+-- src/
|   +-- app.ts                      # Express app, routes, Swagger UI
|   +-- server.ts                   # Local server startup
|   +-- config/                     # Environment-backed integration config
|   +-- controllers/                # Request handlers
|   +-- docs/swagger.ts             # OpenAPI document used by Swagger UI
|   +-- middlewares/                # Validation, logging, errors
|   +-- routes/                     # Route registration
|   +-- services/
|   |   +-- quickbooks/             # OAuth, credentials, API clients, mappers
|   |   +-- salesforce/             # OAuth client, lead service, mappers
|   +-- tests/                      # Vitest tests
|   +-- types/                      # Express type augmentation
|   +-- utils/                      # Logger, errors, pagination, responses
|   +-- validators/                 # Zod request schemas
+-- package.json
+-- tsconfig.json
+-- vercel.json
```

## Installation

```bash
npm install
```

The project requires Node.js `>=20`.

## Environment Variables

Create a `.env` file for local development. Do not commit real secrets.

```env
NODE_ENV=development
PORT=3000

SALESFORCE_CLIENT_ID=
SALESFORCE_CLIENT_SECRET=
SALESFORCE_TOKEN_URL=
SALESFORCE_API_VERSION=v61.0

QUICKBOOKS_ENABLED=true
QUICKBOOKS_ENVIRONMENT=sandbox
QUICKBOOKS_CLIENT_ID=
QUICKBOOKS_CLIENT_SECRET=
QUICKBOOKS_REDIRECT_URI=http://localhost:3000/api/v1/quickbooks/auth/callback
QUICKBOOKS_MINOR_VERSION=75
QUICKBOOKS_SCOPES=com.intuit.quickbooks.accounting

QUICKBOOKS_ACCESS_TOKEN=
QUICKBOOKS_REFRESH_TOKEN=
QUICKBOOKS_REALM_ID=
QUICKBOOKS_ACCESS_TOKEN_EXPIRES_AT=
QUICKBOOKS_REFRESH_TOKEN_EXPIRES_AT=
QUICKBOOKS_COMPANY_NAME=

KV_REST_API_URL=
KV_REST_API_TOKEN=
```

### Variable Notes

| Variable | Purpose |
| --- | --- |
| `PORT` | Local Express port. Defaults to `3000`. |
| `SALESFORCE_CLIENT_ID` | Salesforce connected app client ID. |
| `SALESFORCE_CLIENT_SECRET` | Salesforce connected app client secret. |
| `SALESFORCE_TOKEN_URL` | Salesforce OAuth token URL. |
| `SALESFORCE_API_VERSION` | Salesforce REST API version. Defaults to `v61.0`. |
| `QUICKBOOKS_ENABLED` | Must be `true` for QuickBooks integration health to report as configured. |
| `QUICKBOOKS_ENVIRONMENT` | `sandbox` or `production`. `development` is normalized to `sandbox`. |
| `QUICKBOOKS_CLIENT_ID` | Intuit app client ID. |
| `QUICKBOOKS_CLIENT_SECRET` | Intuit app client secret. |
| `QUICKBOOKS_REDIRECT_URI` | Callback URL registered in the Intuit app. |
| `QUICKBOOKS_MINOR_VERSION` | QuickBooks API minor version. Defaults to `75`. |
| `QUICKBOOKS_SCOPES` | Space-separated Intuit OAuth scopes. Defaults to `com.intuit.quickbooks.accounting`. |
| `QUICKBOOKS_ACCESS_TOKEN` | Optional stored access token. |
| `QUICKBOOKS_REFRESH_TOKEN` | Stored refresh token used to refresh access. |
| `QUICKBOOKS_REALM_ID` | QuickBooks company ID from OAuth callback. |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Required on Vercel for persistent QuickBooks credential storage. |

## Running Locally

```bash
npm run dev
```

The server prints:

```text
Connectors running at http://localhost:3000
Swagger UI: http://localhost:3000/api/v1/docs
OpenAPI JSON: http://localhost:3000/api/v1/docs.json
```

## Build, Test, and Start

```bash
npm run build
npm test
npm start
```

Scripts:

| Script | Description |
| --- | --- |
| `npm run dev` | Starts `tsx watch src/server.ts`. |
| `npm run build` | Compiles TypeScript into `dist/`. |
| `npm start` | Runs `node dist/server.js`. |
| `npm test` | Runs Vitest once. |
| `npm run test:watch` | Runs Vitest in watch mode. |

## Swagger and OpenAPI

Swagger UI is served directly by the Express app:

- UI: `GET /api/v1/docs`
- OpenAPI JSON: `GET /api/v1/docs.json`
- Docs health: `GET /api/v1/docs-health`
- Root redirect: `GET /` redirects to `/api/v1/docs`

The OpenAPI document lives in `src/docs/swagger.ts`. Update that file whenever routes, request bodies, query parameters, or examples change.

Swagger UI assets are loaded from CDN. Requests to local Swagger UI asset paths return a JSON message explaining that assets are CDN-hosted.

## API Base URL

Local base URL:

```text
http://localhost:3000/api/v1
```

OpenAPI uses a relative server URL:

```json
{
  "servers": [{ "url": "/api/v1" }]
}
```

## Standard Responses

Most successful controller responses use:

```json
{
  "success": true,
  "data": {}
}
```

Salesforce list responses use:

```json
{
  "success": true,
  "pagination": {
    "page": 1,
    "limit": 20,
    "hasNextPage": false,
    "nextCursor": null
  },
  "data": []
}
```

Errors use:

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "details": {}
  }
}
```

Validation errors return HTTP `400`. Missing routes return HTTP `404`. Integration configuration or connection problems commonly return HTTP `503`.

## Health Endpoints

### Health Check

```http
GET /api/v1/health
```

Response example:

```json
{
  "status": "ok",
  "service": "connectors",
  "timestamp": "2026-07-18T14:00:00.000Z"
}
```

### Integration Health

```http
GET /api/v1/health/integrations
```

Checks whether Salesforce and QuickBooks are configured and, where possible, connected.

Response example:

```json
{
  "status": "ok",
  "integrations": {
    "salesforce": "connected",
    "quickbooks": "configured"
  },
  "quickbooksDiagnostics": {
    "enabled": true,
    "environment": "sandbox",
    "configured": true,
    "connected": false,
    "hasClientId": true,
    "hasClientSecret": true,
    "hasRedirectUri": true,
    "hasAccessToken": false,
    "hasRefreshToken": false,
    "hasRealmId": false,
    "missing": {
      "configuration": [],
      "connection": ["QUICKBOOKS_REFRESH_TOKEN", "QUICKBOOKS_REALM_ID"]
    }
  }
}
```

## Salesforce Lead Flow

1. A client posts a validated lead payload to one of the lead endpoints.
2. The route applies the matching Zod validator.
3. The controller calls `createSalesforceLead(serviceType, body)`.
4. The Salesforce service gets an access token and creates an Axios client.
5. The mapper builds a Salesforce Lead record:
   - `FirstName` and `LastName` are split from `fullName`.
   - `Company` is selected from `companyName`, `organization`, `shipperName`, or `Individual`.
   - `Email` comes from `emailAddress`.
   - `Phone` comes from `phoneNumber`.
   - `LeadSource` is set by service type.
   - `Status` is `New`.
   - `Service_Type__c` stores the service type when supported by the Salesforce org.
   - `Form_Data__c` stores the original payload as JSON when supported by the Salesforce org.
6. Before creation, the service calls Salesforce `Lead` describe metadata and removes fields that are not createable in the connected org.
7. Salesforce returns the created lead ID.

Common required lead fields for all Salesforce lead creation endpoints:

```json
{
  "fullName": "Ahmed Hassan",
  "phoneNumber": "+201001234567",
  "emailAddress": "ahmed.hassan@example.com"
}
```

### Create Business Lead

```http
POST /api/v1/salesforce/leads/business
Content-Type: application/json
```

```json
{
  "fullName": "Ahmed Hassan",
  "phoneNumber": "+201001234567",
  "emailAddress": "ahmed.hassan@example.com",
  "dateOfBirth": "1990-05-14",
  "passportNumber": "A12345678",
  "gender": "male",
  "countryOfDeparture": "Egypt",
  "destinationCountryCity": "Dubai, UAE",
  "jobTitle": "Operations Manager",
  "companyName": "Entertab Logistics",
  "companyIndustry": "Logistics",
  "preferredDepartureDate": "2026-08-01",
  "preferredReturnDate": "2026-08-07",
  "travelAlone": true,
  "requiredSupportServices": ["Flight booking", "Hotel reservation"],
  "specialInstructions": "Window seat preferred",
  "additionalNotes": "Needs visa support guidance"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "00Q8c00001ABCDeEAH",
    "serviceType": "business",
    "created": true
  }
}
```

### Create Medical Lead

```http
POST /api/v1/salesforce/leads/medical
Content-Type: application/json
```

```json
{
  "fullName": "Mona Adel",
  "phoneNumber": "+201009876543",
  "emailAddress": "mona.adel@example.com",
  "dateOfBirth": "1985-11-20",
  "passportNumber": "B98765432",
  "gender": "female",
  "countryOfResidence": "Egypt",
  "destinationCountry": "Germany",
  "preferredDeparture": "2026-09-10",
  "preferredReturn": "2026-09-25",
  "travelAlone": false,
  "whoAccompanies": "Spouse",
  "bookingFlights": "yes",
  "accommodation": "yes",
  "transportation": "yes",
  "interpreter": "Arabic-German",
  "medicalArrangements": "Cardiology consultation",
  "hospitalAssistance": "yes",
  "specifyMedical": "Follow-up surgery consultation",
  "preferredClinic": "Berlin Heart Center",
  "additionalNotes": "Requires wheelchair assistance"
}
```

### Create Event Lead

```http
POST /api/v1/salesforce/leads/events
Content-Type: application/json
```

```json
{
  "fullName": "Sara Nabil",
  "phoneNumber": "+201055512345",
  "emailAddress": "sara.nabil@example.com",
  "organization": "Bright Future Foundation",
  "position": "Program Director",
  "eventName": "Annual Partner Summit",
  "eventType": "Conference",
  "theme": "Innovation in Education",
  "preferredDate": "2026-10-15",
  "duration": "2 days",
  "expectedAttendees": 250,
  "targetAudience": "NGO partners and sponsors",
  "preferredVenue": "Downtown Conference Center",
  "city": "Cairo",
  "country": "Egypt",
  "indoorOutdoor": "Indoor",
  "venueSuggestionsNeeded": true,
  "bookingSupportNeeded": true,
  "coreServices": ["Event planning", "AV setup"],
  "additionalServices": ["Photography", "Catering"],
  "additionalServicesOther": "Live streaming",
  "estimatedBudget": 150000,
  "additionalNotes": "Need bilingual host"
}
```

### Create Shipping Lead

```http
POST /api/v1/salesforce/leads/shipping
Content-Type: application/json
```

```json
{
  "fullName": "Omar Samir",
  "phoneNumber": "+201066677788",
  "emailAddress": "omar.samir@example.com",
  "shipperName": "Global Trade LLC",
  "shipperContactPerson": "Omar Samir",
  "shipperAddress": "12 Nile Street, Cairo",
  "originCity": "Cairo",
  "originStateProvince": "Cairo Governorate",
  "originPostalCode": "11511",
  "originDestinationCountry": "Egypt",
  "recipientName": "Riyadh Retail Co.",
  "recipientContactPerson": "Fahad Ali",
  "recipientPhone": "+966501234567",
  "recipientEmail": "fahad.ali@example.com",
  "recipientAddress": "King Fahd Road, Riyadh",
  "department": "Procurement",
  "destinationCity": "Riyadh",
  "destinationStateProvince": "Riyadh Province",
  "destinationPostalCode": "12211",
  "finalDestinationCountry": "Saudi Arabia",
  "itemDescription": "Consumer electronics",
  "numberOfPackages": 12,
  "weight": 185.5,
  "dimensions": "12 boxes, 60x40x35 cm each",
  "declaredValue": 25000,
  "shippingMethod": "Air freight",
  "urgentShipping": "yes",
  "trackingRequired": "yes",
  "insurance": "full",
  "preferredPickupDate": "2026-07-12",
  "preferredDeliveryDate": "2026-07-14",
  "attachments": [],
  "additionalNotes": "Handle with care"
}
```

Shipping payload compatibility:

- `contactPerson` is normalized to `shipperContactPerson` if present.
- `destinationCountry` is normalized to `finalDestinationCountry` if present.

### Create Transportation Lead

```http
POST /api/v1/salesforce/leads/transportation
Content-Type: application/json
```

```json
{
  "fullName": "Youssef Magdy",
  "phoneNumber": "+201011122233",
  "emailAddress": "youssef.magdy@example.com",
  "pickupLocation": "Cairo International Airport",
  "dropoffLocation": "New Cairo",
  "tripType": "One way",
  "pickupDate": "2026-07-20",
  "pickupTime": "18:30",
  "numberOfPassengers": 3,
  "childSeat": "no",
  "luggage": "4 large bags",
  "vehicleType": "SUV",
  "specialRequests": "Driver should wait at arrivals gate"
}
```

### Create Travel Lead

```http
POST /api/v1/salesforce/leads/travel
Content-Type: application/json
```

```json
{
  "fullName": "Laila Mostafa",
  "phoneNumber": "+201022233344",
  "emailAddress": "laila.mostafa@example.com",
  "tripType": "Round trip",
  "flightClass": "Business",
  "leavingFrom": "Cairo",
  "goingTo": "Paris",
  "departingDate": "2026-09-05",
  "returnDate": "2026-09-12",
  "airline": "EgyptAir",
  "stops": 0,
  "destination": "Paris, France",
  "adults": 2,
  "children": 1,
  "infants": 0,
  "hotelName": "Le Grand Paris",
  "roomType": "Deluxe Suite",
  "checkInDate": "2026-09-05",
  "checkOutDate": "2026-09-12",
  "nightsCount": 7,
  "mealPreference": "Breakfast included",
  "pickupLocation": "Charles de Gaulle Airport",
  "dropoffLocation": "Le Grand Paris",
  "pickupDate": "2026-09-05",
  "pickupTime": "14:00",
  "rentalPickupDate": "2026-09-06",
  "rentalDropoffDate": "2026-09-11",
  "carType": "Compact SUV",
  "driverAge": 34,
  "specialRequests": "Need Eiffel Tower view if possible"
}
```

### Find Salesforce Lead by Email or Phone

```http
GET /api/v1/salesforce/leads?email=test@example.com&phone=+201000000000
```

Provide `email`, `phone`, or both. If both are provided, either value can match.
The endpoint returns the matching Salesforce lead ID, HTTP `400` when neither
value is provided, and HTTP `404` when no lead matches.

Supported query parameters:

| Parameter | Description |
| --- | --- |
| `email` | Lead email address. |
| `phone` | Lead phone number. |

Response:

```json
{
  "success": true,
  "data": {
    "id": "00Q8c00001ABCDeEAH"
  }
}
```

### Get Salesforce Lead by ID

```http
GET /api/v1/salesforce/leads/00Q8c00001ABCDeEAH
```

Returns one normalized Salesforce lead or HTTP `404` when no record is found.

## QuickBooks Connection Flow

QuickBooks endpoints require the Intuit app credentials and one successful OAuth approval.

1. Configure:
   - `QUICKBOOKS_ENABLED=true`
   - `QUICKBOOKS_ENVIRONMENT=sandbox` or `production`
   - `QUICKBOOKS_CLIENT_ID`
   - `QUICKBOOKS_CLIENT_SECRET`
   - `QUICKBOOKS_REDIRECT_URI`
2. Start the API.
3. Open:

```http
GET /api/v1/quickbooks/connect
```

4. Complete the Intuit authorization screen.
5. Intuit redirects back with `code` and `realmId`.
6. The callback exchanges the code for tokens.
7. Tokens and company data are stored:
   - Locally: written back into `.env`.
   - Vercel: stored in Upstash Redis using `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
8. Customer and invoice endpoints can be called directly after connection.

The callback routes are:

```http
GET /api/v1/quickbooks/callback
GET /api/v1/quickbooks/auth/callback
GET /api/quickbooks/auth/callback
```

The extra `/api/quickbooks/auth/callback` route exists for compatibility with callback URLs outside the `/api/v1` route group.

## QuickBooks Endpoints

### Generate Auth URL

```http
GET /api/v1/quickbooks/auth-url
```

Response:

```json
{
  "success": true,
  "data": {
    "url": "https://appcenter.intuit.com/connect/oauth2?client_id=..."
  }
}
```

### Redirect to Intuit OAuth

```http
GET /api/v1/quickbooks/connect
```

Redirects to the Intuit OAuth consent page.

### Ensure QuickBooks Connection

```http
POST /api/v1/quickbooks/connect
```

Uses the stored refresh token to obtain a valid access token if needed.

Response:

```json
{
  "success": true,
  "data": {
    "connected": true,
    "realmId": "123145859011234",
    "companyName": "Example Company"
  }
}
```

### Connection Status

```http
GET /api/v1/quickbooks/status
```

Response:

```json
{
  "success": true,
  "data": {
    "connected": true,
    "environment": "sandbox",
    "hasAccessToken": true,
    "hasRefreshToken": true,
    "hasRealmId": true,
    "realmId": "123145859011234",
    "companyName": "Example Company",
    "accessTokenExpiresAt": "2026-07-18T15:00:00.000Z",
    "refreshTokenExpiresAt": "2026-10-16T14:00:00.000Z",
    "diagnostics": {},
    "nextAction": "QuickBooks is connected."
  }
}
```

### OAuth Callback

```http
GET /api/v1/quickbooks/auth/callback?code=AB1156789oauthcode&realmId=123145859011234&state=connectors-mvp
```

If the request accepts HTML, the callback redirects to:

```text
/api/v1/docs?quickbooks=connected
```

JSON response example:

```json
{
  "success": true,
  "data": {
    "state": "connectors-mvp",
    "realmId": "123145859011234",
    "instructions": "QuickBooks credentials were stored in persistent storage. You can now call the customer and invoice endpoints directly."
  }
}
```

### Refresh QuickBooks Token

```http
POST /api/v1/quickbooks/refresh-token
Content-Type: application/json
```

```json
{
  "refreshToken": "sample-refresh-token"
}
```

`refreshToken` is optional if a refresh token is already stored in configuration or persistent storage.

### Create QuickBooks Customer

```http
POST /api/v1/quickbooks/customers
Content-Type: application/json
```

```json
{
  "displayName": "Ahmed Hassan",
  "givenName": "Ahmed",
  "familyName": "Hassan",
  "primaryEmailAddr": "ahmed@example.com",
  "primaryPhone": "+201001234567",
  "companyName": "Entertab LLC"
}
```

Response data:

```json
{
  "id": "58",
  "displayName": "Ahmed Hassan",
  "givenName": "Ahmed",
  "familyName": "Hassan",
  "companyName": "Entertab LLC",
  "email": "ahmed@example.com",
  "phone": "+201001234567",
  "active": true
}
```

If `primaryEmailAddr` already belongs to an active QuickBooks customer, the endpoint returns that existing customer instead of creating a duplicate. If QuickBooks rejects the payload, the API returns the QuickBooks error details with the original QuickBooks status code.

### List QuickBooks Customers

```http
GET /api/v1/quickbooks/customers?page=1&limit=20&search=Ahmed
```

Internally runs a QuickBooks query similar to:

```sql
SELECT * FROM Customer WHERE DisplayName LIKE '%Ahmed%' STARTPOSITION 1 MAXRESULTS 20
```

### Get QuickBooks Customer by ID

```http
GET /api/v1/quickbooks/customers/58
```

### Create QuickBooks Invoice

```http
POST /api/v1/quickbooks/invoices
Content-Type: application/json
```

```json
{
  "billingEmail": "billing@example.com",
  "dueDate": "2026-07-30",
  "privateNote": "Net 15 invoice",
  "lineItems": [
    {
      "productServiceName": "Travel",
      "description": "Travel coordination service",
      "quantity": 2,
      "unitPrice": 1500
    }
  ]
}
```

The service looks up an existing QuickBooks customer by `billingEmail`, uses that customer's QuickBooks ID internally as `CustomerRef.value`, and maps each `productServiceName` to the configured QuickBooks Item ID before creating the invoice. `Amount` is calculated as:

```text
quantity * unitPrice
```

Supported Product/Service names:

| Product/Service Name | QuickBooks Item ID |
| --- | --- |
| Accommodation | 11 |
| Airline Ticket | 114 |
| Car Rental | 51 |
| Car Sales | 65 |
| Car Search | 88 |
| Catering Services | 99 |
| Charge | 55 |
| Container Insurance | 92 |
| Delivery/Moving Service | 16 |
| Design & Creative Services | 95 |
| Dispatch | 86 |
| Education | 26 |
| Extra Hours | 90 |
| Food and Beverage | 97 |
| Holding Items | 59 |
| Labor | 61 |
| Labor/ per hour | 62 |
| Meals and Entertainment | 106 |
| Moving Service | 84 |
| Photographic Services | 104 |
| Product Purchasing | 14 |
| Professional Language Solutions | 1010000071 |
| Rental Car | 67 |
| Sales Tax | 1010000001 |
| Shipping | 3 |
| Shipping and Delivery Services | 1010000231 |
| Shipping:Customs Paid Price | 1010000041 |
| Storage | 57 |
| Support Services | 1010000211 |
| Transportation | 45 |
| Travel | 5 |
| Vehicle Sourcing & Exporting | 108 |

If no existing QuickBooks customer matches `billingEmail`, the endpoint returns HTTP `404`; it does not create a customer automatically.
Before creating the invoice, the service checks that the mapped QuickBooks Item is active and not a category. If the mapped ID points to a category, it tries to find an active non-category QuickBooks Item with the same Product/Service name. If none exists, the endpoint returns HTTP `400` and the QuickBooks Product/Service mapping must be updated to a sellable item.

Response data:

```json
{
  "id": "145",
  "customerId": "58",
  "totalAmount": 3000,
  "balance": 3000,
  "dueDate": "2026-07-30",
  "privateNote": "Net 15 invoice",
  "txnDate": "2026-07-18"
}
```

### List QuickBooks Invoices

```http
GET /api/v1/quickbooks/invoices?page=1&limit=20&customerId=58
```

Internally runs a QuickBooks query similar to:

```sql
SELECT * FROM Invoice WHERE CustomerRef = '58' STARTPOSITION 1 MAXRESULTS 20
```

### Get QuickBooks Invoice by ID

```http
GET /api/v1/quickbooks/invoices/145
```

### List QuickBooks Items

```http
GET /api/v1/quickbooks/items
```

Internally runs this QuickBooks query:

```sql
SELECT * FROM Item STARTPOSITION 1 MAXRESULTS 1000
```

## cURL Examples

Health:

```bash
curl http://localhost:3000/api/v1/health
```

Create a Salesforce travel lead:

```bash
curl -X POST http://localhost:3000/api/v1/salesforce/leads/travel \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Laila Mostafa",
    "phoneNumber": "+201022233344",
    "emailAddress": "laila.mostafa@example.com",
    "tripType": "Round trip",
    "leavingFrom": "Cairo",
    "goingTo": "Paris"
  }'
```

Check QuickBooks status:

```bash
curl http://localhost:3000/api/v1/quickbooks/status
```

Create a QuickBooks customer:

```bash
curl -X POST http://localhost:3000/api/v1/quickbooks/customers \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Ahmed Hassan",
    "givenName": "Ahmed",
    "familyName": "Hassan",
    "primaryEmailAddr": "ahmed@example.com",
    "primaryPhone": "+201001234567",
    "companyName": "Entertab LLC"
  }'
```

Create a QuickBooks invoice:

```bash
curl -X POST http://localhost:3000/api/v1/quickbooks/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "billingEmail": "billing@example.com",
    "dueDate": "2026-07-30",
    "privateNote": "Net 15 invoice",
    "lineItems": [
      {
        "productServiceName": "Travel",
        "description": "Travel coordination service",
        "quantity": 2,
        "unitPrice": 1500
      }
    ]
  }'
```

## Validation Rules

All lead creation endpoints require:

- `fullName`: non-empty string
- `phoneNumber`: string with at least 3 characters
- `emailAddress`: valid email

QuickBooks customer creation requires:

- `displayName`: non-empty string

QuickBooks invoice creation requires:

- `billingEmail`: valid email address for an existing QuickBooks customer
- `lineItems`: at least one item
- each line item requires `productServiceName`, positive `quantity`, and non-negative `unitPrice`
- `productServiceName` must be one of the supported QuickBooks Product/Service names documented in the invoice section

When validation fails, the request is rejected before it reaches the controller.

## Logging and Request IDs

The app uses a request logger middleware and structured logger utility. Failed requests are logged by the error middleware with:

- `requestId`
- error message
- stack trace
- optional details

The local server also logs startup metadata including Swagger URLs and QuickBooks diagnostics.

## How to Develop a New Endpoint

Follow the existing route-controller-service-validator pattern.

1. Add or update a Zod schema in `src/validators/`.
2. Add a controller function in `src/controllers/`.
3. Put integration/API logic in `src/services/`.
4. Register the route in `src/routes/`.
5. Mount the route group in `src/app.ts` if it is a new group.
6. Add examples and parameters to `src/docs/swagger.ts`.
7. Add or update tests in `src/tests/`.
8. Run:

```bash
npm run build
npm test
```

Example route registration:

```ts
router.post("/customers", validateRequest(quickBooksCustomerSchema), createCustomer);
```

Example controller shape:

```ts
export async function createCustomer(req: Request, res: Response) {
  const customer = await createQuickBooksCustomer(req.body);
  res.status(201).json(successResponse(customer));
}
```

Example service shape:

```ts
export async function createQuickBooksCustomer(payload: QuickBooksCustomerInput) {
  const client = await createQuickBooksClient();
  const response = await client.post("/customer", {
    DisplayName: payload.displayName
  });

  return normalizeQuickBooksCustomer(response.data.Customer);
}
```

## Salesforce Development Notes

- Salesforce access is centralized in `src/services/salesforce/salesforce.client.ts`.
- Salesforce lead creation is handled in `src/services/salesforce/salesforce.lead.service.ts`.
- Mapping between public request fields and Salesforce Lead fields lives in `src/services/salesforce/salesforce.mapper.ts`.
- The app caches Salesforce Lead field metadata after the first describe call.
- Only fields marked `createable` by Salesforce are sent.
- Service type custom fields are adapted to the first available field among:
  - `Service_Type__c`
  - `Service_of_Interest__c`
  - `Trip_Service_Type__c`
- Form payload custom fields are adapted to the first available field among:
  - `Form_Data__c`
  - `Form_Data`
  - `Payload__c`
  - `Request_Payload__c`

## QuickBooks Development Notes

- OAuth logic lives in `src/services/quickbooks/quickbooks.auth.service.ts`.
- Token persistence lives in `src/services/quickbooks/quickbooks.credentials.ts`.
- QuickBooks API client creation lives in `src/services/quickbooks/quickbooks.client.ts`.
- Customer and invoice features live in separate service files.
- Response normalization lives in `src/services/quickbooks/quickbooks.mapper.ts`.
- The QuickBooks client automatically retries one request after refreshing the token when Intuit returns HTTP `401`.
- Local development token persistence writes to `.env`.
- Vercel token persistence requires Upstash Redis environment variables.

## Deployment on Vercel

The Vercel config routes all traffic to `api/index.ts`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.ts"
    }
  ]
}
```

For Vercel deployments:

1. Set all required Salesforce and QuickBooks environment variables in Vercel.
2. Set `KV_REST_API_URL` and `KV_REST_API_TOKEN` for QuickBooks persistent token storage.
3. Configure the Intuit app redirect URI to the deployed callback URL, for example:

```text
https://your-domain.vercel.app/api/v1/quickbooks/auth/callback
```

4. Visit `/api/v1/quickbooks/connect` once after deployment to authorize the company.
5. Verify with `/api/v1/quickbooks/status`.

If Vercel is detected with `VERCEL=1` and KV variables are missing, QuickBooks credential persistence returns HTTP `503`.

## Testing

Run all tests:

```bash
npm test
```

The test suite currently covers:

- Express app routing behavior
- QuickBooks behavior
- Salesforce mapping behavior

Use focused tests when adding endpoints so external API calls stay mocked or isolated.

## Common Troubleshooting

### Swagger Opens But API Calls Fail

Check `.env` integration credentials and call:

```http
GET /api/v1/health/integrations
```

### QuickBooks Says Not Connected

Open:

```http
GET /api/v1/quickbooks/connect
```

Complete OAuth, then check:

```http
GET /api/v1/quickbooks/status
```

### QuickBooks Token Is Expired

The API refreshes tokens automatically when possible. You can also call:

```http
POST /api/v1/quickbooks/refresh-token
```

with a `refreshToken`, or omit the body if a refresh token is already stored.

### Salesforce Lead Creation Fails

Check:

- Salesforce connected app credentials.
- `SALESFORCE_TOKEN_URL`.
- Salesforce API version.
- Whether custom fields such as `Service_Type__c` and `Form_Data__c` exist.
- The actual error body returned by Salesforce in the API error `details`.

## Maintenance Checklist

When changing API behavior:

- Keep validators and Swagger examples in sync.
- Add tests for validation and service mapping.
- Avoid putting integration secrets in code or tests.
- Keep controller logic thin.
- Keep external API details inside service modules.
- Normalize external API responses before returning them to clients.

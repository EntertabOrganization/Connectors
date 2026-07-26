import { quickBooksProductServiceNames } from "../services/quickbooks/quickbooks.product-service-map";

export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Connectors API",
    version: "1.0.0",
    description: "Middleware API for Salesforce and QuickBooks integrations."
  },
  tags: [
    {
      name: "Health",
      description: "Health controller endpoints."
    },
    {
      name: "Sales Force",
      description: "Sales Force controller endpoints."
    },
    {
      name: "Quick Box",
      description: "Quick Box controller endpoints."
    }
  ],
  servers: [{ url: "/api/v1" }],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        requestBody: {
          required: false,
          content: {
            "application/json": {
              example: {}
            }
          }
        },
        responses: {
          "200": { description: "Service is healthy" }
        }
      }
    },
    "/health/integrations": {
      get: {
        tags: ["Health"],
        summary: "Integration health",
        requestBody: {
          required: false,
          content: {
            "application/json": {
              example: {}
            }
          }
        },
        responses: {
          "200": { description: "Integration status returned" }
        }
      }
    },
    "/salesforce/leads/business": {
      post: {
        tags: ["Sales Force"],
        summary: "Create business lead",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                fullName: "Ahmed Hassan",
                phoneNumber: "+201001234567",
                emailAddress: "ahmed.hassan@example.com",
                dateOfBirth: "1990-05-14",
                passportNumber: "A12345678",
                gender: "male",
                countryOfDeparture: "Egypt",
                destinationCountryCity: "Dubai, UAE",
                jobTitle: "Operations Manager",
                companyName: "Entertab Logistics",
                companyIndustry: "Logistics",
                preferredDepartureDate: "2026-08-01",
                preferredReturnDate: "2026-08-07",
                travelAlone: true,
                requiredSupportServices: ["Flight booking", "Hotel reservation"],
                specialInstructions: "Window seat preferred",
                additionalNotes: "Needs visa support guidance"
              }
            }
          }
        },
        responses: {
          "201": {
            description:
              "Created, or returned the existing active customer when primaryEmailAddr already matched."
          },
          "400": { description: "Validation failed or QuickBooks rejected the customer payload." }
        }
      }
    },
    "/salesforce/leads/medical": {
      post: {
        tags: ["Sales Force"],
        summary: "Create medical lead",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                fullName: "Mona Adel",
                phoneNumber: "+201009876543",
                emailAddress: "mona.adel@example.com",
                dateOfBirth: "1985-11-20",
                passportNumber: "B98765432",
                gender: "female",
                countryOfResidence: "Egypt",
                destinationCountry: "Germany",
                preferredDeparture: "2026-09-10",
                preferredReturn: "2026-09-25",
                travelAlone: false,
                whoAccompanies: "Spouse",
                bookingFlights: "yes",
                accommodation: "yes",
                transportation: "yes",
                interpreter: "Arabic-German",
                medicalArrangements: "Cardiology consultation",
                hospitalAssistance: "yes",
                specifyMedical: "Follow-up surgery consultation",
                preferredClinic: "Berlin Heart Center",
                additionalNotes: "Requires wheelchair assistance"
              }
            }
          }
        },
        responses: { "201": { description: "Created" } }
      }
    },
    "/salesforce/leads/events": {
      post: {
        tags: ["Sales Force"],
        summary: "Create event lead",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                fullName: "Sara Nabil",
                phoneNumber: "+201055512345",
                emailAddress: "sara.nabil@example.com",
                organization: "Bright Future Foundation",
                position: "Program Director",
                eventName: "Annual Partner Summit",
                eventType: "Conference",
                theme: "Innovation in Education",
                preferredDate: "2026-10-15",
                duration: "2 days",
                expectedAttendees: 250,
                targetAudience: "NGO partners and sponsors",
                preferredVenue: "Downtown Conference Center",
                city: "Cairo",
                country: "Egypt",
                indoorOutdoor: "Indoor",
                venueSuggestionsNeeded: true,
                bookingSupportNeeded: true,
                coreServices: ["Event planning", "AV setup"],
                additionalServices: ["Photography", "Catering"],
                additionalServicesOther: "Live streaming",
                estimatedBudget: 150000,
                additionalNotes: "Need bilingual host"
              }
            }
          }
        },
        responses: { "201": { description: "Created" } }
      }
    },
    "/salesforce/leads/shipping": {
      post: {
        tags: ["Sales Force"],
        summary: "Create shipping lead",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                fullName: "Omar Samir",
                phoneNumber: "+201066677788",
                emailAddress: "omar.samir@example.com",
                shipperName: "Global Trade LLC",
                shipperContactPerson: "Omar Samir",
                shipperAddress: "12 Nile Street, Cairo",
                originCity: "Cairo",
                originStateProvince: "Cairo Governorate",
                originPostalCode: "11511",
                originDestinationCountry: "Egypt",
                recipientName: "Riyadh Retail Co.",
                recipientContactPerson: "Fahad Ali",
                recipientPhone: "+966501234567",
                recipientEmail: "fahad.ali@example.com",
                recipientAddress: "King Fahd Road, Riyadh",
                department: "Procurement",
                destinationCity: "Riyadh",
                destinationStateProvince: "Riyadh Province",
                destinationPostalCode: "12211",
                finalDestinationCountry: "Saudi Arabia",
                itemDescription: "Consumer electronics",
                numberOfPackages: 12,
                weight: 185.5,
                dimensions: "12 boxes, 60x40x35 cm each",
                declaredValue: 25000,
                shippingMethod: "Air freight",
                urgentShipping: "yes",
                trackingRequired: "yes",
                insurance: "full",
                preferredPickupDate: "2026-07-12",
                preferredDeliveryDate: "2026-07-14",
                attachments: [],
                additionalNotes: "Handle with care"
              }
            }
          }
        },
        responses: { "201": { description: "Created" } }
      }
    },
    "/salesforce/leads/transportation": {
      post: {
        tags: ["Sales Force"],
        summary: "Create transportation lead",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                fullName: "Youssef Magdy",
                phoneNumber: "+201011122233",
                emailAddress: "youssef.magdy@example.com",
                pickupLocation: "Cairo International Airport",
                dropoffLocation: "New Cairo",
                tripType: "One way",
                pickupDate: "2026-07-20",
                pickupTime: "18:30",
                numberOfPassengers: 3,
                childSeat: "no",
                luggage: "4 large bags",
                vehicleType: "SUV",
                specialRequests: "Driver should wait at arrivals gate"
              }
            }
          }
        },
        responses: { "201": { description: "Created" } }
      }
    },
    "/salesforce/leads/travel": {
      post: {
        tags: ["Sales Force"],
        summary: "Create travel lead",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                fullName: "Laila Mostafa",
                phoneNumber: "+201022233344",
                emailAddress: "laila.mostafa@example.com",
                tripType: "Round trip",
                flightClass: "Business",
                leavingFrom: "Cairo",
                goingTo: "Paris",
                departingDate: "2026-09-05",
                returnDate: "2026-09-12",
                airline: "EgyptAir",
                stops: 0,
                destination: "Paris, France",
                adults: 2,
                children: 1,
                infants: 0,
                hotelName: "Le Grand Paris",
                roomType: "Deluxe Suite",
                checkInDate: "2026-09-05",
                checkOutDate: "2026-09-12",
                nightsCount: 7,
                mealPreference: "Breakfast included",
                pickupLocation: "Charles de Gaulle Airport",
                dropoffLocation: "Le Grand Paris",
                pickupDate: "2026-09-05",
                pickupTime: "14:00",
                rentalPickupDate: "2026-09-06",
                rentalDropoffDate: "2026-09-11",
                carType: "Compact SUV",
                driverAge: 34,
                specialRequests: "Need Eiffel Tower view if possible"
              }
            }
          }
        },
        responses: { "201": { description: "Created" } }
      }
    },
    "/salesforce/leads": {
      get: {
        tags: ["Sales Force"],
        summary: "Find Salesforce lead by email or phone",
        parameters: [
          {
            name: "email",
            in: "query",
            description:
              "Lead email address. Provide email, phone, or both to return the matching lead id.",
            schema: { type: "string", example: "laila.mostafa@example.com" }
          },
          {
            name: "phone",
            in: "query",
            description:
              "Lead phone number. If email is also provided, either value can match.",
            schema: { type: "string", example: "+201022233344" }
          }
        ],
        responses: {
          "200": { description: "{ success: true, data: { id } }" },
          "400": { description: "Email or phone is required" },
          "404": { description: "Salesforce lead not found" }
        }
      }
    },
    "/salesforce/leads/{id}": {
      get: {
        tags: ["Sales Force"],
        summary: "Get Salesforce lead by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", example: "00Q8c00001ABCDeEAH" }
          }
        ],
        responses: { "200": { description: "Lead detail" } }
      }
    },
    "/quickbooks/auth-url": {
      get: {
        tags: ["Quick Box"],
        summary: "Generate QuickBooks auth URL",
        requestBody: {
          required: false,
          content: {
            "application/json": {
              example: {}
            }
          }
        },
        responses: { "200": { description: "Auth URL" } }
      }
    },
    "/quickbooks/connect": {
      get: {
        tags: ["Quick Box"],
        summary: "Redirect to QuickBooks authorization",
        description:
          "Opens the Intuit consent screen. Complete this once, then the app stores the tokens and realm ID in persistent storage for direct endpoint usage on Vercel.",
        responses: { "302": { description: "Redirects to Intuit OAuth consent" } }
      },
      post: {
        tags: ["Quick Box"],
        summary: "Ensure QuickBooks connection is ready",
        description:
          "Uses the stored refresh token to obtain a current access token. Returns 503 with an authorization URL if QuickBooks has not been connected yet.",
        responses: { "200": { description: "QuickBooks connection is ready" } }
      }
    },
    "/quickbooks/status": {
      get: {
        tags: ["Quick Box"],
        summary: "Get QuickBooks connection status",
        responses: { "200": { description: "Connection status returned" } }
      }
    },
    "/quickbooks/auth/callback": {
      get: {
        tags: ["Quick Box"],
        summary: "Handle QuickBooks OAuth callback",
        parameters: [
          {
            name: "code",
            in: "query",
            required: true,
            schema: { type: "string", example: "AB1156789oauthcode" }
          },
          {
            name: "realmId",
            in: "query",
            schema: { type: "string", example: "123145859011234" }
          },
          {
            name: "state",
            in: "query",
            schema: { type: "string", example: "connectors-mvp-state" }
          }
        ],
        responses: { "200": { description: "Token payload" } }
      }
    },
    "/quickbooks/refresh-token": {
      post: {
        tags: ["Quick Box"],
        summary: "Refresh QuickBooks token",
        requestBody: {
          required: false,
          content: {
            "application/json": {
              example: {
                refreshToken: "sample-refresh-token"
              }
            }
          }
        },
        responses: { "200": { description: "Refreshed token" } }
      }
    },
    "/quickbooks/customers": {
      post: {
        tags: ["Quick Box"],
        summary: "Create QuickBooks customer",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                displayName: "Ahmed Hassan",
                givenName: "Ahmed",
                familyName: "Hassan",
                primaryEmailAddr: "ahmed@example.com",
                primaryPhone: "+201001234567",
                companyName: "Entertab LLC"
              }
            }
          }
        },
        responses: {
          "201": { description: "Created" },
          "400": { description: "Validation failed or QuickBooks rejected the invoice payload." },
          "404": { description: "No QuickBooks customer matched billingEmail." }
        }
      },
      get: {
        tags: ["Quick Box"],
        summary: "List QuickBooks customers",
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", example: 1 }
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", example: 20 }
          },
          {
            name: "search",
            in: "query",
            schema: { type: "string", example: "Ahmed" }
          }
        ],
        responses: { "200": { description: "Customer list" } }
      }
    },
    "/quickbooks/customers/{id}": {
      get: {
        tags: ["Quick Box"],
        summary: "Get QuickBooks customer by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", example: "58" }
          }
        ],
        responses: { "200": { description: "Customer detail" } }
      }
    },
    "/quickbooks/invoices": {
      post: {
        tags: ["Quick Box"],
        summary: "Create QuickBooks invoice",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["billingEmail", "lineItems"],
                properties: {
                  billingEmail: {
                    type: "string",
                    format: "email",
                    example: "billing@example.com"
                  },
                  dueDate: {
                    type: "string",
                    example: "2026-07-30"
                  },
                  privateNote: {
                    type: "string",
                    example: "Net 15 invoice"
                  },
                  lineItems: {
                    type: "array",
                    minItems: 1,
                    items: {
                      type: "object",
                      required: ["productServiceName", "quantity", "unitPrice"],
                      properties: {
                        productServiceName: {
                          type: "string",
                          enum: quickBooksProductServiceNames,
                          example: "Travel"
                        },
                        description: {
                          type: "string",
                          example: "Travel coordination service"
                        },
                        quantity: {
                          type: "number",
                          example: 2
                        },
                        unitPrice: {
                          type: "number",
                          example: 1500
                        }
                      }
                    }
                  }
                }
              },
              example: {
                billingEmail: "billing@example.com",
                dueDate: "2026-07-30",
                privateNote: "Net 15 invoice",
                lineItems: [
                  {
                    productServiceName: "Travel",
                    description: "Travel coordination service",
                    quantity: 2,
                    unitPrice: 1500
                  }
                ]
              }
            }
          }
        },
        responses: { "201": { description: "Created" } }
      },
      get: {
        tags: ["Quick Box"],
        summary: "List QuickBooks invoices",
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", example: 1 }
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", example: 20 }
          },
          {
            name: "customerId",
            in: "query",
            schema: { type: "string", example: "58" }
          }
        ],
        responses: { "200": { description: "Invoice list" } }
      }
    },
    "/quickbooks/invoices/{id}": {
      get: {
        tags: ["Quick Box"],
        summary: "Get QuickBooks invoice by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", example: "145" }
          }
        ],
        responses: { "200": { description: "Invoice detail" } }
      }
    }
  }
};

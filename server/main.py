import os
import json
import math
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Initialize FastAPI App
app = FastAPI(
    title="Urban Pitstop API",
    description="Real-Time Essential Facilities Network Backend with RBAC & Gemini AI Orchestration",
    version="2.0.0"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper: Haversine distance in meters
def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> int:
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (math.sin(delta_phi / 2) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return int(round(R * c))

# Helper: Estimate walking minutes (75m/min = 4.5 km/h)
def estimate_walking_minutes(distance_meters: int) -> int:
    return max(1, int(round(distance_meters / 75.0)))

def mins_ago(m: int) -> str:
    return (datetime.utcnow() - timedelta(minutes=m)).isoformat() + "Z"

def hours_ago(h: float) -> str:
    return (datetime.utcnow() - timedelta(hours=h)).isoformat() + "Z"

# Initial seed facilities (36+ in Bengaluru + London & NYC)
def get_initial_seed_data() -> List[Dict[str, Any]]:
    return [
        # === DRINKING WATER (8 Facilities) ===
        {
            "id": "blr-fac-01",
            "name": "Indiranagar Metro Station — Water & Rest Hub",
            "category": "water",
            "secondaryCategories": ["toilets", "charging", "shade"],
            "latitude": 12.9782,
            "longitude": 77.6405,
            "address": "Ground Floor, Exit B, CMH Road, Indiranagar",
            "area": "Indiranagar",
            "accessCondition": "public",
            "accessNotes": "Free public access on concourse level before ticket gates. Security guard on duty.",
            "fee": "Free (no metro ticket required for water)",
            "accessibility": {
                "wheelchairAccessible": True,
                "drinkingWaterType": "RO Filtered Dispenser",
                "hasSeating": True,
                "hasCharging": True,
                "coveredShade": True,
                "powerSocketType": "Standard 3-pin"
            },
            "operatingHours": {
                "is24x7": False,
                "openTime": "05:30",
                "closeTime": "23:30",
                "daysNote": "Daily during train service hours"
            },
            "status": "recently_confirmed",
            "confidenceScore": 96,
            "lastConfirmedAt": mins_ago(18),
            "lastConfirmedBy": "Swiggy Delivery Partner",
            "lastStatusNote": "Cold water dispenser running fine, clean filters, power sockets active at bench.",
            "evidenceHistory": [
                {
                    "id": "ev-blr-01-1",
                    "facilityId": "blr-fac-01",
                    "timestamp": mins_ago(18),
                    "source": "community_visitor",
                    "status": "available",
                    "note": "Dispenser working well, cold water available",
                    "reporterRole": "Swiggy Delivery Partner",
                    "confidenceWeight": 0.95
                }
            ],
            "operatorClaimed": True,
            "operatorName": "BMRCL Public Utilities Indiranagar",
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-04",
            "name": "Chinmaya Mission Hospital — Public RO Water Cooler",
            "category": "water",
            "secondaryCategories": ["shade", "break"],
            "latitude": 12.9788,
            "longitude": 77.6420,
            "address": "Main Gate Outpatient Entrance, CMH Road",
            "area": "Indiranagar",
            "accessCondition": "public",
            "accessNotes": "Open access at hospital outdoor porch. Available 24 hours.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": True,
                "drinkingWaterType": "Cold Water Cooler",
                "hasSeating": True,
                "coveredShade": True
            },
            "operatingHours": {
                "is24x7": True,
                "openTime": "00:00",
                "closeTime": "23:59",
                "daysNote": "24/7 Continuous"
            },
            "status": "recently_confirmed",
            "confidenceScore": 94,
            "lastConfirmedAt": mins_ago(32),
            "lastConfirmedBy": "Field Worker",
            "lastStatusNote": "Cold drinking water cooler fully operational with steel cup holders.",
            "evidenceHistory": [
                {
                    "id": "ev-blr-04-1",
                    "facilityId": "blr-fac-04",
                    "timestamp": mins_ago(32),
                    "source": "community_visitor",
                    "status": "available",
                    "note": "Water cold and fresh, good pressure",
                    "reporterRole": "Field Worker",
                    "confidenceWeight": 0.92
                }
            ],
            "operatorClaimed": False,
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-06",
            "name": "Swami Vivekananda Road Metro — Concourse Water ATM",
            "category": "water",
            "secondaryCategories": ["charging"],
            "latitude": 12.9850,
            "longitude": 77.6455,
            "address": "SV Road Metro Station, Old Madras Road",
            "area": "Old Madras Road",
            "accessCondition": "public",
            "accessNotes": "Ground floor parking concourse. Token or UPI dispenser.",
            "fee": "Free (1L bottle refill)",
            "accessibility": {
                "wheelchairAccessible": True,
                "drinkingWaterType": "RO Filtered Dispenser",
                "hasSeating": False,
                "hasCharging": True
            },
            "operatingHours": {
                "is24x7": False,
                "openTime": "06:00",
                "closeTime": "23:00",
                "daysNote": "Daily"
            },
            "status": "recently_confirmed",
            "confidenceScore": 91,
            "lastConfirmedAt": hours_ago(1.1),
            "lastConfirmedBy": "Zomato Partner",
            "lastStatusNote": "Dispenser active, bottle refill nozzle functioning.",
            "evidenceHistory": [],
            "operatorClaimed": True,
            "operatorName": "BMRCL SV Road",
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-07",
            "name": "Halasuru Someshwara Temple — Free Cold Water Fountain",
            "category": "water",
            "secondaryCategories": ["shade", "break"],
            "latitude": 12.9730,
            "longitude": 77.6250,
            "address": "Ulsoor Main Road, Near Someshwara Temple Arch",
            "area": "Halasuru / Ulsoor",
            "accessCondition": "public",
            "accessNotes": "Public veranda outside temple arch. Open to all outdoor workers and public.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": True,
                "drinkingWaterType": "RO Filtered Dispenser",
                "hasSeating": True,
                "coveredShade": True
            },
            "operatingHours": {
                "is24x7": False,
                "openTime": "06:00",
                "closeTime": "21:30",
                "daysNote": "Daily"
            },
            "status": "recently_confirmed",
            "confidenceScore": 93,
            "lastConfirmedAt": hours_ago(2),
            "lastConfirmedBy": "Dunzo Courier",
            "lastStatusNote": "Very cold filtered water, shaded stone veranda.",
            "evidenceHistory": [],
            "operatorClaimed": True,
            "operatorName": "Temple Trust Utilities",
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-08",
            "name": "Domlur BDA Complex — Shuddha Ganga Water Kiosk",
            "category": "water",
            "secondaryCategories": ["shade"],
            "latitude": 12.9610,
            "longitude": 77.6385,
            "address": "Airport Road, Domlur BDA Complex Entry",
            "area": "Domlur",
            "accessCondition": "public",
            "accessNotes": "BBMP public water kiosk. Dispenses 20L for ₹5 or free 1L cup.",
            "fee": "Free for personal bottles",
            "accessibility": {
                "wheelchairAccessible": False,
                "drinkingWaterType": "RO Filtered Dispenser",
                "hasSeating": True
            },
            "operatingHours": {
                "is24x7": False,
                "openTime": "06:30",
                "closeTime": "22:00",
                "daysNote": "Daily"
            },
            "status": "recently_confirmed",
            "confidenceScore": 89,
            "lastConfirmedAt": hours_ago(3),
            "lastConfirmedBy": "Auto Driver Association",
            "lastStatusNote": "Both taps functioning, chilled water available.",
            "evidenceHistory": [],
            "operatorClaimed": False,
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-09",
            "name": "Shell Fuel Station — Drinking Water & Air Kiosk",
            "category": "water",
            "secondaryCategories": ["toilets", "charging"],
            "latitude": 12.9655,
            "longitude": 77.6412,
            "address": "Intermediate Ring Road, Domlur",
            "area": "Intermediate Ring Road",
            "accessCondition": "public",
            "accessNotes": "Potable RO water tap beside customer lounge. No purchase necessary.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": True,
                "drinkingWaterType": "RO Filtered Dispenser",
                "hasSeating": True,
                "hasCharging": True
            },
            "operatingHours": {
                "is24x7": True,
                "openTime": "00:00",
                "closeTime": "23:59",
                "daysNote": "24/7"
            },
            "status": "recently_confirmed",
            "confidenceScore": 95,
            "lastConfirmedAt": mins_ago(50),
            "lastConfirmedBy": "Station Manager",
            "lastStatusNote": "Fresh RO filters installed yesterday, water cold.",
            "evidenceHistory": [],
            "operatorClaimed": True,
            "operatorName": "Shell Mobility Domlur",
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-10",
            "name": "Halasuru Lake Northern Gate — Municipal Water Kiosk",
            "category": "water",
            "secondaryCategories": ["shade", "break"],
            "latitude": 12.9830,
            "longitude": 77.6210,
            "address": "Kensington Road, Ulsoor Lake Entry",
            "area": "Halasuru",
            "accessCondition": "public",
            "accessNotes": "Public cooler kiosk outside lake jogging track.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": True,
                "drinkingWaterType": "Cold Water Cooler",
                "hasSeating": True,
                "coveredShade": True
            },
            "operatingHours": {
                "is24x7": False,
                "openTime": "05:00",
                "closeTime": "20:00",
                "daysNote": "Daily"
            },
            "status": "recently_confirmed",
            "confidenceScore": 88,
            "lastConfirmedAt": hours_ago(4),
            "lastConfirmedBy": "Street Vendor",
            "lastStatusNote": "Clean and running, good flow.",
            "evidenceHistory": [],
            "operatorClaimed": False,
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-11",
            "name": "12th Main Indiranagar — Public Potable Water Point",
            "category": "water",
            "secondaryCategories": ["break"],
            "latitude": 12.9715,
            "longitude": 77.6435,
            "address": "12th Main Road, Near Corner House",
            "area": "Indiranagar 12th Main",
            "accessCondition": "public",
            "accessNotes": "Community stainless steel dispenser on commercial street.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": True,
                "drinkingWaterType": "RO Filtered Dispenser",
                "hasSeating": True
            },
            "operatingHours": {
                "is24x7": True,
                "openTime": "00:00",
                "closeTime": "23:59",
                "daysNote": "24/7"
            },
            "status": "recently_confirmed",
            "confidenceScore": 92,
            "lastConfirmedAt": hours_ago(1),
            "lastConfirmedBy": "Delivery Partner",
            "lastStatusNote": "Working well, push button clean.",
            "evidenceHistory": [],
            "operatorClaimed": False,
            "verifiedByAdmin": True
        },

        # === TOILETS & WASHROOMS (8 Facilities) ===
        {
            "id": "blr-fac-03",
            "name": "Indian Oil Swastik Station — Pitstop & Washroom",
            "category": "toilets",
            "secondaryCategories": ["water", "charging"],
            "latitude": 12.9750,
            "longitude": 77.6428,
            "address": "100 Feet Road, HAL 2nd Stage, Indiranagar",
            "area": "Indiranagar 100ft Rd",
            "accessCondition": "public",
            "accessNotes": "Mandatory free public toilet & drinking water as per Petroleum Ministry guidelines.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": False,
                "drinkingWaterType": "RO Filtered Dispenser",
                "hasSeating": True,
                "hasCharging": True,
                "powerSocketType": "Standard 3-pin"
            },
            "operatingHours": {
                "is24x7": True,
                "openTime": "00:00",
                "closeTime": "23:59",
                "daysNote": "24 Hours Open"
            },
            "status": "recently_confirmed",
            "confidenceScore": 95,
            "lastConfirmedAt": hours_ago(1.2),
            "lastConfirmedBy": "Station Manager (Suresh Patil)",
            "lastStatusNote": "Washroom unlocked and clean, phone charging point beside cashier counter.",
            "evidenceHistory": [
                {
                    "id": "ev-blr-03-1",
                    "facilityId": "blr-fac-03",
                    "timestamp": hours_ago(1.2),
                    "source": "operator",
                    "status": "available",
                    "note": "Washrooms cleaned at 3pm, available for all delivery partners and commuters",
                    "reporterRole": "Station Manager",
                    "confidenceWeight": 0.98
                }
            ],
            "operatorClaimed": True,
            "operatorName": "Swastik Fuel Retailers",
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-05",
            "name": "BDA Complex Indiranagar — Public E-Toilet Block",
            "category": "toilets",
            "secondaryCategories": ["water"],
            "latitude": 12.9770,
            "longitude": 77.6450,
            "address": "Behind BDA Shopping Complex, Old Airport Road Cross",
            "area": "Indiranagar BDA",
            "accessCondition": "public",
            "accessNotes": "Municipal public pay-and-use e-toilet unit. Coins or UPI payment.",
            "fee": "₹2 coin or UPI",
            "accessibility": {
                "wheelchairAccessible": False,
                "drinkingWaterType": "Municipal Tap",
                "hasSeating": False
            },
            "operatingHours": {
                "is24x7": False,
                "openTime": "06:00",
                "closeTime": "22:00",
                "daysNote": "Daily"
            },
            "status": "conflicting",
            "confidenceScore": 35,
            "lastConfirmedAt": mins_ago(45),
            "lastConfirmedBy": "Conflicting Reports (Community)",
            "lastStatusNote": "Contradiction: 1 visitor confirmed open, but another reported door lock jammed 45m ago.",
            "evidenceHistory": [
                {
                    "id": "ev-blr-05-1",
                    "facilityId": "blr-fac-05",
                    "timestamp": mins_ago(45),
                    "source": "community_failure",
                    "status": "unavailable",
                    "issueType": "toilet_unavailable",
                    "note": "Men cabin electronic door sensor not taking coins, red light blinking",
                    "reporterRole": "Auto Driver",
                    "confidenceWeight": 0.8
                }
            ],
            "operatorClaimed": False,
            "verifiedByAdmin": False,
            "flaggedForReview": True,
            "flagReason": "Conflicting reports within 2 hours. Physical check queued."
        },
        {
            "id": "blr-fac-12",
            "name": "Sulabh Shauchalaya — CMH Road Market Complex",
            "category": "toilets",
            "secondaryCategories": ["water"],
            "latitude": 12.9802,
            "longitude": 77.6360,
            "address": "Opposite Indiranagar Police Station, CMH Road",
            "area": "Indiranagar Market",
            "accessCondition": "public",
            "accessNotes": "Attendant staffed public toilet complex. Separate sections for men & women.",
            "fee": "₹5 urinal free, washroom ₹5",
            "accessibility": {
                "wheelchairAccessible": True,
                "drinkingWaterType": "Municipal Tap",
                "hasSeating": False
            },
            "operatingHours": {
                "is24x7": False,
                "openTime": "05:00",
                "closeTime": "23:00",
                "daysNote": "Daily"
            },
            "status": "recently_confirmed",
            "confidenceScore": 92,
            "lastConfirmedAt": mins_ago(25),
            "lastConfirmedBy": "Swiggy Rider",
            "lastStatusNote": "Water running, clean floors, caretaker on duty.",
            "evidenceHistory": [],
            "operatorClaimed": True,
            "operatorName": "Sulabh International Indiranagar",
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-13",
            "name": "BMTC Indiranagar TTMC — Bus Terminal Washrooms",
            "category": "toilets",
            "secondaryCategories": ["water", "charging", "shade"],
            "latitude": 12.9760,
            "longitude": 77.6390,
            "address": "Platform 1 Concourse, BMTC TTMC, Indiranagar",
            "area": "Indiranagar TTMC",
            "accessCondition": "public",
            "accessNotes": "Public bus terminal toilets on ground floor. Accessible without bus ticket.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": True,
                "drinkingWaterType": "RO Filtered Dispenser",
                "hasSeating": True,
                "hasCharging": True
            },
            "operatingHours": {
                "is24x7": False,
                "openTime": "05:00",
                "closeTime": "23:30",
                "daysNote": "Daily"
            },
            "status": "recently_confirmed",
            "confidenceScore": 90,
            "lastConfirmedAt": hours_ago(1.5),
            "lastConfirmedBy": "BMTC Transit Staff",
            "lastStatusNote": "Clean and stocked with soap, running water available.",
            "evidenceHistory": [],
            "operatorClaimed": True,
            "operatorName": "BMTC Facilities Division",
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-14",
            "name": "Halasuru Metro Concourse — Public Restroom",
            "category": "toilets",
            "secondaryCategories": ["water"],
            "latitude": 12.9765,
            "longitude": 77.6265,
            "address": "Exit A, Halasuru Metro, Old Madras Road",
            "area": "Halasuru",
            "accessCondition": "public",
            "accessNotes": "Outside ticket gate barrier. Ask guard for accessible stall key if locked.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": True,
                "drinkingWaterType": "RO Filtered Dispenser",
                "hasSeating": True
            },
            "operatingHours": {
                "is24x7": False,
                "openTime": "06:00",
                "closeTime": "23:00",
                "daysNote": "Daily"
            },
            "status": "recently_confirmed",
            "confidenceScore": 94,
            "lastConfirmedAt": mins_ago(40),
            "lastConfirmedBy": "Field Worker",
            "lastStatusNote": "Very clean, soap available, automated hand dryers working.",
            "evidenceHistory": [],
            "operatorClaimed": True,
            "operatorName": "BMRCL Halasuru",
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-15",
            "name": "HPCL Auto Care Petrol Bunk — Washroom & Water",
            "category": "toilets",
            "secondaryCategories": ["water", "break"],
            "latitude": 12.9690,
            "longitude": 77.6410,
            "address": "Opposite Domlur Flyover, Old Airport Road",
            "area": "Domlur / Old Airport Rd",
            "accessCondition": "public",
            "accessNotes": "Mandatory public access washrooms behind air filling unit.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": False,
                "drinkingWaterType": "RO Filtered Dispenser",
                "hasSeating": False
            },
            "operatingHours": {
                "is24x7": True,
                "openTime": "00:00",
                "closeTime": "23:59",
                "daysNote": "24/7"
            },
            "status": "recently_confirmed",
            "confidenceScore": 91,
            "lastConfirmedAt": hours_ago(2),
            "lastConfirmedBy": "Porter Partner",
            "lastStatusNote": "Unlocked and accessible, light functioning.",
            "evidenceHistory": [],
            "operatorClaimed": True,
            "operatorName": "HPCL Domlur Auto Care",
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-16",
            "name": "BBMP Smart Pay-and-Use Toilet — 12th Main",
            "category": "toilets",
            "secondaryCategories": ["water"],
            "latitude": 12.9702,
            "longitude": 77.6440,
            "address": "12th Main Road, HAL 2nd Stage, Indiranagar",
            "area": "Indiranagar 12th Main",
            "accessCondition": "public",
            "accessNotes": "Automated kiosk. Attendant available during peak daytime hours.",
            "fee": "₹5",
            "accessibility": {
                "wheelchairAccessible": True,
                "hasSeating": False
            },
            "operatingHours": {
                "is24x7": False,
                "openTime": "06:00",
                "closeTime": "22:00",
                "daysNote": "Daily"
            },
            "status": "recently_confirmed",
            "confidenceScore": 87,
            "lastConfirmedAt": hours_ago(3),
            "lastConfirmedBy": "Zomato Rider",
            "lastStatusNote": "Clean, coin and QR code entry working.",
            "evidenceHistory": [],
            "operatorClaimed": False,
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-17",
            "name": "Defence Colony Children's Park — Restroom Facility",
            "category": "toilets",
            "secondaryCategories": ["shade", "break"],
            "latitude": 12.9810,
            "longitude": 77.6420,
            "address": "6th Cross, Defence Colony, Indiranagar",
            "area": "Defence Colony",
            "accessCondition": "public",
            "accessNotes": "Public park washroom block near walking track.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": False,
                "hasSeating": True,
                "coveredShade": True
            },
            "operatingHours": {
                "is24x7": False,
                "openTime": "05:30",
                "closeTime": "20:30",
                "daysNote": "Daily during park opening hours"
            },
            "status": "recently_confirmed",
            "confidenceScore": 86,
            "lastConfirmedAt": hours_ago(2.5),
            "lastConfirmedBy": "Community Member",
            "lastStatusNote": "Open, clean tap water, park benches adjacent.",
            "evidenceHistory": [],
            "operatorClaimed": False,
            "verifiedByAdmin": True
        },

        # === SHADED RESTING SPOTS (7 Facilities) ===
        {
            "id": "blr-fac-02",
            "name": "CMH Road Public Park — Shaded Rest Pavilion",
            "category": "shade",
            "secondaryCategories": ["water", "break"],
            "latitude": 12.9796,
            "longitude": 77.6380,
            "address": "Near Chinmaya Mission Hospital, CMH Road",
            "area": "Indiranagar",
            "accessCondition": "public",
            "accessNotes": "Open public park. Delivery two-wheelers can park outside designated gate.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": True,
                "drinkingWaterType": "Cold Water Cooler",
                "hasSeating": True,
                "coveredShade": True
            },
            "operatingHours": {
                "is24x7": False,
                "openTime": "06:00",
                "closeTime": "20:30",
                "daysNote": "Daily (park gates lock at 8:30 PM)"
            },
            "status": "recently_confirmed",
            "confidenceScore": 92,
            "lastConfirmedAt": mins_ago(42),
            "lastConfirmedBy": "Zomato Rider",
            "lastStatusNote": "Plentiful canopy shade, granite benches cool, municipal tap running.",
            "evidenceHistory": [
                {
                    "id": "ev-blr-02-1",
                    "facilityId": "blr-fac-02",
                    "timestamp": mins_ago(42),
                    "source": "community_visitor",
                    "status": "available",
                    "note": "Good shaded benches for 15-min rest between orders",
                    "reporterRole": "Zomato Rider",
                    "confidenceWeight": 0.90
                }
            ],
            "operatorClaimed": False,
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-18",
            "name": "Defence Colony Canopy Park — Tree Shaded Seating",
            "category": "shade",
            "secondaryCategories": ["break"],
            "latitude": 12.9818,
            "longitude": 77.6402,
            "address": "Defence Colony 1st Main, Indiranagar",
            "area": "Defence Colony",
            "accessCondition": "public",
            "accessNotes": "Dense tamarind and neem tree shade with 8 stone benches. Quiet area for quick naps.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": True,
                "hasSeating": True,
                "coveredShade": True
            },
            "operatingHours": {
                "is24x7": True,
                "openTime": "00:00",
                "closeTime": "23:59",
                "daysNote": "24/7 Access to outdoor benches"
            },
            "status": "recently_confirmed",
            "confidenceScore": 94,
            "lastConfirmedAt": hours_ago(1),
            "lastConfirmedBy": "Swiggy Delivery Partner",
            "lastStatusNote": "Breeze is pleasant, cool stone benches, no harassment.",
            "evidenceHistory": [],
            "operatorClaimed": False,
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-19",
            "name": "Domlur Flyover Underpass — Sheltered Delivery Waiting Bay",
            "category": "shade",
            "secondaryCategories": ["break", "charging"],
            "latitude": 12.9660,
            "longitude": 77.6395,
            "address": "Under Domlur Flyover, Old Airport Road Junction",
            "area": "Domlur Flyover",
            "accessCondition": "public",
            "accessNotes": "Designated rain & sun shelter bay for delivery partners & auto drivers with paved bike parking.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": True,
                "hasSeating": True,
                "coveredShade": True,
                "hasCharging": True
            },
            "operatingHours": {
                "is24x7": True,
                "openTime": "00:00",
                "closeTime": "23:59",
                "daysNote": "24/7 Sheltered from rain and sun"
            },
            "status": "recently_confirmed",
            "confidenceScore": 95,
            "lastConfirmedAt": mins_ago(15),
            "lastConfirmedBy": "Zepto Rider",
            "lastStatusNote": "Overhead concrete roof blocks direct noon sun completely, 10+ riders resting safely.",
            "evidenceHistory": [],
            "operatorClaimed": True,
            "operatorName": "BBMP Worker Welfare Cell",
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-20",
            "name": "12th Main Banyan Tree Benches — Natural Shaded Pitstop",
            "category": "shade",
            "secondaryCategories": ["break"],
            "latitude": 12.9735,
            "longitude": 77.6445,
            "address": "Corner of 12th Main & 5th Cross, HAL 2nd Stage",
            "area": "Indiranagar 12th Main",
            "accessCondition": "public",
            "accessNotes": "Circular concrete stone bench around 70-year-old banyan tree. 100% shade all day.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": True,
                "hasSeating": True,
                "coveredShade": True
            },
            "operatingHours": {
                "is24x7": True,
                "openTime": "00:00",
                "closeTime": "23:59",
                "daysNote": "24/7"
            },
            "status": "recently_confirmed",
            "confidenceScore": 91,
            "lastConfirmedAt": hours_ago(2),
            "lastConfirmedBy": "Dunzo Rider",
            "lastStatusNote": "Excellent afternoon shade, clean surroundings.",
            "evidenceHistory": [],
            "operatorClaimed": False,
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-21",
            "name": "HAL 2nd Stage Pocket Park — Rest Gazebo",
            "category": "shade",
            "secondaryCategories": ["break"],
            "latitude": 12.9720,
            "longitude": 77.6480,
            "address": "8th Main, HAL 2nd Stage, Indiranagar",
            "area": "HAL 2nd Stage",
            "accessCondition": "public",
            "accessNotes": "Covered metal gazebo with wooden benches in neighborhood park.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": True,
                "hasSeating": True,
                "coveredShade": True
            },
            "operatingHours": {
                "is24x7": False,
                "openTime": "06:00",
                "closeTime": "21:00",
                "daysNote": "Daily"
            },
            "status": "recently_confirmed",
            "confidenceScore": 88,
            "lastConfirmedAt": hours_ago(3.5),
            "lastConfirmedBy": "Swiggy Rider",
            "lastStatusNote": "Roof fully intact, quiet place for a 20-min breather.",
            "evidenceHistory": [],
            "operatorClaimed": False,
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-22",
            "name": "Ulsoor Lake Promenade — Shaded Arbor Seating",
            "category": "shade",
            "secondaryCategories": ["water", "break"],
            "latitude": 12.9815,
            "longitude": 77.6235,
            "address": "East Lake Road Promenade, Ulsoor",
            "area": "Halasuru Lake",
            "accessCondition": "public",
            "accessNotes": "Bougainvillea covered shade pergola overlooking the lake water.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": True,
                "hasSeating": True,
                "coveredShade": True
            },
            "operatingHours": {
                "is24x7": False,
                "openTime": "05:00",
                "closeTime": "20:00",
                "daysNote": "Daily"
            },
            "status": "recently_confirmed",
            "confidenceScore": 93,
            "lastConfirmedAt": hours_ago(1.8),
            "lastConfirmedBy": "Commuter",
            "lastStatusNote": "Very cool breeze, benches clean, trash cans nearby.",
            "evidenceHistory": [],
            "operatorClaimed": False,
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-23",
            "name": "Old Airport Road Transit Shelter Bay",
            "category": "shade",
            "secondaryCategories": ["break"],
            "latitude": 12.9640,
            "longitude": 77.6470,
            "address": "Opposite Manipal Hospital, Old Airport Road",
            "area": "Old Airport Road",
            "accessCondition": "public",
            "accessNotes": "Long cantilever stainless steel canopy with high wind-shielding.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": True,
                "hasSeating": True,
                "coveredShade": True
            },
            "operatingHours": {
                "is24x7": True,
                "openTime": "00:00",
                "closeTime": "23:59",
                "daysNote": "24/7"
            },
            "status": "recently_confirmed",
            "confidenceScore": 89,
            "lastConfirmedAt": hours_ago(2.2),
            "lastConfirmedBy": "Blinkit Rider",
            "lastStatusNote": "Great rain and sun shield, plenty of bike parking.",
            "evidenceHistory": [],
            "operatorClaimed": False,
            "verifiedByAdmin": True
        },

        # === PHONE CHARGING PITSTOPS (7 Facilities) ===
        {
            "id": "blr-fac-24",
            "name": "Ather Grid Fast Charging & Worker Hub — 100ft Rd",
            "category": "charging",
            "secondaryCategories": ["water", "break"],
            "latitude": 12.9730,
            "longitude": 77.6415,
            "address": "Plot 748, 100 Feet Road, Near Domlur Flyover Ramp",
            "area": "Indiranagar 100ft Rd",
            "accessCondition": "public",
            "accessNotes": "Public EV charging hub with dedicated mobile phone charging bench (4 fast USB-C ports + 3 standard plugs).",
            "fee": "Free for mobile charging",
            "accessibility": {
                "wheelchairAccessible": True,
                "hasCharging": True,
                "powerSocketType": "High Power Fast Charge",
                "hasSeating": True,
                "coveredShade": True
            },
            "operatingHours": {
                "is24x7": True,
                "openTime": "00:00",
                "closeTime": "23:59",
                "daysNote": "24/7 Active Power Supply"
            },
            "status": "recently_confirmed",
            "confidenceScore": 98,
            "lastConfirmedAt": mins_ago(8),
            "lastConfirmedBy": "Ather Station Host",
            "lastStatusNote": "All 4 USB fast charge sockets working at 25W, drinking water dispenser filled.",
            "evidenceHistory": [],
            "operatorClaimed": True,
            "operatorName": "Ather Grid Infrastructure",
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-25",
            "name": "Chaayos 12th Main — Delivery Partner Charging Counter",
            "category": "charging",
            "secondaryCategories": ["water", "break"],
            "latitude": 12.9725,
            "longitude": 77.6438,
            "address": "12th Main Road, HAL 2nd Stage, Indiranagar",
            "area": "Indiranagar 12th Main",
            "accessCondition": "public",
            "accessNotes": "Outside pickup counter has dedicated 6-gang multi-plug extension board for riders waiting for orders.",
            "fee": "Free (no purchase required for delivery riders)",
            "accessibility": {
                "wheelchairAccessible": True,
                "hasCharging": True,
                "powerSocketType": "Standard 3-pin",
                "hasSeating": True,
                "coveredShade": True
            },
            "operatingHours": {
                "is24x7": False,
                "openTime": "07:00",
                "closeTime": "02:00",
                "daysNote": "Daily till 2:00 AM"
            },
            "status": "recently_confirmed",
            "confidenceScore": 95,
            "lastConfirmedAt": mins_ago(22),
            "lastConfirmedBy": "Zomato Rider",
            "lastStatusNote": "Charged phone from 15% to 55% in 20 mins while waiting for food parcel.",
            "evidenceHistory": [],
            "operatorClaimed": True,
            "operatorName": "Chaayos Indiranagar",
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-26",
            "name": "Bounce Battery Swap & Device Charging Pitstop",
            "category": "charging",
            "secondaryCategories": ["break"],
            "latitude": 12.9775,
            "longitude": 77.6410,
            "address": "CMH Road, Near Indiranagar Police Station",
            "area": "Indiranagar CMH Rd",
            "accessCondition": "public",
            "accessNotes": "Battery swap station equipped with weather-proof phone charging box with USB-C and Lightning cables.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": False,
                "hasCharging": True,
                "powerSocketType": "USB Hub",
                "coveredShade": True
            },
            "operatingHours": {
                "is24x7": True,
                "openTime": "00:00",
                "closeTime": "23:59",
                "daysNote": "24/7"
            },
            "status": "recently_confirmed",
            "confidenceScore": 93,
            "lastConfirmedAt": mins_ago(38),
            "lastConfirmedBy": "Swiggy Delivery Partner",
            "lastStatusNote": "Cables working, fast charging active.",
            "evidenceHistory": [],
            "operatorClaimed": True,
            "operatorName": "Bounce Mobility Operations",
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-27",
            "name": "Indian Oil Swastik 100ft Rd — Free USB Hub",
            "category": "charging",
            "secondaryCategories": ["water", "toilets"],
            "latitude": 12.9752,
            "longitude": 77.6430,
            "address": "Cashier Porch, Swastik IOCL, 100ft Rd",
            "area": "Indiranagar 100ft Rd",
            "accessCondition": "public",
            "accessNotes": "Beside nitrogen air machine. 3 USB slots and 2 sockets.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": True,
                "hasCharging": True,
                "powerSocketType": "Standard 3-pin",
                "coveredShade": True
            },
            "operatingHours": {
                "is24x7": True,
                "openTime": "00:00",
                "closeTime": "23:59",
                "daysNote": "24/7"
            },
            "status": "recently_confirmed",
            "confidenceScore": 94,
            "lastConfirmedAt": hours_ago(1),
            "lastConfirmedBy": "Station Manager (Suresh Patil)",
            "lastStatusNote": "Power on, extension surge protector verified.",
            "evidenceHistory": [],
            "operatorClaimed": True,
            "operatorName": "Swastik Fuel Retailers",
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-28",
            "name": "Zepto Dark Store — Delivery Partner Charging Lounge",
            "category": "charging",
            "secondaryCategories": ["water", "shade", "break"],
            "latitude": 12.9768,
            "longitude": 77.6465,
            "address": "HAL 3rd Stage, Near BDA Complex Backgate",
            "area": "HAL 3rd Stage",
            "accessCondition": "public",
            "accessNotes": "Open outdoor bench area for all delivery partners regardless of platform. 8-socket charging strip.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": True,
                "hasCharging": True,
                "powerSocketType": "Standard 3-pin",
                "hasSeating": True,
                "coveredShade": True
            },
            "operatingHours": {
                "is24x7": True,
                "openTime": "00:00",
                "closeTime": "23:59",
                "daysNote": "24/7"
            },
            "status": "recently_confirmed",
            "confidenceScore": 96,
            "lastConfirmedAt": mins_ago(12),
            "lastConfirmedBy": "Zepto Hub Marshall",
            "lastStatusNote": "Sockets active, water dispenser cold.",
            "evidenceHistory": [],
            "operatorClaimed": True,
            "operatorName": "Zepto Fleet Care Indiranagar",
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-29",
            "name": "Croma 100 Feet Road — Exterior Customer Charging Kiosk",
            "category": "charging",
            "secondaryCategories": ["shade"],
            "latitude": 12.9760,
            "longitude": 77.6420,
            "address": "100 Feet Road, HAL 2nd Stage, Indiranagar",
            "area": "Indiranagar 100ft Rd",
            "accessCondition": "public",
            "accessNotes": "Located right next to building security cabin outside entrance glass doors.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": True,
                "hasCharging": True,
                "powerSocketType": "USB Hub",
                "hasSeating": True
            },
            "operatingHours": {
                "is24x7": False,
                "openTime": "09:00",
                "closeTime": "22:00",
                "daysNote": "Daily"
            },
            "status": "recently_confirmed",
            "confidenceScore": 91,
            "lastConfirmedAt": hours_ago(2),
            "lastConfirmedBy": "Field Worker",
            "lastStatusNote": "All 4 ports green LED, power active.",
            "evidenceHistory": [],
            "operatorClaimed": False,
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-30",
            "name": "Indiranagar Metro Concourse Level — Phone Charging Tree",
            "category": "charging",
            "secondaryCategories": ["water", "toilets", "shade"],
            "latitude": 12.9783,
            "longitude": 77.6407,
            "address": "Exit B Concourse, Indiranagar Metro",
            "area": "Indiranagar",
            "accessCondition": "public",
            "accessNotes": "Steel charging tree with 6 USB-A and 2 USB-C ports before ticket barriers.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": True,
                "hasCharging": True,
                "powerSocketType": "USB Hub",
                "hasSeating": True,
                "coveredShade": True
            },
            "operatingHours": {
                "is24x7": False,
                "openTime": "05:30",
                "closeTime": "23:30",
                "daysNote": "Daily"
            },
            "status": "recently_confirmed",
            "confidenceScore": 97,
            "lastConfirmedAt": mins_ago(19),
            "lastConfirmedBy": "Delivery Rider",
            "lastStatusNote": "Fast charge verified on USB-C port.",
            "evidenceHistory": [],
            "operatorClaimed": True,
            "operatorName": "BMRCL Indiranagar",
            "verifiedByAdmin": True
        },

        # === SAFE SHORT-BREAK LOCATIONS (6 Facilities) ===
        {
            "id": "blr-fac-31",
            "name": "Swiggy & Zomato Partner Pitstop Hub — HAL 2nd Stage",
            "category": "break",
            "secondaryCategories": ["shade", "water", "charging"],
            "latitude": 12.9740,
            "longitude": 77.6440,
            "address": "Adjacent to 12th Main Food Street, HAL 2nd Stage",
            "area": "HAL 2nd Stage",
            "accessCondition": "public",
            "accessNotes": "Designated rest zone created by local restaurant association for delivery workers and field staff. Benches, water cooler, shaded canopy.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": True,
                "hasSeating": True,
                "coveredShade": True,
                "hasCharging": True,
                "drinkingWaterType": "Cold Water Cooler"
            },
            "operatingHours": {
                "is24x7": True,
                "openTime": "00:00",
                "closeTime": "23:59",
                "daysNote": "24/7 Open Rest Area"
            },
            "status": "recently_confirmed",
            "confidenceScore": 97,
            "lastConfirmedAt": mins_ago(14),
            "lastConfirmedBy": "Delivery Partner",
            "lastStatusNote": "Great safe rest spot, 6 riders sitting comfortably, shaded and peaceful.",
            "evidenceHistory": [],
            "operatorClaimed": True,
            "operatorName": "Bangalore Food Partner Coalition",
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-32",
            "name": "Chai Point 100ft Rd — Worker Break Veranda",
            "category": "break",
            "secondaryCategories": ["shade", "water"],
            "latitude": 12.9772,
            "longitude": 77.6425,
            "address": "100 Feet Road, Indiranagar",
            "area": "Indiranagar 100ft Rd",
            "accessCondition": "public",
            "accessNotes": "Covered outdoor porch with wooden benches. Water dispenser available on request.",
            "fee": "Free seating for delivery personnel",
            "accessibility": {
                "wheelchairAccessible": True,
                "hasSeating": True,
                "coveredShade": True
            },
            "operatingHours": {
                "is24x7": False,
                "openTime": "07:00",
                "closeTime": "23:00",
                "daysNote": "Daily"
            },
            "status": "recently_confirmed",
            "confidenceScore": 92,
            "lastConfirmedAt": mins_ago(45),
            "lastConfirmedBy": "Dunzo Courier",
            "lastStatusNote": "Staff polite, benches clean, fan working.",
            "evidenceHistory": [],
            "operatorClaimed": True,
            "operatorName": "Chai Point Indiranagar",
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-33",
            "name": "Domlur BDA Complex Plaza Benches",
            "category": "break",
            "secondaryCategories": ["shade", "water"],
            "latitude": 12.9612,
            "longitude": 77.6382,
            "address": "Old Airport Road, Domlur BDA Complex",
            "area": "Domlur",
            "accessCondition": "public",
            "accessNotes": "Open central courtyard surrounded by green plants. Safe, unhurried seating.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": True,
                "hasSeating": True,
                "coveredShade": True
            },
            "operatingHours": {
                "is24x7": False,
                "openTime": "06:00",
                "closeTime": "22:00",
                "daysNote": "Daily"
            },
            "status": "recently_confirmed",
            "confidenceScore": 90,
            "lastConfirmedAt": hours_ago(2),
            "lastConfirmedBy": "Street Vendor",
            "lastStatusNote": "Spacious, shaded and relaxing atmosphere.",
            "evidenceHistory": [],
            "operatorClaimed": False,
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-34",
            "name": "100 Feet Road Auto Stand — Community Driver Shelter",
            "category": "break",
            "secondaryCategories": ["shade", "water"],
            "latitude": 12.9790,
            "longitude": 77.6432,
            "address": "Junction of 100ft Rd & CMH Rd, Indiranagar",
            "area": "Indiranagar Junction",
            "accessCondition": "public",
            "accessNotes": "Community shelter maintained by Auto Driver Union. Steel benches & clay pot water cooler.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": False,
                "hasSeating": True,
                "coveredShade": True,
                "drinkingWaterType": "Cold Water Cooler"
            },
            "operatingHours": {
                "is24x7": True,
                "openTime": "00:00",
                "closeTime": "23:59",
                "daysNote": "24/7"
            },
            "status": "recently_confirmed",
            "confidenceScore": 93,
            "lastConfirmedAt": mins_ago(30),
            "lastConfirmedBy": "Auto Driver Member",
            "lastStatusNote": "Clay pot water fresh and cold, welcoming atmosphere for all delivery guys.",
            "evidenceHistory": [],
            "operatorClaimed": True,
            "operatorName": "Indiranagar Auto Drivers Union",
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-35",
            "name": "Chinmaya Hospital Outdoor Veranda",
            "category": "break",
            "secondaryCategories": ["shade", "water"],
            "latitude": 12.9786,
            "longitude": 77.6418,
            "address": "CMH Road, Near Emergency Gate",
            "area": "Indiranagar CMH Rd",
            "accessCondition": "public",
            "accessNotes": "Long covered veranda with fiberglass benches. Security guards friendly to workers taking short rests.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": True,
                "hasSeating": True,
                "coveredShade": True
            },
            "operatingHours": {
                "is24x7": True,
                "openTime": "00:00",
                "closeTime": "23:59",
                "daysNote": "24/7"
            },
            "status": "recently_confirmed",
            "confidenceScore": 91,
            "lastConfirmedAt": hours_ago(1.5),
            "lastConfirmedBy": "Field Worker",
            "lastStatusNote": "Quiet, shaded and well lit at night.",
            "evidenceHistory": [],
            "operatorClaimed": False,
            "verifiedByAdmin": True
        },
        {
            "id": "blr-fac-36",
            "name": "Ulsoor Gurudwara Community Serai — Outdoor Rest Porch",
            "category": "break",
            "secondaryCategories": ["water", "shade"],
            "latitude": 12.9745,
            "longitude": 77.6220,
            "address": "Aga Abbas Ali Road, Ulsoor",
            "area": "Ulsoor",
            "accessCondition": "public",
            "accessNotes": "Open community porch. Free cold drinking water and clean sitting space for anyone needing rest.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": True,
                "hasSeating": True,
                "coveredShade": True,
                "drinkingWaterType": "RO Filtered Dispenser"
            },
            "operatingHours": {
                "is24x7": False,
                "openTime": "05:00",
                "closeTime": "22:00",
                "daysNote": "Daily"
            },
            "status": "recently_confirmed",
            "confidenceScore": 96,
            "lastConfirmedAt": hours_ago(1.2),
            "lastConfirmedBy": "Zomato Rider",
            "lastStatusNote": "Extremely peaceful, clean and cold water available.",
            "evidenceHistory": [],
            "operatorClaimed": True,
            "operatorName": "Gurudwara Seva Committee",
            "verifiedByAdmin": True
        },

        # === LONDON PILOT FACILITIES (2) ===
        {
            "id": "lon-fac-01",
            "name": "Soho Square Gardens — Public Rest & Water Fountain",
            "category": "water",
            "secondaryCategories": ["shade", "break"],
            "latitude": 51.5152,
            "longitude": -0.1320,
            "address": "Soho Square, London W1D 3QP",
            "area": "Soho",
            "accessCondition": "public",
            "accessNotes": "Open public garden with Mayor of London drinking water refill fountain.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": True,
                "drinkingWaterType": "Municipal Tap",
                "hasSeating": True,
                "coveredShade": True
            },
            "operatingHours": {
                "is24x7": False,
                "openTime": "07:30",
                "closeTime": "20:00",
                "daysNote": "Daily"
            },
            "status": "recently_confirmed",
            "confidenceScore": 94,
            "lastConfirmedAt": hours_ago(1),
            "lastConfirmedBy": "Deliveroo Courier",
            "lastStatusNote": "Fountain running with strong pressure, clean nozzle.",
            "evidenceHistory": [],
            "operatorClaimed": True,
            "operatorName": "Westminster City Council",
            "verifiedByAdmin": True
        },
        {
            "id": "lon-fac-02",
            "name": "St Giles High Street — Charge & Rest Bay",
            "category": "charging",
            "secondaryCategories": ["break"],
            "latitude": 51.5160,
            "longitude": -0.1290,
            "address": "St Giles Square, London WC2H 8AP",
            "area": "Covent Garden / St Giles",
            "accessCondition": "public",
            "accessNotes": "Sheltered public seating area outside Centre Point with weatherproof USB ports.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": True,
                "hasCharging": True,
                "powerSocketType": "USB Hub",
                "hasSeating": True,
                "coveredShade": True
            },
            "operatingHours": {
                "is24x7": True,
                "openTime": "00:00",
                "closeTime": "23:59",
                "daysNote": "24/7"
            },
            "status": "recently_confirmed",
            "confidenceScore": 91,
            "lastConfirmedAt": hours_ago(2.5),
            "lastConfirmedBy": "Uber Eats Rider",
            "lastStatusNote": "All 4 USB-A ports working, dry seating under canopy.",
            "evidenceHistory": [],
            "operatorClaimed": False,
            "verifiedByAdmin": True
        },

        # === NYC PILOT FACILITIES (2) ===
        {
            "id": "nyc-fac-01",
            "name": "Union Square Park — North Plaza Pavilion",
            "category": "water",
            "secondaryCategories": ["toilets", "shade", "break"],
            "latitude": 40.7365,
            "longitude": -73.9905,
            "address": "Union Square North, 17th St & Broadway",
            "area": "Union Square",
            "accessCondition": "public",
            "accessNotes": "Year-round public comfort station with clean washrooms and bottle refill station.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": True,
                "drinkingWaterType": "RO Filtered Dispenser",
                "hasSeating": True,
                "coveredShade": True
            },
            "operatingHours": {
                "is24x7": False,
                "openTime": "06:00",
                "closeTime": "22:00",
                "daysNote": "Daily"
            },
            "status": "recently_confirmed",
            "confidenceScore": 95,
            "lastConfirmedAt": mins_ago(35),
            "lastConfirmedBy": "Relay Delivery Courier",
            "lastStatusNote": "Clean restrooms, water bottle refill station cold and functioning.",
            "evidenceHistory": [],
            "operatorClaimed": True,
            "operatorName": "NYC Parks & Recreation",
            "verifiedByAdmin": True
        },
        {
            "id": "nyc-fac-02",
            "name": "14th Street & 5th Ave — LinkNYC Free Gigabit Charging",
            "category": "charging",
            "secondaryCategories": ["break"],
            "latitude": 40.7352,
            "longitude": -73.9930,
            "address": "Outside 80 5th Avenue, New York, NY 10011",
            "area": "Greenwich Village",
            "accessCondition": "public",
            "accessNotes": "Two high-speed USB charging ports on side of digital kiosk.",
            "fee": "Free",
            "accessibility": {
                "wheelchairAccessible": True,
                "hasCharging": True,
                "powerSocketType": "High Power Fast Charge"
            },
            "operatingHours": {
                "is24x7": True,
                "openTime": "00:00",
                "closeTime": "23:59",
                "daysNote": "24/7"
            },
            "status": "recently_confirmed",
            "confidenceScore": 90,
            "lastConfirmedAt": hours_ago(1.5),
            "lastConfirmedBy": "Field Worker",
            "lastStatusNote": "Both USB ports charging fast, touch 911 button functional.",
            "evidenceHistory": [],
            "operatorClaimed": True,
            "operatorName": "LinkNYC Infrastructure",
            "verifiedByAdmin": True
        }
    ]

# In-memory facilities store
FACILITIES_DB: List[Dict[str, Any]] = get_initial_seed_data()

# Users DB for RBAC
USERS_DB: List[Dict[str, Any]] = [
    {
        "id": "usr-admin-01",
        "name": "Ayesha Rahman",
        "email": "admin@urbanpitstop.com",
        "passwords": ["Admin@2026", "admin123"],
        "role": "admin",
        "organization": "Urban Pitstop Core Operations",
        "phone": "+91 98450 88210",
        "status": "active",
        "verifiedBadge": True,
        "avatar": "🛡️",
        "token": "token_admin_ops_01",
        "createdAt": "2026-01-15T09:00:00Z",
        "lastLoginAt": (datetime.utcnow() - timedelta(minutes=15)).isoformat() + "Z",
        "notes": "Chief Platform Administrator & Quality Audit Lead"
    },
    {
        "id": "usr-operator-01",
        "name": "Suresh Patil",
        "email": "operator@urbanpitstop.com",
        "passwords": ["Operator@2026", "operator123"],
        "role": "operator",
        "organization": "Indian Oil & Metro Utilities",
        "phone": "+91 99012 34567",
        "status": "active",
        "assignedFacilityIds": ["blr-fac-01", "blr-fac-03", "blr-fac-04"],
        "verifiedBadge": True,
        "avatar": "⛽",
        "token": "token_operator_iocl_01",
        "createdAt": "2026-02-01T10:00:00Z",
        "lastLoginAt": (datetime.utcnow() - timedelta(hours=2)).isoformat() + "Z",
        "notes": "Station Manager for Indian Oil Petrol Station & Metro CMH Road Rest Hub"
    },
    {
        "id": "usr-worker-01",
        "name": "Kiran Swaminathan",
        "email": "rider@urbanpitstop.com",
        "passwords": ["Worker@2026", "rider123"],
        "role": "worker",
        "organization": "Swiggy Delivery Fleet",
        "phone": "+91 97401 22890",
        "workerType": "delivery_rider",
        "status": "active",
        "verifiedBadge": True,
        "avatar": "🛵",
        "token": "token_worker_swiggy_01",
        "createdAt": "2026-02-10T14:30:00Z",
        "lastLoginAt": (datetime.utcnow() - timedelta(minutes=45)).isoformat() + "Z",
        "notes": "Senior Outdoor Delivery Rider & Certified Community Field Inspector"
    }
]

# Pending Operator Registrations Queue
OPERATOR_REGISTRATIONS_DB: List[Dict[str, Any]] = [
    {
        "id": "op-req-101",
        "operatorName": "Ramesh Naidu",
        "email": "ramesh.cafe@greenpitstop.in",
        "password": "Partner@2026",
        "phone": "+91 98450 12345",
        "organization": "Green Tree Cafe & Express Pitstop",
        "facilityName": "Green Tree Cafe — Rider Water & Rest Porch",
        "category": "water",
        "address": "45, 12th Main Road, HAL 2nd Stage, Indiranagar",
        "area": "Indiranagar 12th Main",
        "latitude": 12.9728,
        "longitude": 77.6432,
        "accessCondition": "public",
        "fee": "Free for outdoor workers and commuters",
        "operatingHours": {
            "is24x7": False,
            "openTime": "07:00",
            "closeTime": "23:00",
            "daysNote": "Daily"
        },
        "accessibility": {
            "wheelchairAccessible": True,
            "drinkingWaterType": "RO Filtered Dispenser",
            "hasSeating": True,
            "hasCharging": True,
            "coveredShade": True
        },
        "status": "pending",
        "submittedAt": (datetime.utcnow() - timedelta(hours=3)).isoformat() + "Z"
    }
]

# Field Inspections DB
INSPECTION_REPORTS_DB: List[Dict[str, Any]] = []

# Guest & User Problem Reports DB (Public complaints, broken facilities, access issues)
REPORTS_DB: List[Dict[str, Any]] = [
    {
        "id": "rep-guest-001",
        "facilityId": "blr-fac-02",
        "facilityName": "BDA Complex Indiranagar — Public Washrooms",
        "reporterName": "Guest Commuter",
        "reporterRole": "guest",
        "issueType": "door_lock_broken",
        "severity": "high",
        "note": "Men's second cubicle door lock is broken from outside. Tap is leaking water continuously onto the floor.",
        "status": "pending",
        "timestamp": mins_ago(35),
        "clientIp": "127.0.0.1",
        "suggestedAction": "Dispatch municipal maintenance crew to replace door latch and repair washer."
    },
    {
        "id": "rep-guest-002",
        "facilityId": "blr-fac-06",
        "facilityName": "100ft Road Metro Pillar 140 — E-Toilet",
        "reporterName": "Kiran Swaminathan",
        "reporterRole": "worker",
        "issueType": "no_water",
        "severity": "high",
        "note": "Coin slot swallowed 5 rupee coin but the automated solenoid water valve did not activate. Basin dry.",
        "status": "pending",
        "timestamp": mins_ago(75),
        "clientIp": "127.0.0.1",
        "suggestedAction": "Reset automated control unit and verify main BBMP inlet pressure."
    },
    {
        "id": "rep-guest-003",
        "facilityId": "blr-fac-05",
        "facilityName": "Domlur Flyover Shaded Waiting Bay",
        "reporterName": "Delivery Rider",
        "reporterRole": "worker",
        "issueType": "other",
        "severity": "low",
        "note": "Large fallen tree branch partially blocking east resting bench after thunderstorm.",
        "status": "investigating",
        "timestamp": mins_ago(140),
        "clientIp": "127.0.0.1",
        "suggestedAction": "BBMP horticulture team notified for branch clearance."
    },
    {
        "id": "rep-guest-004",
        "facilityId": "blr-fac-15",
        "facilityName": "Ather Grid Fast Charger — 100ft Road",
        "reporterName": "Guest EV Rider",
        "reporterRole": "guest",
        "issueType": "access_denied",
        "severity": "medium",
        "note": "Security guard stated universal 3-pin plug was reserved for employees only.",
        "status": "resolved",
        "adminResolution": "Spoke to partner manager. Guard briefed on public accessibility policy.",
        "timestamp": mins_ago(300),
        "clientIp": "127.0.0.1",
        "suggestedAction": "Resolved."
    }
]

# Hygiene & Quality Inspections
INSPECTION_REPORTS_DB: List[Dict[str, Any]] = [
    {
        "id": "insp-01",
        "facilityId": "blr-fac-02",
        "facilityName": "Indian Oil Swastik Station — Pitstop & Washroom",
        "workerId": "usr-worker-01",
        "workerName": "Kiran Swaminathan (Swiggy Fleet)",
        "hygieneRating": 5,
        "waterQualityStatus": "potable_clean",
        "cleanlinessStatus": "spotless",
        "suppliesPresent": True,
        "safetyRating": "very_safe",
        "notes": "Washrooms recently sanitized, hand soap dispenser refilled, high water pressure, clean tiled floor. Free air & water point operational.",
        "inspectedAt": hours_ago(2.5)
    },
    {
        "id": "insp-02",
        "facilityId": "blr-fac-01",
        "facilityName": "Indiranagar Metro Station — Water & Rest Hub",
        "workerId": "usr-worker-02",
        "workerName": "Prakash Nair (Zomato Partner)",
        "hygieneRating": 5,
        "waterQualityStatus": "potable_clean",
        "cleanlinessStatus": "clean",
        "suppliesPresent": True,
        "safetyRating": "very_safe",
        "notes": "RO dispenser running chilled water, clean filters, power sockets active at bench.",
        "inspectedAt": hours_ago(5.5)
    }
]

# Audit Logs
AUDIT_LOGS_DB: List[Dict[str, Any]] = [
    {
        "id": "aud-init-01",
        "timestamp": (datetime.utcnow() - timedelta(hours=2)).isoformat() + "Z",
        "eventType": "LOGIN_SUCCESS",
        "actorEmail": "admin@urbanpitstop.com",
        "actorName": "Ayesha Rahman",
        "actorRole": "admin",
        "clientIp": "192.168.1.104",
        "details": "Platform Admin authenticated via secure credentials form.",
        "severity": "info"
    }
]

# Initialize SQLite database and seed initial data if empty
try:
    from . import db
except (ImportError, ValueError):
    import db

db.seed_database_if_empty(
    seed_facilities=FACILITIES_DB,
    seed_users=USERS_DB,
    seed_operator_requests=OPERATOR_REGISTRATIONS_DB,
    seed_reports=REPORTS_DB,
    seed_inspections=INSPECTION_REPORTS_DB,
    seed_audit_logs=AUDIT_LOGS_DB
)

# Gemini AI Service initialization
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

def call_gemini_nl_parser(query: str) -> Dict[str, Any]:
    q = query.lower()
    categories = []
    if any(w in q for w in ["water", "drink", "thirsty", "thirst", "bottle", "ro", "tap", "filter"]):
        categories.append("water")
    if any(w in q for w in ["toilet", "washroom", "restroom", "urinal", "loo", "pee", "potty", "shauchalaya"]):
        categories.append("toilets")
    if any(w in q for w in ["shade", "sun", "hot", "heat", "shelter", "tree", "cool"]):
        categories.append("shade")
    if any(w in q for w in ["charge", "charging", "battery", "plug", "socket", "usb", "dead"]):
        categories.append("charging")
    if any(w in q for w in ["break", "rest", "sit", "benches", "wait", "tired", "nap", "breathe", "relax"]):
        categories.append("break")

    if not categories:
        categories = ["all"]

    max_walk = None
    if "quick" in q or "urgent" in q or "right now" in q or "emergency" in q or "5 min" in q:
        max_walk = 7
    elif "10 min" in q or "near" in q or "close" in q:
        max_walk = 12

    access = ["public"]
    if "customer" in q or "cafe" in q or "shop" in q or "buy" in q:
        access.append("customers_only")

    single_stop = len(categories) > 1 and ("both" in q or "one place" in q or "same spot" in q or "single place" in q)

    result = {
        "categories": categories,
        "maxWalkMinutes": max_walk,
        "accessConditionsAllowed": access,
        "singleStopRequired": single_stop,
        "timeSensitivity": "immediate" if ("now" in q or "urgent" in q) else "soon",
        "detectedIntent": f"Find verified {', '.join(categories)} facilities",
        "explanation": f"Filtered for verified {', '.join(categories)} locations within immediate walking corridor."
    }

    if len(categories) > 1 and not single_stop:
        result["clarificationPrompt"] = {
            "question": f"You asked for {categories[0]} and {categories[1]}. Find one place with both?",
            "optionA": {
                "label": "Yes, one place with both",
                "patch": {"singleStopRequired": True}
            },
            "optionB": {
                "label": "Either is fine",
                "patch": {"singleStopRequired": False}
            }
        }
    return result

# Request Models
class LoginRequest(BaseModel):
    email: str
    password: str

class OperatorRegisterRequest(BaseModel):
    operatorName: str
    email: str
    password: str
    phone: str
    organization: str
    facilityName: str
    category: str
    address: str
    area: str
    latitude: float
    longitude: float
    accessCondition: str = "public"
    fee: str = "Free"
    openTime: str = "06:00"
    closeTime: str = "23:00"
    is24x7: bool = False
    wheelchairAccessible: bool = True
    drinkingWaterType: Optional[str] = "RO Filtered Dispenser"
    hasSeating: bool = True
    hasCharging: bool = False
    coveredShade: bool = True

class CreateUserRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str
    organization: str
    workerType: Optional[str] = None
    assignedFacilityIds: Optional[List[str]] = []

class UserStatusUpdateRequest(BaseModel):
    status: str # 'active' | 'suspended'

class FieldInspectionRequest(BaseModel):
    workerId: str
    workerName: str
    hygieneRating: int
    waterQualityStatus: Optional[str] = "potable_clean"
    cleanlinessStatus: str = "clean"
    suppliesPresent: bool = True
    safetyRating: str = "very_safe"
    notes: Optional[str] = None

class AdminActionRequest(BaseModel):
    action: str

class ConfirmRequest(BaseModel):
    outcome: str
    note: Optional[str] = None
    role: str = "Delivery Rider"

class ReportRequest(BaseModel):
    issueType: str
    note: Optional[str] = None
    role: str = "Field Worker"

class OperatorStatusRequest(BaseModel):
    isAvailable: bool
    operatorName: str

class NLQueryRequest(BaseModel):
    query: str

# ----------------- AUTHENTICATION ROUTES -----------------

@app.post("/api/auth/login")
def login(creds: LoginRequest):
    email = creds.email.strip().lower()
    password = creds.password.strip()
    now_iso = datetime.utcnow().isoformat() + "Z"

    # Find user in SQLite
    user = db.get_user_by_email(email)

    if user:
        if user.get("status") == "pending_approval":
            db.save_audit_log({
                "id": f"aud-{int(datetime.utcnow().timestamp()*1000)}",
                "timestamp": now_iso,
                "eventType": "ACCESS_DENIED",
                "actorEmail": email,
                "actorName": user["name"],
                "actorRole": user["role"],
                "clientIp": "127.0.0.1",
                "details": "Login blocked: Operator account pending administrator review.",
                "severity": "warning"
            })
            raise HTTPException(status_code=403, detail="Your operator account is currently pending administrator verification. Please check back shortly.")

        if user.get("status") == "suspended":
            db.save_audit_log({
                "id": f"aud-{int(datetime.utcnow().timestamp()*1000)}",
                "timestamp": now_iso,
                "eventType": "ACCESS_DENIED",
                "actorEmail": email,
                "actorName": user["name"],
                "actorRole": user["role"],
                "clientIp": "127.0.0.1",
                "details": "Login blocked: Account has been suspended by administration.",
                "severity": "warning"
            })
            raise HTTPException(status_code=403, detail="This account has been suspended by platform administration.")

        passwords = user.get("passwords", [user.get("password")])
        if password in passwords:
            # If operator, ensure assignedFacilityIds has their facilities
            if user.get("role") == "operator":
                org = (user.get("organization") or "").lower().strip()
                name = (user.get("name") or "").lower().strip()
                user_email = user.get("email", "").lower().strip()
                assigned = list(user.get("assignedFacilityIds") or [])
                all_facs = db.get_all_facilities()
                for f in all_facs:
                    f_op = (f.get("operatorName") or "").lower().strip()
                    f_name = (f.get("name") or "").lower().strip()
                    f_email = (f.get("operatorEmail") or "").lower().strip()
                    if (org and (f_op == org or org in f_name)) or (name and f_op == name) or (user_email and f_email == user_email):
                        if f["id"] not in assigned:
                            assigned.append(f["id"])
                user["assignedFacilityIds"] = assigned
                db.save_user(user)

            db.save_audit_log({
                "id": f"aud-{int(datetime.utcnow().timestamp()*1000)}",
                "timestamp": now_iso,
                "eventType": "LOGIN_SUCCESS",
                "actorEmail": email,
                "actorName": user["name"],
                "actorRole": user["role"],
                "clientIp": "127.0.0.1",
                "details": f"Authenticated successfully as {user['role'].upper()}.",
                "severity": "info"
            })
            return {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"],
                "organization": user.get("organization", "Urban Pitstop Network"),
                "phone": user.get("phone", ""),
                "assignedFacilityIds": user.get("assignedFacilityIds", []),
                "verifiedBadge": user.get("verifiedBadge", True),
                "avatar": user.get("avatar", "⛽" if user["role"] == "operator" else ("🛡️" if user["role"] == "admin" else "🛵")),
                "workerType": user.get("workerType")
            }
        else:
            db.save_audit_log({
                "id": f"aud-{int(datetime.utcnow().timestamp()*1000)}",
                "timestamp": now_iso,
                "eventType": "LOGIN_FAILED",
                "actorEmail": email,
                "actorName": user["name"],
                "actorRole": user["role"],
                "clientIp": "127.0.0.1",
                "details": f"Incorrect password entered for account {email}. Access rejected.",
                "severity": "warning"
            })
            raise HTTPException(status_code=401, detail="Invalid password for this account. Please verify your credentials.")

    db.save_audit_log({
        "id": f"aud-{int(datetime.utcnow().timestamp()*1000)}",
        "timestamp": now_iso,
        "eventType": "LOGIN_FAILED",
        "actorEmail": email,
        "actorName": "Unknown Attempt",
        "actorRole": "guest",
        "clientIp": "127.0.0.1",
        "details": f"Failed login attempt: unrecognized email {email}.",
        "severity": "warning"
    })
    raise HTTPException(status_code=401, detail="No registered account found with this email address.")

@app.get("/api/auth/audit-logs")
def get_audit_logs():
    return db.get_all_audit_logs(limit=60)

@app.post("/api/auth/audit-logs")
def log_audit_event(entry: Dict[str, Any] = Body(...)):
    db.save_audit_log(entry)
    return {"status": "recorded"}

# ----------------- OPERATOR REGISTRATION & APPROVAL -----------------

@app.post("/api/operator/register")
def register_operator(req: OperatorRegisterRequest):
    now_iso = datetime.utcnow().isoformat() + "Z"
    req_id = f"op-req-{int(datetime.utcnow().timestamp()*1000)}"

    # Check if email exists in SQLite
    if db.get_user_by_email(req.email.strip().lower()):
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    new_request = {
        "id": req_id,
        "operatorName": req.operatorName.strip(),
        "email": req.email.strip().lower(),
        "password": req.password.strip(),
        "phone": req.phone.strip(),
        "organization": req.organization.strip(),
        "facilityName": req.facilityName.strip(),
        "category": req.category,
        "address": req.address.strip(),
        "area": req.area.strip(),
        "latitude": req.latitude,
        "longitude": req.longitude,
        "accessCondition": req.accessCondition,
        "fee": req.fee,
        "operatingHours": {
            "is24x7": req.is24x7,
            "openTime": req.openTime,
            "closeTime": req.closeTime,
            "daysNote": "24/7" if req.is24x7 else "Daily"
        },
        "accessibility": {
            "wheelchairAccessible": req.wheelchairAccessible,
            "drinkingWaterType": req.drinkingWaterType,
            "hasSeating": req.hasSeating,
            "hasCharging": req.hasCharging,
            "coveredShade": req.coveredShade
        },
        "status": "pending",
        "submittedAt": now_iso
    }

    user_entry = {
        "id": f"usr-op-{int(datetime.utcnow().timestamp()*1000)}",
        "name": req.operatorName.strip(),
        "email": req.email.strip().lower(),
        "passwords": [req.password.strip()],
        "role": "operator",
        "organization": req.organization.strip(),
        "status": "pending_approval",
        "verifiedBadge": False,
        "avatar": "⛽",
        "token": f"token_op_{int(datetime.utcnow().timestamp()*1000)}",
        "createdAt": now_iso
    }
    db.save_user(user_entry)
    db.save_operator_request(new_request)

    db.save_audit_log({
        "id": f"aud-{int(datetime.utcnow().timestamp()*1000)}",
        "timestamp": now_iso,
        "eventType": "LOGIN_SUCCESS",
        "actorEmail": req.email.strip().lower(),
        "actorName": req.operatorName.strip(),
        "actorRole": "operator",
        "clientIp": "127.0.0.1",
        "details": f"Operator application submitted for {req.facilityName}. Status: Pending Review.",
        "severity": "info"
    })

    return {"message": "Application submitted successfully. Awaiting administrator verification.", "registration": new_request}

@app.get("/api/admin/operator-requests")
def get_operator_requests():
    return db.get_all_operator_requests()

@app.post("/api/admin/operator-requests/{request_id}/approve")
def approve_operator_request(request_id: str):
    now_iso = datetime.utcnow().isoformat() + "Z"
    req_item = db.get_operator_request_by_id(request_id)
    if not req_item:
        raise HTTPException(status_code=404, detail="Operator request not found")

    req_item["status"] = "approved"

    # Create new facility in directory
    new_fac_id = f"fac-op-{int(datetime.utcnow().timestamp()*1000)}"
    req_item["facilityId"] = new_fac_id
    new_facility = {
        "id": new_fac_id,
        "name": req_item["facilityName"],
        "category": req_item["category"],
        "secondaryCategories": [],
        "latitude": req_item["latitude"],
        "longitude": req_item["longitude"],
        "address": req_item["address"],
        "area": req_item["area"],
        "accessCondition": req_item["accessCondition"],
        "accessNotes": "Verified facility managed by registered operator partner.",
        "fee": req_item["fee"],
        "accessibility": req_item["accessibility"],
        "operatingHours": req_item["operatingHours"],
        "status": "recently_confirmed",
        "confidenceScore": 98,
        "lastConfirmedAt": now_iso,
        "lastConfirmedBy": f"Verified Operator ({req_item['operatorName']})",
        "lastStatusNote": "Facility verified and approved by Platform Administrator.",
        "evidenceHistory": [
            {
                "id": f"ev-appr-{int(datetime.utcnow().timestamp()*1000)}",
                "facilityId": new_fac_id,
                "timestamp": now_iso,
                "source": "operator",
                "status": "available",
                "note": "Operator onboarding approved by Admin",
                "reporterRole": "Platform Admin",
                "confidenceWeight": 0.99
            }
        ],
        "operatorClaimed": True,
        "operatorName": req_item["organization"],
        "operatorEmail": req_item["email"],
        "verifiedByAdmin": True
    }
    db.save_facility(new_facility)
    db.save_operator_request(req_item)

    # Activate user in USERS_DB and assign facility
    user = db.get_user_by_email(req_item["email"].strip().lower())
    if user:
        user["status"] = "active"
        user["verifiedBadge"] = True
        user["assignedFacilityIds"] = [new_fac_id]
        if req_item.get("phone"):
            user["phone"] = req_item["phone"]
        if req_item.get("organization"):
            user["organization"] = req_item["organization"]
        user["notes"] = f"Verified Operator of {req_item['facilityName']}"
        if req_item.get("password"):
            pw = req_item["password"].strip()
            if pw not in user.get("passwords", []):
                user.setdefault("passwords", []).append(pw)
        db.save_user(user)
    else:
        new_op_user = {
            "id": f"usr-op-{int(datetime.utcnow().timestamp()*1000)}",
            "name": req_item["operatorName"].strip(),
            "email": req_item["email"].strip().lower(),
            "passwords": [req_item.get("password", "Partner@2026").strip()],
            "role": "operator",
            "organization": req_item.get("organization", req_item["operatorName"]).strip(),
            "phone": req_item.get("phone", "+91 98450 12345"),
            "status": "active",
            "assignedFacilityIds": [new_fac_id],
            "verifiedBadge": True,
            "avatar": "⛽",
            "token": f"token_op_{int(datetime.utcnow().timestamp()*1000)}",
            "createdAt": now_iso,
            "notes": f"Verified Operator of {req_item['facilityName']}"
        }
        db.save_user(new_op_user)

    db.save_audit_log({
        "id": f"aud-{int(datetime.utcnow().timestamp()*1000)}",
        "timestamp": now_iso,
        "eventType": "LOGIN_SUCCESS",
        "actorEmail": "admin@urbanpitstop.com",
        "actorName": "Platform Administrator",
        "actorRole": "admin",
        "clientIp": "127.0.0.1",
        "details": f"Operator application approved for {req_item['operatorName']} ({req_item['facilityName']}). Facility activated in network.",
        "severity": "info"
    })

    return {"message": "Operator application approved and facility activated", "facility": new_facility}

@app.post("/api/admin/operator-requests/{request_id}/reject")
def reject_operator_request(request_id: str, body: Dict[str, Any] = Body(...)):
    reason = body.get("reason", "Incomplete verification or duplicate facility.")
    now_iso = datetime.utcnow().isoformat() + "Z"
    req_item = db.get_operator_request_by_id(request_id)
    if not req_item:
        raise HTTPException(status_code=404, detail="Operator request not found")

    req_item["status"] = "rejected"
    req_item["rejectionReason"] = reason
    db.save_operator_request(req_item)

    user = db.get_user_by_email(req_item["email"].strip().lower())
    if user:
        user["status"] = "suspended"
        db.save_user(user)

    db.save_audit_log({
        "id": f"aud-{int(datetime.utcnow().timestamp()*1000)}",
        "timestamp": now_iso,
        "eventType": "ACCESS_DENIED",
        "actorEmail": "admin@urbanpitstop.com",
        "actorName": "Platform Administrator",
        "actorRole": "admin",
        "clientIp": "127.0.0.1",
        "details": f"Operator application rejected for {req_item['operatorName']}. Reason: {reason}",
        "severity": "warning"
    })

    return {"message": "Operator application rejected", "rejectionReason": reason}

# ----------------- REPORTS MANAGEMENT ROUTES -----------------

@app.get("/api/admin/reports")
def get_all_reports():
    return db.get_all_reports()

class ReportActionRequest(BaseModel):
    action: str  # 'resolve' | 'investigate' | 'dismiss'
    notes: Optional[str] = None

@app.post("/api/admin/reports/{report_id}/action")
def admin_report_action(report_id: str, req: ReportActionRequest):
    now_iso = datetime.utcnow().isoformat() + "Z"
    rep = db.get_report_by_id(report_id)
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found")

    if req.action == "resolve":
        rep["status"] = "resolved"
        rep["adminResolution"] = req.notes or "Resolved by Platform Administrator after on-site verification."
    elif req.action == "investigate":
        rep["status"] = "investigating"
        rep["suggestedAction"] = req.notes or "Assigned to nearest field inspector for hygiene and hardware check."
    elif req.action == "dismiss":
        rep["status"] = "dismissed"
        rep["adminResolution"] = req.notes or "Dismissed as transient or duplicate signal."

    db.save_report(rep)

    db.save_audit_log({
        "id": f"aud-{int(datetime.utcnow().timestamp()*1000)}",
        "timestamp": now_iso,
        "eventType": "LOGIN_SUCCESS",
        "actorEmail": "admin@urbanpitstop.com",
        "actorName": "Platform Administrator",
        "actorRole": "admin",
        "clientIp": "127.0.0.1",
        "details": f"Report {report_id} on {rep['facilityName']} marked as {req.action.upper()}.",
        "severity": "info"
    })
    return rep

@app.delete("/api/admin/reports/{report_id}")
def admin_delete_report(report_id: str):
    db.delete_report(report_id)
    return {"message": "Report removed"}

# ----------------- USER MANAGEMENT ROUTES -----------------

@app.get("/api/admin/users")
def get_all_users():
    return db.get_all_users()

@app.post("/api/admin/users")
def create_user(req: CreateUserRequest):
    now_iso = datetime.utcnow().isoformat() + "Z"
    email = req.email.strip().lower()
    if db.get_user_by_email(email):
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_user = {
        "id": f"usr-{req.role}-{int(datetime.utcnow().timestamp()*1000)}",
        "name": req.name.strip(),
        "email": email,
        "passwords": [req.password.strip()],
        "role": req.role,
        "organization": req.organization.strip(),
        "workerType": req.workerType or ("delivery_rider" if req.role == "worker" else None),
        "status": "active",
        "assignedFacilityIds": req.assignedFacilityIds or [],
        "verifiedBadge": True,
        "avatar": "🛡️" if req.role == "admin" else ("⛽" if req.role == "operator" else "🛵"),
        "token": f"token_{req.role}_{int(datetime.utcnow().timestamp()*1000)}",
        "createdAt": now_iso
    }
    db.save_user(new_user)

    db.save_audit_log({
        "id": f"aud-{int(datetime.utcnow().timestamp()*1000)}",
        "timestamp": now_iso,
        "eventType": "LOGIN_SUCCESS",
        "actorEmail": "admin@urbanpitstop.com",
        "actorName": "Platform Administrator",
        "actorRole": "admin",
        "clientIp": "127.0.0.1",
        "details": f"Created new {req.role.upper()} user account for {req.name} ({email}).",
        "severity": "info"
    })

    return new_user

@app.put("/api/admin/users/{user_id}/status")
def update_user_status(user_id: str, req: UserStatusUpdateRequest):
    now_iso = datetime.utcnow().isoformat() + "Z"
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user["status"] = req.status
    db.save_user(user)

    db.save_audit_log({
        "id": f"aud-{int(datetime.utcnow().timestamp()*1000)}",
        "timestamp": now_iso,
        "eventType": "LOGIN_SUCCESS" if req.status == "active" else "ACCESS_DENIED",
        "actorEmail": "admin@urbanpitstop.com",
        "actorName": "Platform Administrator",
        "actorRole": "admin",
        "clientIp": "127.0.0.1",
        "details": f"Changed user status of {user['name']} to {req.status.upper()}.",
        "severity": "info"
    })

    return user

# ----------------- FACILITIES API ROUTES -----------------

@app.get("/api/facilities")
def get_facilities(
    lat: float = Query(12.9784),
    lng: float = Query(77.6408),
    category: str = Query("all"),
    radius_meters: int = Query(12000)
):
    results = []
    all_facs = db.get_all_facilities()
    for f in all_facs:
        dist = haversine_distance_meters(lat, lng, f["latitude"], f["longitude"])
        if dist <= radius_meters:
            walk_mins = estimate_walking_minutes(dist)
            item = dict(f)
            item["distanceMeters"] = dist
            item["walkingMinutes"] = walk_mins

            if category != "all":
                cats = [item["category"]] + item.get("secondaryCategories", [])
                if category not in cats:
                    continue

            results.append(item)

    # Sort reliability before proximity
    results.sort(key=lambda x: (
        x.get("status") == "reported_unavailable",
        -(x.get("confidenceScore", 50) + (20 if x.get("distanceMeters", 0) < 1500 else 0) - (x.get("distanceMeters", 0) / 100))
    ))
    return results

@app.get("/api/facilities/{facility_id}")
def get_facility(facility_id: str):
    f = db.get_facility_by_id(facility_id)
    if f:
        return f
    raise HTTPException(status_code=404, detail="Facility not found")

@app.post("/api/facilities")
def add_facility(data: Dict[str, Any] = Body(...)):
    now_iso = datetime.utcnow().isoformat() + "Z"
    new_id = f"fac-srv-{int(datetime.utcnow().timestamp()*1000)}"
    data["id"] = new_id
    data["status"] = "recently_confirmed" if data.get("verifiedByAdmin") else "reported_available"
    data["confidenceScore"] = 95 if data.get("verifiedByAdmin") else 75
    data["lastConfirmedAt"] = now_iso
    data["lastConfirmedBy"] = "Admin Space Directory" if data.get("verifiedByAdmin") else "Community Submission"
    data["operatorClaimed"] = bool(data.get("operatorClaimed", False))
    data["verifiedByAdmin"] = bool(data.get("verifiedByAdmin", False))
    data["flaggedForReview"] = not data.get("verifiedByAdmin", False)
    data["evidenceHistory"] = [
        {
            "id": f"ev-init-{int(datetime.utcnow().timestamp()*1000)}",
            "facilityId": new_id,
            "timestamp": now_iso,
            "source": "operator" if data.get("verifiedByAdmin") else "community_visitor",
            "status": "available",
            "note": "Registered in Network Directory",
            "confidenceWeight": 0.95
        }
    ]
    db.save_facility(data)
    return data

@app.put("/api/facilities/{facility_id}")
def update_facility(facility_id: str, data: Dict[str, Any] = Body(...)):
    now_iso = datetime.utcnow().isoformat() + "Z"
    f = db.get_facility_by_id(facility_id)
    if not f:
        raise HTTPException(status_code=404, detail="Facility not found")
    f.update(data)
    f["id"] = facility_id
    f["lastConfirmedAt"] = now_iso
    db.save_facility(f)
    return f

@app.delete("/api/facilities/{facility_id}")
def delete_facility(facility_id: str):
    deleted = db.delete_facility(facility_id)
    if deleted:
        return {"message": "Facility removed from directory"}
    raise HTTPException(status_code=404, detail="Facility not found")

# Field Worker Hygiene Inspection
@app.post("/api/facilities/{facility_id}/inspection")
def submit_field_inspection(facility_id: str, req: FieldInspectionRequest):
    now_iso = datetime.utcnow().isoformat() + "Z"
    target = db.get_facility_by_id(facility_id)
    if not target:
        raise HTTPException(status_code=404, detail="Facility not found")

    inspection_id = f"insp-{int(datetime.utcnow().timestamp()*1000)}"
    report = {
        "id": inspection_id,
        "facilityId": facility_id,
        "facilityName": target["name"],
        "workerId": req.workerId,
        "workerName": req.workerName,
        "hygieneRating": req.hygieneRating,
        "waterQualityStatus": req.waterQualityStatus,
        "cleanlinessStatus": req.cleanlinessStatus,
        "suppliesPresent": req.suppliesPresent,
        "safetyRating": req.safetyRating,
        "notes": req.notes,
        "inspectedAt": now_iso
    }
    db.save_inspection(report)

    # Calculate status and score based on hygiene rating
    is_good = req.hygieneRating >= 3 and req.cleanlinessStatus in ["spotless", "clean"]
    new_status = "recently_confirmed" if is_good else "conflicting"
    confidence = min(99, 70 + (req.hygieneRating * 6))

    target["status"] = new_status
    target["confidenceScore"] = confidence
    target["lastConfirmedAt"] = now_iso
    target["lastConfirmedBy"] = f"Field Inspector ({req.workerName})"
    target["lastStatusNote"] = f"Inspected by field worker: {req.hygieneRating}★ {req.cleanlinessStatus.replace('_', ' ')}. {'Supplies present' if req.suppliesPresent else 'Supplies low'}."

    evidence = {
        "id": f"ev-insp-{int(datetime.utcnow().timestamp()*1000)}",
        "facilityId": facility_id,
        "timestamp": now_iso,
        "source": "community_visitor",
        "status": "available" if is_good else "unavailable",
        "note": f"Field Inspection: {req.hygieneRating} Stars, Cleanliness: {req.cleanlinessStatus}. {req.notes or ''}".strip(),
        "reporterRole": f"Field Inspector ({req.workerName})",
        "confidenceWeight": 0.98
    }
    target.setdefault("evidenceHistory", []).insert(0, evidence)
    db.save_facility(target)

    return {"message": "Field hygiene inspection recorded", "report": report, "facility": target}

@app.get("/api/inspections")
def get_all_inspections():
    return db.get_all_inspections()

@app.get("/api/facilities/{facility_id}/inspections")
def get_facility_inspections(facility_id: str):
    return [i for i in db.get_all_inspections() if i.get("facilityId") == facility_id]

@app.post("/api/facilities/{facility_id}/confirm")
def confirm_facility(facility_id: str, req: ConfirmRequest):
    now_iso = datetime.utcnow().isoformat() + "Z"
    f = db.get_facility_by_id(facility_id)
    if not f:
        for item in db.get_all_facilities():
            if facility_id.lower() in item["name"].lower():
                f = item
                break
    if f:
        evidence = {
            "id": f"ev-{int(datetime.utcnow().timestamp()*1000)}",
            "facilityId": f["id"],
            "timestamp": now_iso,
            "source": "community_visitor" if req.outcome == "available" else "community_failure",
            "status": req.outcome,
            "note": req.note or ("Confirmed usable" if req.outcome == "available" else "Reported unavailable"),
            "reporterRole": req.role,
            "confidenceWeight": 0.92
        }
        f.setdefault("evidenceHistory", []).insert(0, evidence)
        f["lastConfirmedAt"] = now_iso
        f["lastConfirmedBy"] = req.role
        if req.outcome == "available":
            f["status"] = "recently_confirmed"
            f["confidenceScore"] = 96
            f["lastStatusNote"] = f"Confirmed usable by {req.role}"
        else:
            f["status"] = "reported_unavailable"
            f["confidenceScore"] = 15
            f["lastStatusNote"] = f"Reported unavailable by {req.role}"
        db.save_facility(f)
        return f
    raise HTTPException(status_code=404, detail="Facility not found")

@app.post("/api/facilities/{facility_id}/report")
def report_facility_problem(facility_id: str, req: ReportRequest):
    now_iso = datetime.utcnow().isoformat() + "Z"
    f = db.get_facility_by_id(facility_id)
    if not f:
        for item in db.get_all_facilities():
            if facility_id.lower() in item["name"].lower():
                f = item
                break
    if f:
        evidence = {
            "id": f"ev-rep-{int(datetime.utcnow().timestamp()*1000)}",
            "facilityId": f["id"],
            "timestamp": now_iso,
            "source": "community_failure",
            "status": "unavailable",
            "issueType": req.issueType,
            "note": req.note or f"Problem: {req.issueType.replace('_', ' ')}",
            "reporterRole": req.role,
            "confidenceWeight": 0.88
        }
        f.setdefault("evidenceHistory", []).insert(0, evidence)
        f["flaggedForReview"] = True
        f["flagReason"] = f"Problem reported: {req.issueType.replace('_', ' ')}"
        f["confidenceScore"] = 15
        f["lastStatusNote"] = f"Reported {req.issueType.replace('_', ' ')} by {req.role}"
        db.save_facility(f)

        # Also record in platform-wide reports in SQLite
        rep_entry = {
            "id": f"rep-{int(datetime.utcnow().timestamp()*1000)}",
            "facilityId": f["id"],
            "facilityName": f["name"],
            "reporterName": req.role,
            "reporterRole": "worker" if any(w in req.role.lower() for w in ["rider", "worker", "inspector", "swiggy", "zomato"]) else "guest",
            "issueType": req.issueType,
            "severity": "high" if req.issueType in ["no_water", "toilet_unavailable"] else "medium",
            "note": req.note or f"Problem: {req.issueType.replace('_', ' ')}",
            "status": "pending",
            "timestamp": now_iso,
            "clientIp": "127.0.0.1",
            "suggestedAction": "Needs municipal or operator inspection."
        }
        db.save_report(rep_entry)
        return f
    raise HTTPException(status_code=404, detail="Facility not found")

@app.post("/api/ai/parse-request")
def ai_parse_request(req: NLQueryRequest):
    return call_gemini_nl_parser(req.query)

@app.post("/api/operator/facilities/{facility_id}/status")
def operator_set_status(facility_id: str, req: OperatorStatusRequest):
    now_iso = datetime.utcnow().isoformat() + "Z"
    f = db.get_facility_by_id(facility_id)
    if f:
        f["operatorClaimed"] = True
        f["operatorName"] = req.operatorName
        f["status"] = "recently_confirmed" if req.isAvailable else "reported_unavailable"
        f["confidenceScore"] = 99 if req.isAvailable else 5
        f["lastConfirmedAt"] = now_iso
        f["lastConfirmedBy"] = f"Operator ({req.operatorName})"
        f["lastStatusNote"] = f"Operator confirmed {'available now' if req.isAvailable else 'temporarily unavailable'}"
        db.save_facility(f)
        return f
    raise HTTPException(status_code=404, detail="Facility not found")

@app.get("/api/admin/queue")
def admin_get_queue():
    all_facs = db.get_all_facilities()
    flagged = [f for f in all_facs if f.get("flaggedForReview") or f.get("status") in ["conflicting", "stale"]]
    return {
        "pendingReviewCount": len(flagged),
        "items": flagged
    }

@app.post("/api/admin/facilities/{facility_id}/action")
def admin_take_action(facility_id: str, req: AdminActionRequest):
    now_iso = datetime.utcnow().isoformat() + "Z"
    f = db.get_facility_by_id(facility_id)
    if f:
        if req.action == "verify":
            f["verifiedByAdmin"] = True
            f["flaggedForReview"] = False
            f["flagReason"] = None
            f["status"] = "recently_confirmed"
            f["confidenceScore"] = 98
            f["lastStatusNote"] = "Approved & verified by Platform Administrator"
            db.save_facility(f)
        elif req.action == "resolve_conflict":
            f["flaggedForReview"] = False
            f["flagReason"] = None
            f["status"] = "recently_confirmed"
            f["confidenceScore"] = 93
            f["lastStatusNote"] = "Conflict resolved by Platform Administrator inspection"
            db.save_facility(f)
        elif req.action == "mark_stale":
            f["status"] = "stale"
            f["confidenceScore"] = 25
            f["lastStatusNote"] = "Flagged as stale by Administrator pending re-inspection"
            db.save_facility(f)
        elif req.action == "dismiss_spam":
            db.delete_facility(facility_id)
            return {"message": "Listing removed as spam", "id": facility_id}
        return f
    raise HTTPException(status_code=404, detail="Facility not found")

# ----------------- PRODUCTION STATIC FILES SERVING (Cloud Run / SPA) -----------------
FRONTEND_DIST = os.environ.get("FRONTEND_DIST", os.path.join(os.path.dirname(__file__), "..", "dist"))
if os.path.exists(FRONTEND_DIST):
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        # Allow API routes to be handled by FastAPI
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

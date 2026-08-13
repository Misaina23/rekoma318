#!/bin/bash
# Test simple authentication via curl

API="https://rekoma318.onrender.com"
EMAIL="andrianisaina23@gmail.com"
PASSWORD="2311saina!"

echo "🔐 TEST AUTHENTIFICATION REKOMA"
echo "================================"
echo ""
echo "Backend API: $API"
echo "Email: $EMAIL"
echo ""

# Test 1: Login endpoint que le backend expose (/api/auth/login)
echo "1️⃣  Testing /api/auth/login (correct endpoint)"
echo "---"
curl -s -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  | jq . 2>/dev/null || echo "Response: (non-JSON or error)"

echo ""
echo "2️⃣  Testing /api/admin/login (endpoint used by frontend)"
echo "---"
curl -s -X POST "$API/api/admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  | jq . 2>/dev/null || echo "Response: Endpoint not found (404)"

echo ""
echo "✅ Test completed"

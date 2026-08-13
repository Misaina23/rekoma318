#!/usr/bin/env node
/**
 * Test script: Vérifier l'authentification depuis le frontend
 * Teste si les utilisateurs peuvent se connecter via l'API backend
 */

import fetch from 'node-fetch';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rekoma318.onrender.com';

const testCredentials = [
    {
        email: 'andrianisaina23@gmail.com',
        password: '2311saina!',
        expectedRole: 'super_admin'
    }
];

async function testLogin(email, password) {
    console.log(`\n📝 Test Login: ${email}`);
    console.log('─'.repeat(60));

    try {
        // Test 1: Essayer le bon endpoint /api/auth/login
        console.log(`\n1️⃣  Essai endpoint /api/auth/login...`);
        const response1 = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });

        const data1 = await response1.json();

        if (response1.ok) {
            console.log(`✅ SUCCESS - Status ${response1.status}`);
            console.log('Response:', JSON.stringify(data1, null, 2));
            console.log(`\n✅ User connected: ${data1.user?.email || 'N/A'}`);
            console.log(`   Role: ${data1.user?.role || 'N/A'}`);
            return true;
        } else {
            console.log(`❌ FAILED - Status ${response1.status}`);
            console.log('Error:', JSON.stringify(data1, null, 2));
        }

        // Test 2: Essayer l'endpoint utilisé par le frontend /api/admin/login (incorrect)
        console.log(`\n2️⃣  Essai endpoint /api/admin/login (frontend utilise ceci)...`);
        const response2 = await fetch(`${API_URL}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });

        const data2 = await response2.json();

        if (response2.ok) {
            console.log(`✅ SUCCESS - Status ${response2.status}`);
            console.log('Response:', JSON.stringify(data2, null, 2));
        } else {
            console.log(`❌ FAILED - Status ${response2.status}`);
            console.log(`Error: ${response2.statusText}`);
            console.log('Data:', JSON.stringify(data2, null, 2));
        }

        return false;
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        return false;
    }
}

async function testUserStatus() {
    console.log(`\n📋 Test Get User Status`);
    console.log('─'.repeat(60));

    try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`✅ GET /api/auth/me - Status ${response.status}`);
            console.log('Response:', JSON.stringify(data, null, 2));
        } else {
            console.log(`❌ GET /api/auth/me - Status ${response.status}`);
            console.log('Expected 401 (not authenticated)');
        }
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
    }
}

async function testEndpoints() {
    console.log(`\n🔍 Test Available API Endpoints`);
    console.log('─'.repeat(60));

    const endpoints = [
        '/api/health',
        '/api/auth/login',
        '/api/admin/login',
        '/api/users',
        '/api/members',
        '/api/cms/documents'
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'GET',
                timeout: 5000
            });
            console.log(`${response.ok ? '✅' : '⚠️ '} ${endpoint.padEnd(30)} - ${response.status}`);
        } catch (error) {
            console.log(`❌ ${endpoint.padEnd(30)} - ${error.message}`);
        }
    }
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  🔐 TEST AUTHENTIFICATION REKOMA - FRONTEND                ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\nAPI Backend: ${API_URL}`);

    // Test endpoints disponibles
    await testEndpoints();

    // Test user status (pas encore connecté)
    await testUserStatus();

    // Test login avec chaque set de credentials
    for (const cred of testCredentials) {
        const success = await testLogin(cred.email, cred.password);
        if (success) {
            console.log(`\n✅ AUTHENTICATION OK - User can login`);
        } else {
            console.log(`\n⚠️  AUTHENTICATION ISSUE - Check backend logs`);
        }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('Test Completed');
    console.log('═'.repeat(60));
}

main().catch(console.error);

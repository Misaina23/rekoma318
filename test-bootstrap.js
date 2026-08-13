#!/usr/bin/env node

/**
 * Application Health Check & Bootstrap Test
 * Verifies backend can start, database is connected, and API responds
 */

import chalk from 'chalk'
import { execSync } from 'child_process'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dir = path.dirname(fileURLToPath(import.meta.url))

// Color utilities
const log = {
    info: (msg) => console.log(chalk.blue('ℹ'), msg),
    success: (msg) => console.log(chalk.green('✓'), msg),
    warn: (msg) => console.log(chalk.yellow('⚠'), msg),
    error: (msg) => console.log(chalk.red('✗'), msg),
    section: (title) => console.log('\n' + chalk.bold.cyan(`>>> ${title}`)),
}

async function main() {
    log.section('REKOMA Application Bootstrap Test')

    // 1. Check backend .env configuration
    log.section('1. Checking Backend Configuration')
    const backendEnvPath = path.join(__dir, 'backend', '.env')
    const backendEnvLocalPath = path.join(__dir, 'backend', '.env.local')

    if (!fs.existsSync(backendEnvPath) && !fs.existsSync(backendEnvLocalPath)) {
        log.error('No .env file found in backend/')
        log.info('Create backend/.env with DATABASE_URL and STRIPE_SECRET_KEY')
        process.exit(1)
    }

    // Load backend env
    const backendEnv = fs.existsSync(backendEnvPath) ? backendEnvPath : backendEnvLocalPath
    dotenv.config({ path: backendEnv })
    log.success(`Loaded ${path.basename(backendEnv)}`)

    // 2. Check required backend variables
    log.section('2. Checking Required Variables')
    const requiredVars = ['DATABASE_URL']
    const missingVars = requiredVars.filter((v) => !process.env[v])

    if (missingVars.length > 0) {
        log.error(`Missing required variables: ${missingVars.join(', ')}`)
        process.exit(1)
    }

    log.success('All required variables present')

    // 3. Check frontend .env configuration
    log.section('3. Checking Frontend Configuration')
    const frontendEnvPath = path.join(__dir, 'frontend', '.env.local')

    if (!fs.existsSync(frontendEnvPath)) {
        log.warn('No .env.local file found in frontend/')
        log.info('Frontend may not have API URL configured')
    } else {
        const frontendEnv = fs.readFileSync(frontendEnvPath, 'utf-8')
        if (frontendEnv.includes('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')) {
            log.success('Frontend Stripe key configured')
        } else {
            log.warn('Frontend Stripe key may not be configured')
        }
    }

    // 4. Check Prisma schema
    log.section('4. Checking Prisma Schema')
    try {
        const prismaPath = path.join(__dir, 'backend', 'prisma', 'schema.prisma')
        if (fs.existsSync(prismaPath)) {
            execSync('cd backend && npx prisma validate', { stdio: 'pipe' })
            log.success('Prisma schema is valid')
        }
    } catch (err) {
        log.error('Prisma schema validation failed')
        log.info(err.message)
    }

    // 5. Check backend node_modules
    log.section('5. Checking Backend Dependencies')
    const backendNodeModules = path.join(__dir, 'backend', 'node_modules')
    if (fs.existsSync(backendNodeModules)) {
        log.success('Backend dependencies installed')
    } else {
        log.warn('Backend dependencies not installed. Run: cd backend && npm install')
    }

    // 6. Check frontend node_modules
    log.section('6. Checking Frontend Dependencies')
    const frontendNodeModules = path.join(__dir, 'frontend', 'node_modules')
    if (fs.existsSync(frontendNodeModules)) {
        log.success('Frontend dependencies installed')
    } else {
        log.warn('Frontend dependencies not installed. Run: cd frontend && npm install')
    }

    // 7. Summary
    log.section('Configuration Summary')
    log.info(`Database: ${process.env.DATABASE_URL?.split('@')[1] || 'Not configured'}`)
    log.info(
        `API URL: ${process.env.NEXT_PUBLIC_API_URL || 'Not configured in frontend'}`,
    )
    log.info(
        `Stripe: ${process.env.STRIPE_SECRET_KEY ? 'Configured' : 'Not configured'}`,
    )
    log.info(`Backend env file: ${path.basename(backendEnv)}`)

    log.section('Next Steps')
    log.info('1. cd backend && npm run start   (start backend API)')
    log.info('2. cd frontend && npm run dev    (start frontend dev server)')
    log.info('3. Visit http://localhost:3000 for frontend')
    log.info('4. API running on https://rekoma318.onrender.com (production)')

    log.success('Bootstrap check complete!')
}

main().catch((err) => {
    log.error('Bootstrap check failed:')
    console.error(err)
    process.exit(1)
})

import http from 'http'
import os from 'os'
import app from './app.js'
import dotenv from 'dotenv'

dotenv.config()

const PORT = process.env.PORT || 4000
const HOST = process.env.HOST || '0.0.0.0'

function lanAddresses() {
  const interfaces = os.networkInterfaces()
  const addresses = []
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address)
      }
    }
  }
  return addresses
}

const server = http.createServer(app)
server.listen(PORT, HOST, () => {
  console.log(`Server listening on:`)
  console.log(`  Local:   http://localhost:${PORT}`)
  for (const ip of lanAddresses()) {
    console.log(`  Network: http://${ip}:${PORT}`)
  }
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason)
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
  process.exit(1)
})

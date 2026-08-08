import app from './app'
import { prisma } from './lib/prisma'

const port = Number(process.env.PORT) || 4000
const server = app.listen(port, () => {
  console.log(`NexBook API is running on http://localhost:${port}`)
})

let isShuttingDown = false

async function shutdown(signal: NodeJS.Signals) {
  if (isShuttingDown) {
    return
  }

  isShuttingDown = true
  console.log(`Received ${signal}. Shutting down NexBook API.`)

  server.close(async (error) => {
    let exitCode = error ? 1 : 0

    if (error) {
      console.error('Failed to close the HTTP server:', error)
    }

    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error('Failed to disconnect Prisma:', disconnectError)
      exitCode = 1
    }

    process.exit(exitCode)
  })
}

process.once('SIGINT', () => void shutdown('SIGINT'))
process.once('SIGTERM', () => void shutdown('SIGTERM'))

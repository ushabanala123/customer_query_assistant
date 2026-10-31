const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const dotenv = require('dotenv')
const path = require('path')
const { connectDB } = require('./config/db')
const { seedDatabase } = require('./config/seedDatabase')
const { getJwtSecret } = require('./config/security')
const mongoose = require('mongoose')
const authRoutes = require('./routes/authRoutes')
const productRoutes = require('./routes/productRoutes')
const orderRoutes = require('./routes/orderRoutes')
const policyRoutes = require('./routes/policyRoutes')
const chatRoutes = require('./routes/chatRoutes')
const conversationRoutes = require('./routes/conversationRoutes')
const adminRoutes = require('./routes/adminRoutes')

dotenv.config({ path: path.join(__dirname, '../.env') })

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'), {
    dotfiles: 'deny',
    index: false,
    maxAge: '1d',
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff')
    },
  }),
)

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'QueryFlow API is running',
    mode: mongoose.connection.readyState === 1 ? 'database-backed' : 'unavailable',
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/policies', policyRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/conversations', conversationRoutes)
app.use('/api/admin', adminRoutes)

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.use((error, req, res, next) => {
  console.error('Unhandled API error:', error)
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600
    ? error.status
    : error.code === 11000
      ? 409
      : 500
  const message = status === 409
    ? 'A record with the same unique value already exists.'
    : status === 500
      ? 'The server could not complete the request.'
      : error.message
  res.status(status).json({ message })
})

const startServer = async () => {
  getJwtSecret()
  await connectDB()
  await seedDatabase()
  console.log('Application data is ready')

  const listen = (port) => {
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`)
    })

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        const fallbackPort = port + 1
        console.warn(`Port ${port} is already in use. Retrying on ${fallbackPort}.`)
        listen(fallbackPort)
        return
      }

      console.error('Server startup error:', error)
      process.exit(1)
    })
  }

  listen(PORT)
}

startServer().catch((error) => {
  console.error('Server startup failed:', error)
  process.exitCode = 1
})

module.exports = app

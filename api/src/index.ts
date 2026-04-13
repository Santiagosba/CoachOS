import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import authRoutes from './routes/auth'
import clientsRoutes from './routes/clients'
import programRoutes from './routes/programs'
import sessionRoutes from './routes/sessions'
import exerciseRoutes from './routes/exercises'
import clientRoutes from './routes/client'
import programTemplateRoutes from './routes/program-templates'
import adminRoutes from './routes/admin'

const app = express()

const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  cors({
    origin(origin, callback) {
      // Server-to-server, curl, Postman or same-origin requests without Origin
      if (!origin) {
        callback(null, true)
        return
      }

      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new Error('Origen no permitido por CORS'))
    },
    credentials: true,
  })
)
app.use(express.json())

app.use('/auth', authRoutes)
app.use('/clients', clientsRoutes)
app.use('/programs', programRoutes)
app.use('/sessions', sessionRoutes)
app.use('/exercises', exerciseRoutes)
app.use('/client', clientRoutes)
app.use('/program-templates', programTemplateRoutes)
app.use('/admin', adminRoutes)

app.get('/health', (_, res) =>
  res.json({
    ok: true,
    service: 'coachos-api',
    timestamp: new Date().toISOString(),
  })
)

const PORT = process.env.PORT ?? 3000
app.listen(PORT, () => {
  console.log(`CoachOS API running on port ${PORT}`)
})

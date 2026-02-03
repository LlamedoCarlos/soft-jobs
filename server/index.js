import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import bcrypt from 'bcryptjs'
import { pool } from './db.js'
import requireFields from './middlewares/requireFields.js'
import validateToken from './middlewares/validateToken.js'
import { signToken } from './utils/jwt.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.post('/usuarios', requireFields(['email', 'password', 'rol', 'lenguage']), async (req, res, next) => {
  const { email, password, rol, lenguage } = req.body

  try {
    const passwordHash = await bcrypt.hash(password, 10)
    const query = 'INSERT INTO usuarios (email, password, rol, lenguage) VALUES ($1, $2, $3, $4) RETURNING id, email, rol, lenguage'
    const values = [email, passwordHash, rol, lenguage]

    const { rows } = await pool.query(query, values)

    return res.status(201).json({
      message: 'Usuario registrado con éxito.',
      user: rows[0]
    })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'El email ya está registrado.' })
    }
    return next(error)
  }
})

app.post('/login', requireFields(['email', 'password']), async (req, res, next) => {
  const { email, password } = req.body

  try {
    const query = 'SELECT * FROM usuarios WHERE email = $1'
    const values = [email]
    const { rows } = await pool.query(query, values)

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas.' })
    }

    const user = rows[0]
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas.' })
    }

    const token = signToken({ email: user.email })

    return res.json({ token })
  } catch (error) {
    return next(error)
  }
})

app.get('/usuarios', validateToken, async (req, res, next) => {
  try {
    const query = 'SELECT id, email, rol, lenguage FROM usuarios WHERE email = $1'
    const values = [req.user.email]
    const { rows } = await pool.query(query, values)

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' })
    }

    return res.json(rows)
  } catch (error) {
    return next(error)
  }
})

app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor.'
  })
})

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`)
})

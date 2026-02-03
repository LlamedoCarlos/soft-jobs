import jwt from 'jsonwebtoken'

const getSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    console.warn('JWT_SECRET no está configurado. Usando clave por defecto.')
  }
  return secret || 'softjobs-secret'
}

const signToken = (payload, options = {}) => {
  return jwt.sign(payload, getSecret(), { expiresIn: '1h', ...options })
}

const verifyToken = (token) => {
  return jwt.verify(token, getSecret())
}

export { signToken, verifyToken }

const requireFields = (fields) => (req, res, next) => {
  const missing = fields.filter((field) => !req.body?.[field]?.toString().trim())

  if (missing.length > 0) {
    return res.status(400).json({
      message: `Faltan campos obligatorios: ${missing.join(', ')}`
    })
  }

  next()
}

export default requireFields

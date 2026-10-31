const getJwtSecret = () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'replace_with_a_long_random_secret') {
    throw new Error('Set JWT_SECRET in backend/.env before starting the API.')
  }
  return process.env.JWT_SECRET
}

module.exports = { getJwtSecret }

import request from 'supertest'
import app from '../src/app.js'

describe('Auth endpoints', () => {
  it('returns 401 on /api/auth/me without cookie', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.statusCode).toBe(401)
  })
})

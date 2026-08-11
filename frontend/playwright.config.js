module.exports = {
  testDir: './tests',
  use: {
    headless: true,
    baseURL: process.env.NEXT_PUBLIC_TEST_BASE_URL || 'http://localhost:3000',
  },
}

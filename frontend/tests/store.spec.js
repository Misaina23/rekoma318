const { test, expect } = require('@playwright/test')

async function mockProducts(page) {
  await page.route('**/api/store/products', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [{
          id: 'tee-shirt',
          name: 'Tee-shirt REKOMA',
          description: 'Tee-shirt classique.',
          price: 25000,
          imageUrl: null,
          sizes: ['M'],
        }],
      }),
    })
  )
}

test('a basket line cannot exceed the API quantity limit', async ({ page }) => {
  await mockProducts(page)
  await page.goto('/articles')
  await page.getByLabel('Taille (à préciser)').selectOption('M')
  await page.getByRole('button', { name: 'Ajouter au panier' }).click()

  const increase = page.getByRole('button', { name: 'Quantité +' })
  for (let count = 0; count < 12; count += 1) {
    if (await increase.isEnabled()) await increase.click()
  }

  await expect(page.locator('#commande').getByText('10', { exact: true })).toBeVisible()
  await expect(increase).toBeDisabled()
})

test('checkout saves the order and prepares a WhatsApp confirmation', async ({ page }) => {
  await mockProducts(page)
  let submittedOrder
  await page.route('**/api/store/orders', async (route) => {
    submittedOrder = route.request().postDataJSON()
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        order: {
          id: 'commande-test',
          total: 25000,
          items: [{
            name: 'Tee-shirt REKOMA',
            quantity: 1,
            unitPrice: 25000,
            size: 'M',
          }],
        },
      }),
    })
  })

  await page.goto('/articles')
  await page.getByLabel('Taille (à préciser)').selectOption('M')
  await page.getByRole('button', { name: 'Ajouter au panier' }).click()
  await page.getByLabel('Nom complet').fill('Client Test')
  await page.getByLabel('Téléphone WhatsApp').fill('0341234567')
  await page.getByRole('button', { name: 'Enregistrer et continuer sur WhatsApp' }).click()

  await expect(page.getByText('Demande de commande enregistrée')).toBeVisible()
  expect(submittedOrder).toMatchObject({
    customerName: 'Client Test',
    phone: '0341234567',
    deliveryType: 'pickup',
    items: [{ productId: 'tee-shirt', quantity: 1, size: 'M' }],
  })

  const whatsappLink = page.getByRole('link', { name: 'Envoyer la demande sur WhatsApp' })
  const href = await whatsappLink.getAttribute('href')
  expect(href).toContain('wa.me/261345332429')
  expect(decodeURIComponent(href)).toContain('commande-test')
})

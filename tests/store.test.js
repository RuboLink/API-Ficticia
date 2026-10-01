const http = require('http');
const { createApp } = require('../src/app');

describe('API de tienda en línea', () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    server = createApp().listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  afterEach(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  });

  function send(method, path, body) {
    return new Promise((resolve, reject) => {
      const payload = body === undefined ? undefined : JSON.stringify(body);
      const request = http.request(`${baseUrl}${path}`, {
        method,
        headers: payload ? { 'Content-Type': 'application/json' } : {}
      }, (response) => {
        let responseBody = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          responseBody += chunk;
        });
        response.on('end', () => {
          try {
            resolve({
              status: response.statusCode,
              body: responseBody ? JSON.parse(responseBody) : undefined
            });
          } catch (error) {
            reject(error);
          }
        });
      });

      request.on('error', reject);
      if (payload) {
        request.write(payload);
      }
      request.end();
    });
  }

  test('crea un producto y lista los productos disponibles', async () => {
    const created = await send('POST', '/products', { name: 'Teclado', price: 49.99 });

    expect(created.status).toBe(201);
    expect(created.body).toEqual({ id: 1, name: 'Teclado', price: 49.99 });

    const listed = await send('GET', '/products');
    expect(listed.status).toBe(200);
    expect(listed.body).toEqual([created.body]);
  });

  test('gestiona los productos y las cantidades del carrito', async () => {
    const product = await send('POST', '/products', { name: 'Ratón', price: 20 });

    const firstAddition = await send('POST', '/cart', {
      productId: product.body.id,
      quantity: 2
    });
    expect(firstAddition.status).toBe(201);

    const secondAddition = await send('POST', '/cart', { productId: product.body.id });
    expect(secondAddition.body).toEqual({
      items: [{
        productId: product.body.id,
        name: 'Ratón',
        price: 20,
        quantity: 3,
        subtotal: 60
      }],
      total: 60
    });

    const cart = await send('GET', '/cart');
    expect(cart.status).toBe(200);
    expect(cart.body.total).toBe(60);
    expect(cart.body.items[0].quantity).toBe(3);
  });

  test('completa el checkout y vacía el carrito', async () => {
    const product = await send('POST', '/products', { name: 'Libro', price: 15 });
    await send('POST', '/cart', { productId: product.body.id, quantity: 2 });

    const checkout = await send('POST', '/checkout');
    expect(checkout.status).toBe(201);
    expect(checkout.body).toMatchObject({
      id: 1,
      total: 30,
      status: 'paid',
      items: [{
        productId: product.body.id,
        name: 'Libro',
        price: 15,
        quantity: 2,
        subtotal: 30
      }]
    });
    expect(checkout.body.createdAt).toEqual(expect.any(String));

    const cart = await send('GET', '/cart');
    expect(cart.body).toEqual({ items: [], total: 0 });
  });
});

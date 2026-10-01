const express = require('express');

function createApp() {
  const app = express();
  const products = [];
  let cart = [];
  let nextProductId = 1;
  let nextOrderId = 1;

  app.use(express.json());

  app.post('/products', (req, res) => {
    const { name, price } = req.body || {};

    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre del producto es obligatorio.' });
    }

    if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
      return res.status(400).json({ error: 'El precio debe ser un número mayor o igual a cero.' });
    }

    const product = {
      id: nextProductId++,
      name: name.trim(),
      price
    };

    products.push(product);
    return res.status(201).json(product);
  });

  app.get('/products', (_req, res) => {
    res.json(products);
  });

  app.post('/cart', (req, res) => {
    const { productId, quantity = 1 } = req.body || {};
    const product = products.find((item) => item.id === productId);

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ error: 'La cantidad debe ser un entero mayor que cero.' });
    }

    const cartItem = cart.find((item) => item.productId === productId);
    if (cartItem) {
      cartItem.quantity += quantity;
    } else {
      cart.push({ productId, quantity });
    }

    return res.status(201).json(formatCart(products, cart));
  });

  app.get('/cart', (_req, res) => {
    res.json(formatCart(products, cart));
  });

  app.post('/checkout', (_req, res) => {
    if (cart.length === 0) {
      return res.status(400).json({ error: 'No se puede realizar el checkout con el carrito vacío.' });
    }

    const order = {
      id: nextOrderId++,
      items: formatCart(products, cart).items,
      total: getCartTotal(products, cart),
      status: 'paid',
      createdAt: new Date().toISOString()
    };

    cart = [];
    return res.status(201).json(order);
  });

  app.use((err, _req, res, _next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({ error: 'El cuerpo de la solicitud debe contener JSON válido.' });
    }

    return res.status(500).json({ error: 'Error interno del servidor.' });
  });

  return app;
}

function formatCart(products, cart) {
  const items = cart.map(({ productId, quantity }) => {
    const product = products.find((item) => item.id === productId);
    return {
      productId,
      name: product.name,
      price: product.price,
      quantity,
      subtotal: product.price * quantity
    };
  });

  return {
    items,
    total: items.reduce((sum, item) => sum + item.subtotal, 0)
  };
}

function getCartTotal(products, cart) {
  return formatCart(products, cart).total;
}

module.exports = { createApp };

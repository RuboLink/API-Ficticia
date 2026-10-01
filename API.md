# Documentación de la API

API REST para simular una tienda en línea. Acepta y devuelve JSON; no requiere autenticación.

## URL base

- Desarrollo local: `http://localhost:3000`
- Vercel: la URL asignada al proyecto: `https://api-ficticia.vercel.app/`

Todas las rutas se encuentran en la raíz. Para las solicitudes con cuerpo, envía la cabecera `Content-Type: application/json`.

## Endpoints

### Crear un producto

`POST /products`

Crea un producto y le asigna un identificador numérico.

**Cuerpo**

| Campo | Tipo | Obligatorio | Reglas |
| --- | --- | --- | --- |
| `name` | string | Sí | No puede estar vacío. Se eliminan espacios al principio y al final. |
| `price` | number | Sí | Debe ser finito y mayor o igual a cero. |

**Solicitud**

```json
{
  "name": "Teclado",
  "price": 49.99
}
```

**Respuesta `201 Created`**

```json
{
  "id": 1,
  "name": "Teclado",
  "price": 49.99
}
```

**Errores**

- `400 Bad Request`: nombre vacío o no válido; precio ausente, no numérico o negativo.
- `400 Bad Request`: JSON mal formado.

### Listar productos

`GET /products`

Devuelve todos los productos creados.

**Respuesta `200 OK`**

```json
[
  {
    "id": 1,
    "name": "Teclado",
    "price": 49.99
  }
]
```

Si aún no hay productos, devuelve `200 OK` con `[]`.

### Agregar un producto al carrito

`POST /cart`

Agrega una o más unidades del producto. Si el producto ya está en el carrito, suma la cantidad a la línea existente.

**Cuerpo**

| Campo | Tipo | Obligatorio | Reglas |
| --- | --- | --- | --- |
| `productId` | number | Sí | Debe corresponder a un producto existente. |
| `quantity` | integer | No | Entero mayor que cero. Por defecto es `1`. |

**Solicitud**

```json
{
  "productId": 1,
  "quantity": 2
}
```

**Respuesta `201 Created`**

Devuelve el estado actualizado del carrito:

```json
{
  "items": [
    {
      "productId": 1,
      "name": "Teclado",
      "price": 49.99,
      "quantity": 2,
      "subtotal": 99.98
    }
  ],
  "total": 99.98
}
```

**Errores**

- `400 Bad Request`: cantidad no entera o menor que uno.
- `400 Bad Request`: JSON mal formado.
- `404 Not Found`: no existe un producto con ese identificador.

### Consultar el carrito

`GET /cart`

Devuelve las líneas actuales del carrito y el total calculado como la suma de sus subtotales.

**Respuesta `200 OK`**

```json
{
  "items": [
    {
      "productId": 1,
      "name": "Teclado",
      "price": 49.99,
      "quantity": 2,
      "subtotal": 99.98
    }
  ],
  "total": 99.98
}
```

Si el carrito está vacío, devuelve `200 OK` con `{"items":[],"total":0}`.

### Realizar checkout

`POST /checkout`

Simula el pago del carrito actual. No procesa pagos reales ni recibe información financiera. Si el carrito no está vacío, crea un pedido con estado `paid` y luego vacía el carrito.

**Respuesta `201 Created`**

```json
{
  "id": 1,
  "items": [
    {
      "productId": 1,
      "name": "Teclado",
      "price": 49.99,
      "quantity": 2,
      "subtotal": 99.98
    }
  ],
  "total": 99.98,
  "status": "paid",
  "createdAt": "2026-10-01T15:30:00.000Z"
}
```

`createdAt` se devuelve en formato ISO 8601 UTC.

**Error**

- `400 Bad Request`: el carrito está vacío. Respuesta: `{"error":"No se puede realizar el checkout con el carrito vacío."}`.

## Ejemplos con curl

Crear un producto:

```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Teclado\",\"price\":49.99}"
```

Listar productos:

```bash
curl http://localhost:3000/products
```

Agregar dos unidades al carrito:

```bash
curl -X POST http://localhost:3000/cart \
  -H "Content-Type: application/json" \
  -d "{\"productId\":1,\"quantity\":2}"
```

Consultar el carrito:

```bash
curl http://localhost:3000/cart
```

Completar el checkout:

```bash
curl -X POST http://localhost:3000/checkout
```

## Notas

- Los productos, el carrito y el contador de pedidos se almacenan en memoria; reiniciar la aplicación los borra.
- En Vercel, las funciones serverless pueden ejecutarse en instancias distintas. Por ello, este almacenamiento en memoria no garantiza que el estado se comparta ni persista. Para un uso persistente, hace falta una base de datos externa.
- Los precios se representan como números JSON y los importes se calculan multiplicando precio por cantidad.

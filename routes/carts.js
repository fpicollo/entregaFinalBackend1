const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// POST /api/carts - Crear un nuevo carrito.
router.post("/", async (req, res) => {
  try {
    // Crear un carrito vacío
    const newCart = new Cart({ products: [] });

    // Guardar el nuevo carrito en la base de datos
    await newCart.save();

    // Responder con el carrito recién creado
    res.status(201).json({ status: "success", cart: newCart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/carts/:cid/product/:pid - Agregar un producto al carrito
router.post("/:cid/product/:pid", async (req, res) => {
  const { cid, pid } = req.params; // Obtener el ID del carrito y del producto

  try {
    // Buscar el carrito por su ID
    let cart = await Cart.findById(cid);

    // Si el carrito no existe, retornar un error
    if (!cart) {
      return res.status(404).json({ message: "Carrito no encontrado" });
    }

    // Buscar si el producto ya está en el carrito
    const productIndex = cart.products.findIndex((p) => p.product == pid);

    if (productIndex !== -1) {
      // Si el producto ya está en el carrito, incrementar la cantidad
      cart.products[productIndex].quantity += 1;
    } else {
      // Si el producto no está en el carrito, agregarlo con cantidad 1
      cart.products.push({ product: pid, quantity: 1 });
    }

    // Guardar el carrito actualizado
    await cart.save();

    // Responder con el carrito actualizado
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// DELETE /api/carts/:cid/products/:pid - Eliminar un producto del carrito
router.delete("/:cid/products/:pid", async (req, res) => {
  const { cid, pid } = req.params;
  const cart = await Cart.findById(cid);

  if (!cart) return res.status(404).json({ message: "Carrito no encontrado" });

  cart.products = cart.products.filter((product) => product.product != pid);
  await cart.save();

  res.json({ message: "Producto eliminado del carrito" });
});

// PUT /api/carts/:cid - Actualizar el carrito con un arreglo de productos
router.put("/:cid", async (req, res) => {
  const { cid } = req.params;
  const { products } = req.body;
  const cart = await Cart.findById(cid);

  if (!cart) return res.status(404).json({ message: "Carrito no encontrado" });

  cart.products = products;
  await cart.save();

  res.json(cart);
});

// PUT /api/carts/:cid/products/:pid - Actualizar cantidad de un producto en el carrito
router.put("/:cid/products/:pid", async (req, res) => {
  const { cid, pid } = req.params;
  const { quantity } = req.body;

  const cart = await Cart.findById(cid);
  if (!cart) return res.status(404).json({ message: "Carrito no encontrado" });

  const productIndex = cart.products.findIndex(
    (product) => product.product == pid
  );
  if (productIndex === -1)
    return res
      .status(404)
      .json({ message: "Producto no encontrado en el carrito" });

  cart.products[productIndex].quantity = quantity;
  await cart.save();

  res.json(cart);
});

// DELETE /api/carts/:cid - Eliminar todos los productos del carrito
router.delete("/:cid", async (req, res) => {
  const { cid } = req.params;
  const cart = await Cart.findById(cid);

  if (!cart) return res.status(404).json({ message: "Carrito no encontrado" });

  cart.products = [];
  await cart.save();

  res.json({ message: "Carrito vaciado" });
});

// GET /:cid - Obtener todos los productos del carrito con populate
router.get("/:cid", async (req, res) => {
  const { cid } = req.params;
  const cart = await Cart.findById(cid).populate("products.product");

  if (!cart) return res.status(404).json({ message: "Carrito no encontrado" });

  res.json(cart.products);
});

module.exports = router;

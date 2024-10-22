const express = require("express");
const router = express.Router();
const Product = require("../models/Product"); // Importar el modelo de producto

// GET /api/products - Lista todos los productos con paginación, filtros y ordenamiento.
router.get("/", async (req, res) => {
  try {
    let { limit = 10, page = 1, sort, query } = req.query; // Leer parámetros de consulta
    limit = parseInt(limit) || 10;
    page = parseInt(page) || 1;

    // Crear el filtro de búsqueda
    let filter = {};
    if (query) {
      // Filtrar por categoría o estado
      filter = { $or: [{ category: query }, { status: query === "true" }] };
    }

    // Crear la consulta de productos con el filtro
    let productsQuery = Product.find(filter);

    // Aplicar el ordenamiento si se especifica
    if (sort) {
      const sortOrder = sort === "asc" ? 1 : -1;
      productsQuery = productsQuery.sort({ price: sortOrder });
    }

    // Obtener el total de productos para la paginación
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    // Ejecutar la consulta con paginación
    const products = await productsQuery
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    // Responder con los productos y la información de paginación
    res.json({
      status: "success",
      payload: products,
      totalPages,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: page < totalPages ? page + 1 : null,
      page,
      hasPrevPage: page > 1,
      hasNextPage: page < totalPages,
      prevLink:
        page > 1 ? `/api/products?limit=${limit}&page=${page - 1}` : null,
      nextLink:
        page < totalPages
          ? `/api/products?limit=${limit}&page=${page + 1}`
          : null,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// POST /api/products - Agregar un nuevo producto
router.post("/", async (req, res) => {
  const { title, description, code, price, stock, category, thumbnails } =
    req.body;

  // Verificar que todos los campos requeridos están presentes
  if (!title || !description || !code || !price || !stock || !category) {
    return res
      .status(400)
      .json({ message: "Todos los campos son obligatorios" });
  }

  try {
    // Crear el nuevo producto
    const newProduct = new Product({
      title,
      description,
      code,
      price,
      stock,
      category,
      thumbnails: thumbnails || [],
    });

    // Guardar el producto en la base de datos
    await newProduct.save();
    res.status(201).json({ status: "success", product: newProduct });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;

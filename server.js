const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const exphbs = require("express-handlebars");
const path = require("path");
const mongoose = require("mongoose");
const productsRouter = require("./routes/products");
const cartsRouter = require("./routes/carts");
const Cart = require("./models/Cart");
const Product = require("./models/Product");

// Conectar a MongoDB Atlas
mongoose
  .connect(
    "mongodb+srv://yusseffmisseneyt:0aSCx4e5VYoyzSmL@cluster0.p5jgb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => console.log("Conectado a MongoDB Atlas"))
  .catch((err) => console.error("Error al conectar a MongoDB", err));

// Crear la app y el servidor HTTP.
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Configurar Handlebars
const hbs = exphbs.create({});
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

// Middleware para JSON 
app.use(express.json());

// Middleware para añadir `io` a las solicitudes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rutas para productos y carritos
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);

app.get("/realtimeproducts", (req, res) => {
  res.render("realTimeProducts", { title: "Productos en tiempo real" });
});

// Ruta principal para la vista de productos según carrito seleccionado
app.get("/", async (req, res) => {
  const { limit = 10, page = 1, cartId } = req.query; // Obtener carrito seleccionado y parámetros de paginación

  try {
    // Buscar productos con paginación
    const limitParsed = parseInt(limit) || 10;
    const pageParsed = parseInt(page) || 1;
    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / limitParsed);
    const products = await Product.find()
      .skip((pageParsed - 1) * limitParsed)
      .limit(limitParsed);

    // Buscar carrito seleccionado o crear uno nuevo si no existe
    let cart;
    if (cartId) {
      cart = await Cart.findById(cartId).populate("products.product");
    } else {
      cart = new Cart({ products: [] });
      await cart.save();
    }

    res.render("home", {
      title: "Lista de productos",
      products,
      cartId: cart._id, // Pasar el ID del carrito a la vista
      totalPages,
      page: pageParsed,
      hasPrevPage: pageParsed > 1,
      hasNextPage: pageParsed < totalPages,
      prevLink:
        pageParsed > 1
          ? `/?limit=${limitParsed}&page=${pageParsed - 1}&cartId=${cart._id}`
          : null,
      nextLink:
        pageParsed < totalPages
          ? `/?limit=${limitParsed}&page=${pageParsed + 1}&cartId=${cart._id}`
          : null,
    });
  } catch (error) {
    res.status(500).json({ message: "Error al cargar productos" });
  }
});

io.on("connection", (socket) => {
  console.log("Nuevo cliente conectado");
  socket.emit("productList", []);
  socket.on("newProduct", (product) => {
    io.emit("productList", []);
  });
  socket.on("deleteProduct", (id) => {
    io.emit("productList", []);
  });
});

// Iniciar el servidor
httpServer.listen(8080, () => {
  console.log("Server running on port 8080");
});

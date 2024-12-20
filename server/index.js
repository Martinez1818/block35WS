const express = require("express");
const {
  client,
  createTables,
  createUser,
  fetchUsers,
  createProduct,
  fetchProducts,
  createFavorite,
  fetchFavorites,
  destroyFavorite,
} = require("./db");

const app = express();
app.use(express.json());

// GET /api/users
app.get("/api/users", async (req, res, next) => {
  try {
    res.send(await fetchUsers());
  } catch (err) {
    next(err);
  }
});

// GET /api/products
app.get("/api/products", async (req, res, next) => {
  try {
    res.send(await fetchProducts());
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id/favorites
app.get("/api/users/:id/favorites", async (req, res, next) => {
  try {
    res.send(await fetchFavorites(req.params.id));
  } catch (err) {
    next(err);
  }
});

// POST /api/users/:id/favorites
app.post("/api/users/:id/favorites", async (req, res, next) => {
  try {
    const favorite = await createFavorite({
      user_id: req.params.id,
      product_id: req.body.product_id,
    });
    res.status(201).send(favorite);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:userId/favorites/:id
app.delete("/api/users/:userId/favorites/:id", async (req, res, next) => {
  try {
    await destroyFavorite({ id: req.params.id, user_id: req.params.userId });
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send({ error: err.message });
});

// Init function
const init = async () => {
  console.log("Connecting to database...");
  await client.connect();
  console.log("Connected to database!");
  await createTables();
  console.log("Tables created!");

  // Seed the database
  const [alexis, erick] = await Promise.all([
    createUser({ username: "Alexis", password: "password123" }),
    createUser({ username: "Erick", password: "securepass" }),
  ]);

  const [laptop, phone] = await Promise.all([
    createProduct({ name: "Laptop" }),
    createProduct({ name: "Phone" }),
  ]);

  await createFavorite({ user_id: alexis.id, product_id: laptop.id });

  console.log("Users: ", await fetchUsers());
  console.log("Products: ", await fetchProducts());
  console.log("Favorites for Alexis: ", await fetchFavorites(alexis.id));

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
};

init();

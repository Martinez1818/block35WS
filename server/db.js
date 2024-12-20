const pg = require("pg");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/the_acme_store"
);

// Create and Seed Tables
const createTables = async () => {
    // await client.query(`drop table if exists favorites`)
  const SQL = `
    DROP TABLE IF EXISTS favorites;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS users;

    CREATE TABLE users (
      id UUID PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    );

    CREATE TABLE products (
      id UUID PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL
    );

    CREATE TABLE favorites (
      id UUID PRIMARY KEY,
      user_id UUID REFERENCES users(id) NOT NULL,
      product_id UUID REFERENCES products(id) NOT NULL,
      CONSTRAINT unique_favorite UNIQUE (user_id, product_id)
    );
  `;
  await client.query(SQL);
};

// Create a user
const createUser = async ({ username, password }) => {
  const hashedPassword = await bcrypt.hash(password, 5);
  const SQL = `
    INSERT INTO users (id, username, password)
    VALUES ($1, $2, $3)
    RETURNING id, username;
  `;
  const response = await client.query(SQL, [
    uuidv4(),
    username,
    hashedPassword,
  ]);
  return response.rows[0];
};

// Fetch all users
const fetchUsers = async () => {
  const SQL = `
    SELECT id, username FROM users;
  `;
  const response = await client.query(SQL);
  return response.rows;
};

// Create a product
const createProduct = async ({ name }) => {
  const SQL = `
    INSERT INTO products (id, name)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const response = await client.query(SQL, [uuidv4(), name]);
  return response.rows[0];
};

// Fetch all products
const fetchProducts = async () => {
  const SQL = `
    SELECT * FROM products;
  `;
  const response = await client.query(SQL);
  return response.rows;
};

// Create a favorite
const createFavorite = async ({ user_id, product_id }) => {
  const SQL = `
    INSERT INTO favorites (id, user_id, product_id)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const response = await client.query(SQL, [uuidv4(), user_id, product_id]);
  return response.rows[0];
};

// Fetch favorites for a user
const fetchFavorites = async (user_id) => {
  const SQL = `
    SELECT f.id, p.name AS product_name
    FROM favorites f
    JOIN products p ON f.product_id = p.id
    WHERE f.user_id = $1;
  `;
  const response = await client.query(SQL, [user_id]);
  return response.rows;
};

// Delete a favorite
const destroyFavorite = async ({ id, user_id }) => {
  const SQL = `
    DELETE FROM favorites
    WHERE id = $1 AND user_id = $2;
  `;
  await client.query(SQL, [id, user_id]);
};

module.exports = {
  client,
  createTables,
  createUser,
  fetchUsers,
  createProduct,
  fetchProducts,
  createFavorite,
  fetchFavorites,
  destroyFavorite,
};

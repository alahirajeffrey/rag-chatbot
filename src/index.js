require("dotenv").config();
const express = require("express");
const multer = require("multer");
const { initializeDatabase } = require("./db");

const PORT = process.env.PORT || 3001;

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(express.json());

initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`RAG chatbot running on port ${PORT}`);
  });
});

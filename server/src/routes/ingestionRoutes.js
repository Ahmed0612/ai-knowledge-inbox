
const express = require("express");

const {
  ingestContent,
  getItems,
  getItemById,
  deleteItem,
  retryItemEmbeddings
} = require("../controllers/ingestionController");

const router = express.Router();

router.post("/", ingestContent);
router.get("/", getItems);
router.post("/:id/retry-embeddings", retryItemEmbeddings);
router.get("/:id", getItemById);
router.delete("/:id", deleteItem);



module.exports = router;

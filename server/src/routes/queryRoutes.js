
const express = require("express");

const {
  queryKnowledge
} = require("../controllers/queryController");

const router = express.Router();

router.post("/", queryKnowledge);

module.exports = router;

const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
    create,
    getAll,
    getOne,
    update,
    remove,
    generateAI,
} = require("../controllers/questionBankController");

router.post("/generate-ai", protect, generateAI);
router.post("/", protect, create);
router.get("/", protect, getAll);
router.get("/:id", protect, getOne);
router.put("/:id", protect, update);
router.delete("/:id", protect, remove);

module.exports = router;

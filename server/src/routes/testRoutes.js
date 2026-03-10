const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

router.get("/protected",protect,(req,res) => {
    res.json({success: true,message : "This is a protected route",user: req.user});
    });

    module.exports = router;
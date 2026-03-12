const jwt=require('jsonwebtoken');
const User=require('../models/User');

const protect = async (req,res,next) => {
  let token;

  try {
    if(
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    )
    {
      token=req.headers.authorization.split(" ")[1];

      const decoded=jwt.verify(token,process.env.JWT_SECRET);
      
      // Fetch user and attach to request
      req.user = await User.findById(decoded.id);
      
      if(!req.user) {
        return res.status(401).json({message: "User not found"});
      }
      
      next();
    }
    else{
      res.status(401).json({message: "Not authorized, no token"});
    }

  } catch(error){
    console.error(error);
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ message: "Token expired. Please log in again." });
    } else {
      res.status(401).json({ message: "Token failed" });
    }
  }
};

module.exports=protect;

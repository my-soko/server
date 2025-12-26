// middleware/auth.middleware.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export const authMiddleware = (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};


export const adminOnly = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: No user data found" });
    }
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({ message: "An error occurred in admin middleware" });
  }
};


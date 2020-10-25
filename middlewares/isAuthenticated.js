// Import models
const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  if (req.headers.authorization) {
    // Recupérer le token
    const token = req.headers.authorization.replace("Bearer ", "");

    // Verifier si token existe dans BDD
    const user = await User.findOne({ token: token }).select("account _id");

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    } else {
      // On crée une clé "user" dans req. La route dans laquelle le middleware est appelé pourra avoir accès à req.user
      req.user = user;
      return next();
    }
  } else {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = isAuthenticated;

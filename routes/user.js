const express = require("express");
const router = express.Router();
//
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
//
const cloudinary = require("cloudinary").v2;

// Import des models
const User = require("../models/User");

// Routes
// 1. CREATE - Sign Up : Créer un nouvel user dans la BDD
router.post("/user/signup", async (req, res) => {
  try {
    const { email, username, phone, password } = req.fields;
    // 1. Interroger BDD email existe déjà ?
    const emailExists = await User.findOne({ email: email });

    if (emailExists !== null || !username) {
      res.status(409).json({
        message:
          "Invalid request ! Mail already exists or username is undefined",
      });
    } else {
      // Est-ce qu'on a toutes les infos nécessaires?
      if (email && username && password) {
        // 2. Auth : Générer un token et mot de passe
        const salt = uid2(64);
        const hash = SHA256(password + salt).toString(encBase64);
        const token = uid2(64);

        // Upload photo avatar
        const pictureToUpload = req.files.picture.path;
        const infoPicture = await cloudinary.uploader.upload(pictureToUpload);

        // 3. Créer nouvel user
        const newUser = new User({
          email: email,
          account: {
            username: username,
            phone: phone,
            avatar: infoPicture.secure_url,
          },
          token: token,
          hash: hash,
          salt: salt,
        });
        // Save
        await newUser.save();

        // Répondre un objet où on sélectionne les clés à envoyer
        res.status(200).json({
          _id: newUser.id,
          email: newUser.email,
          account: newUser.account,
          token: newUser.token,
          avatar: newUser.avatar,
        });
      } else {
        res.status(400).json({
          message: "Missing parameters",
        });
      }
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 2. Login
router.post("/user/login", async (req, res) => {
  try {
    const email = req.fields.email;
    const password = req.fields.password;

    // Vérifier si le user existe, via email donné
    const user = await User.findOne({ email: email });

    // Existe-il ?
    if (user) {
      // Vérifier si le password est le bon
      const hashToTest = SHA256(password + user.salt).toString(encBase64);

      if (hashToTest === user.hash) {
        res.status(200).json({
          _id: user.id,
          token: user.token,
          account: user.account,
        });
      } else {
        // Le mot de passe n'est pas bon
        res.status(401).json({ message: "Unauthorized !" });
      }
    } else {
      // User n'existe pas
      res.status(400).json({ message: "User not found !" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

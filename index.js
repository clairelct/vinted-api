require("dotenv").config();
const express = require("express");
const formidable = require("express-formidable");
const cors = require("cors");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const stripe = require("stripe")(process.env.STRIPE_API_SECRET);

const app = express();
app.use(formidable({ multiples: true }));
app.use(cors());

//MongoDB Connect
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

// Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Import des routes
const userRoutes = require("./routes/user");
app.use(userRoutes);
const offerRoutes = require("./routes/offer");
app.use(offerRoutes);

app.post("/pay", async (req, res) => {
  try {
    // Récupérer le token Stripe envoyé en body depuis le Frontend
    const { stripeToken, productName, price } = req.fields;

    // Renvoyer le token, la transaction
    const response = await stripe.charges.create({
      amount: price * 100,
      currency: "eur",
      description: `Achat de l'article ${productName}`,
      // token
      source: stripeToken,
    });
    //console.log(response.status);

    // TO DO : Traitement BDD
    res.status(200).json(response);
  } catch (error) {
    console.log(error);
  }
});

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome on Claire's Vinted API !" });
});

app.all("*", (req, res) => {
  res.status(400).json({ message: "Not found" });
});

app.listen(process.env.PORT, () => {
  console.log("Server has started");
});

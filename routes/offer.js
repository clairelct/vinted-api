const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

// Import models
const Offer = require("../models/Offer");
const User = require("../models/User");
// Import Middleware Auth
const isAuthenticated = require("../middlewares/isAuthenticated");
const { query, json } = require("express");

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      condition,
      city,
      brand,
      size,
      color,
    } = req.fields;

    // Etape 1 : Créer une nouvelle annonce (sans l'image)
    const newOffer = new Offer({
      product_name: title,
      product_description: description,
      product_price: price,
      product_details: [
        { MARQUE: brand },
        { TAILLE: size },
        { ÉTAT: condition },
        { COULEUR: color },
        { EMPLACEMENT: city },
      ],
      owner: req.user, // La référence vers l'utilisateur : enregistrée dans middleware
    });

    // Envoyer plusieurs images sur Cloudinary
    const fileKeys = Object.keys(req.files);
    // console.log("req.files : ", req.files); // { [ {}, {}, {} ] }   //   { {}, {} }
    // console.log("fileKeys : ", fileKeys); // [ 'picture', ]   //   [ 'picture', 'picture2']
    let results = {};

    if (fileKeys.length === 0) {
      res.status(400).json({ message: "No file uploaded!" });
    }

    fileKeys.forEach(async (fileKey) => {
      try {
        const file = req.files[fileKey]; // File{...}
        const result = await cloudinary.uploader.upload(file.path, {
          folder: `vinted/offers/${newOffer.id}`,
        });
        results[fileKey] = {
          success: true,
          result: result,
        };

        if (Object.keys(results) === fileKeys.length) {
          newOffer.product_image = results; // MARCHE PAS : Rajouter en BDD les infos images
          return res.status(200).json(results);
        }
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    });

    //newOffer.product_image = results;  // results {} car executé avant forEach
    //console.log(results);

    // Save
    await newOffer.save();

    res.status(200).json(newOffer); //newOffer
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/offers", async (req, res) => {
  try {
    const title = req.query.title; // 'pantalon'
    const priceMin = req.query.priceMin;
    const priceMax = req.query.priceMax;

    const tabQueries = Object.keys(req.query); // ['page']
    const filters = {};

    // A) SI IL Y A DES QUERIES
    if (tabQueries.length !== 0) {
      // Traitement de tri par clés : Rajouter dans filters{} les queries présentes
      if (title) {
        filters.product_name = new RegExp(title, "i"); // 'pantalon' ou 'Pantalon'
      }
      if (priceMin) {
        filters.product_price = { $gte: priceMin };
      }
      if (priceMax) {
        if (filters.product_price) {
          filters.product_price.$lte = priceMax; // product.price = {$lte: priceMax} ??
        } else {
          filters.product_price = { $lte: priceMax };
        }
      }

      // Traitement par ordre de prix
      let sort = {};

      if (req.query.sort) {
        if (req.query.sort === "price-desc") {
          sort = { product_price: -1 };
        } else if (req.query.sort === "price-asc") {
          sort = { product_price: 1 };
        }
      }

      // Affichage
      let page;
      let limit = Number(req.query.limit);

      // Définir numéro de la page :
      if (Number(req.query.page) < 1) {
        page = 1;
      } else {
        page = Number(req.query.page);
      }

      // PREPARATION Response
      const offers = await Offer.find(filters)
        .select("product_name product_price product_description")
        .sort(sort)
        .skip((page - 1) * limit) // Si page 2 => (2-1) * 3 = skip : 3
        .limit(limit);

      // cette ligne va nous retourner le nombre d'annonces trouvées en fonction des filtres
      const count = await Offer.countDocuments(filters);

      res.status(200).json({
        count: count,
        offers: offers,
      });
    } else {
      // B) SI PAS DE QUERIES RENSEIGNÉES, afficher juste les X dernières offres
      const offers = await Offer.find().select(
        "product_name product_price product_description"
      );
      res.status(200).json(offers);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account.username account.phone account.avatar",
    });
    res.status(200).json(offer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

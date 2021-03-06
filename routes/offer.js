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

    let results = {};
    let arrFiles = [];
    const reqFiles = req.files.file; //  Si plusieurs fichier : [{..},{..},{..}] || Si 1 fichier: {...}
    //console.log("arrFiles:", arrFiles);

    // FORMATAGE AVANT TRAITEMENT CLOUDINARY
    if (reqFiles.length === 0) {
      res.status(400).json({ message: "No file uploaded!" });
    } else if (reqFiles.length !== undefined) {
      // Si c'est un tableau
      arrFiles = reqFiles;
    } else {
      //Si c'est 1 fichier
      //En créer un tableau : push dans arrFiles
      arrFiles.push(reqFiles);
    }

    // SI PLUSIEURS FICHIERS À ENVOYER SUR CLOUDINARY

    arrFiles.forEach(async (file, index) => {
      // [{...}] => [i]
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: `vinted/offers/${newOffer.id}`,
        });
        //console.log("RESULT:", result);

        results[`file${index}`] = {
          // { file2:{...}, file0:{...}, file1{...}}
          success: true,
          result: result,
        };
        //console.log("RESULTS:", results);

        if (Object.keys(results).length === arrFiles.length) {
          newOffer.product_image = results;

          // Save
          await newOffer.save();
          //console.log("NEW OFFER", newOffer);
          res.status(200).json(newOffer);
        }
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    });
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
    let limit = Number(req.query.limit); // Tester avec 3 en dur au départ

    // Définir numéro de la page :
    if (Number(req.query.page) < 1) {
      page = 1;
    } else {
      page = Number(req.query.page);
    }

    // PREPARATION Response
    const offers = await Offer.find(filters)
      .populate({
        path: "owner",
        select: "account",
      })
      .sort(sort)
      .skip((page - 1) * limit) // Si page 2 => (2-1) * 3 = skip : 3
      .limit(limit);

    // cette ligne va nous retourner le nombre d'annonces trouvées en fonction des filtres
    const count = await Offer.countDocuments(filters);

    res.status(200).json({
      count: count,
      offers: offers,
    });
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

#!/usr/bin/env node

const { MongoClient } = require("mongodb");

const path = require("path");
const dotenvPath = path.resolve(__dirname, ".env");

try {
  require("dotenv").config({ path: dotenvPath });
} catch (e) {
  console.log("dotenv not installed, using environment variables directly");
}

const DEFAULT_DB_NAME = process.env.DB_NAME || "msme_marketplace";
const MONGODB_URI = process.env.MONGODB_URL || process.env.MONGODB_URI || "mongodb://localhost:27017";

const IMAGE_MAPPING = {
  "ayam-goreng-kremes.jpeg": ["Ayam Goreng Kremes", "Ayam Goreng"],
  "ayam-penyet.jpg": ["Ayam Penyet"],
  "bacang-ayam.jpg": ["Bacang Ayam", "Nasi Bacang"],
  "bakmi.png": ["Bakmi", "Mie Ayam", "Mie Goreng"],
  "bakso-malang.webp": ["Bakso Malang"],
  "brownies.webp": ["Brownies", "Cromboloni", "Putri Salju"],
  "chocolate-milkshake.webp": ["Milkshake Cokelat", "Milkshake"],
  "donat.jpg": ["Donat Kentang", "Donat"],
  "es-cendol.jpeg": ["Es Cendol", "Cendol Dawet", "Cendol"],
  "es-teh-lemon.jpg": ["Es Teh Lemon", "Teh Lemon"],
  "gadogado.webp": ["Gado-Gado"],
  "jus-alpukat.webp": ["Jus Alpukat"],
  "kopi-hitam.jpg": ["Kopi Hitam", "Kopi Hitam Tubruk"],
  "kopi-susu.jpg": ["Kopi Susu", "Kopi Susu Gula Aren", "Es Kopi Susu"],
  "kue-lapis.webp": ["Kue Lapis Legit", "Lapis Legit", "Kue Cubit", "Bolu Pandan", "Kue Nastar", "Kastengel"],
  "lemon-tea.webp": ["Lemon Tea"],
  "matcha-latte.jpg": ["Matcha Latte"],
  "nasi-goreng.webp": ["Nasi Goreng", "Nasi Goreng Special"],
  "nasi-kuning.jpg": ["Nasi Kuning"],
  "nasi-padang.jpg": ["Nasi Padang", "Nasi Padang Paket"],
  "nasi-uduk.jpeg": ["Nasi Uduk", "Nasi Uduk Komplit"],
  "pisang-cokelat.webp": ["Pisang Cokelat", "Pisang Cokelat Crispy"],
  "rendang.webp": ["Rendang", "Rendang Daging"],
  "risole.jpg": ["Risoles", "Risoles Mayo", "Lumpia"],
  "sate-ayam.webp": ["Sate Ayam"],
  "soto-ayam.webp": ["Soto Ayam", "Soto Ayam Bening"],
  "teh-manis.jpg": ["Teh Manis", "Teh Manis Hangat", "Es Teh Manis", "Bandrek Jahe", "Susu Jahe"],
  "thai-tea.webp": ["Thai Tea"],
};

async function updateProductImages() {
  console.log("Connecting to MongoDB...");
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    
    const db = client.db(DEFAULT_DB_NAME);
    const collection = db.collection("products");
    
    let updatedCount = 0;
    let totalMatched = 0;
    
    for (const [filename, productNames] of Object.entries(IMAGE_MAPPING)) {
      const imagePath = `/uploads/products/${filename}`;
      
      for (const productName of productNames) {
        const result = await collection.updateMany(
          { 
            name: { $regex: new RegExp(productName, "i") },
            images: { $not: { $elemMatch: { $regex: /uploads\/products/ } } }
          },
          { 
            $set: { 
              images: [imagePath],
              updatedAt: new Date()
            }
          }
        );
        
        if (result.modifiedCount > 0) {
          console.log(`Updated ${result.modifiedCount} products matching "${productName}" -> ${filename}`);
          updatedCount += result.modifiedCount;
          totalMatched++;
        }
      }
    }
    
    console.log(`\nTotal products updated: ${updatedCount}`);
    console.log(`Total name patterns matched: ${totalMatched}`);
    
    const productsWithLocalImages = await collection.countDocuments({
      images: { $elemMatch: { $regex: /uploads\/products/ } }
    });
    console.log(`Products with local images: ${productsWithLocalImages}`);
    
    const productsWithUnsplash = await collection.countDocuments({
      images: { $elemMatch: { $regex: /source\.unsplash\.com/ } }
    });
    console.log(`Products still using unsplash: ${productsWithUnsplash}`);
    
    console.log("\nDone!");
    
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

updateProductImages();

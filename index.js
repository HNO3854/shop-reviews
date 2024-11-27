import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Environment variables (stored in Render's Secret Manager)
const SHOPIFY_API_TOKEN = process.env.SHOPIFY_API_TOKEN;
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;

// Health check route
app.get("/", (req, res) => {
  res.send("Welcome to the Shopify Reviews Server!");
});

// Route to handle review submissions
app.post("/submit-review", async (req, res) => {
  try {
    const { productId, review } = req.body; // Expecting productId and review object in the request body

    if (!productId || !review) {
      return res.status(400).json({ error: "Invalid request. Product ID and review are required." });
    }

    const metafieldUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2023-04/products/${productId}/metafields.json`;

    // Fetch existing metafields
    const existingMetafieldsResponse = await fetch(metafieldUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_API_TOKEN,
      },
    });

    const existingMetafields = await existingMetafieldsResponse.json();
    const reviewsMetafield = existingMetafields.metafields.find(
      (mf) => mf.namespace === "custom" && mf.key === "reviews_list"
    );

    // Parse the existing reviews or initialize a new array
    let reviews = reviewsMetafield ? JSON.parse(reviewsMetafield.value) : [];
    reviews.push(review);

    // Update the reviews metafield
    const metafieldUpdateUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2023-04/metafields/${reviewsMetafield ? reviewsMetafield.id : ""}.json`;

    const response = await fetch(metafieldUpdateUrl, {
      method: reviewsMetafield ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_API_TOKEN,
      },
      body: JSON.stringify({
        metafield: {
          namespace: "custom",
          key: "reviews_list",
          type: "json",
          value: JSON.stringify(reviews),
        },
      }),
    });

    if (response.ok) {
      res.status(200).send("Review submitted successfully!");
    } else {
      const error = await response.json();
      console.error("Error updating metafield:", error);
      res.status(500).send("Failed to update reviews metafield.");
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal server error.");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

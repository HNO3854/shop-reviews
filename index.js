import express from "express";
import bodyParser from "body-parser";
import cors from "cors"; // Import CORS middleware
import fetch from "node-fetch"; // Import fetch for API requests

const app = express();
const port = 10000;

// Use CORS middleware
app.use(
  cors({
    origin: "https://happynightowl.com", // Allow only your Shopify store domain
    methods: "GET, POST", // Allow only specific HTTP methods
    allowedHeaders: "Content-Type", // Allow specific headers
  })
);

// Middleware
app.use(bodyParser.json());

// Endpoint to fetch reviews
app.get("/reviews", async (req, res) => {
  const { productId } = req.query; // Extract productId from query parameters

  try {
    // Shopify Admin API endpoint to fetch metafields
    const url = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2023-04/products/${productId}/metafields.json`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": process.env.SHOPIFY_API_TOKEN,
      },
    });

    if (!response.ok) {
      return res.status(response.status).send("Failed to fetch reviews.");
    }

    const data = await response.json();
    const metafield = data.metafields.find((field) => field.key === "reviews_list");

    if (metafield) {
      const reviews = JSON.parse(metafield.value);
      const averageRating =
        reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

      return res.status(200).json({
        reviews,
        averageRating,
      });
    } else {
      return res.status(200).json({
        reviews: [],
        averageRating: 0,
      });
    }
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).send("Internal server error");
  }
});

// Endpoint to handle review submissions
app.post("/submit-review", async (req, res) => {
  try {
    const { productId, review } = req.body; // Get product ID and review object from request

    // Fetch existing reviews metafield
    const metafieldUrl = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2023-04/products/${productId}/metafields.json`;
    const existingMetafieldResponse = await fetch(metafieldUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": process.env.SHOPIFY_API_TOKEN,
      },
    });

    if (!existingMetafieldResponse.ok) {
      return res.status(500).send("Failed to fetch existing reviews.");
    }

    const existingMetafieldData = await existingMetafieldResponse.json();
    const existingMetafield = existingMetafieldData.metafields.find(
      (field) => field.key === "reviews_list"
    );

    const reviews = existingMetafield ? JSON.parse(existingMetafield.value) : [];
    reviews.push(review); // Add new review to the list

    // Update the metafield with the new reviews list
    const updateUrl = existingMetafield
      ? `${metafieldUrl}/${existingMetafield.id}.json`
      : metafieldUrl;

    const updateResponse = await fetch(updateUrl, {
      method: existingMetafield ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": process.env.SHOPIFY_API_TOKEN,
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

    if (updateResponse.ok) {
      res.status(200).send("Review submitted successfully!");
    } else {
      const error = await updateResponse.json();
      res.status(500).send(`Error: ${error.errors}`);
    }
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).send("Internal server error");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

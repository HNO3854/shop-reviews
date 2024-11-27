import express from "express";
import bodyParser from "body-parser";
import cors from "cors"; // Import CORS middleware

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

// Endpoint to handle review submissions
app.post("/submit-review", async (req, res) => {
  try {
    const { productId, review } = req.body; // Get product ID and review object from request

    // Shopify Admin API endpoint for metafields
    const url = `https://your-store.myshopify.com/admin/api/2023-04/products/${productId}/metafields.json`;

    // Update the metafield with the new reviews list
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": process.env.SHOPIFY_API_TOKEN,
      },
      body: JSON.stringify({
        metafield: {
          namespace: "custom",
          key: "reviews_list",
          type: "json",
          value: JSON.stringify(review),
        },
      }),
    });

    if (response.ok) {
      res.status(200).send("Review submitted successfully!");
    } else {
      const error = await response.json();
      res.status(500).send(`Error: ${error.errors}`);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

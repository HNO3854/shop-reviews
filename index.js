import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
const port = 3000;

const SHOPIFY_API_TOKEN = process.env.SHOPIFY_API_TOKEN;

app.use(bodyParser.json());

app.post("/submit-review", async (req, res) => {
    try {
        const { productId, reviews } = req.body;

        const url = `https://dwqj3z-pu.myshopify.com/admin/api/2023-04/products/${productId}/metafields.json`;

        const response = await fetch(url, {
            method: "POST",
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
            res.status(500).send(`Error: ${error.errors}`);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

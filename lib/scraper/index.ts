import axios from "axios";
import * as cheerio from "cheerio";
import { extractPrice, extractCurrency, extractDescription } from "../utils";

export async function scrapeAmazonProduct(url: string) {
  if (!url) return;

  //   curl --proxy brd.superproxy.io:22225 --proxy-user brd-customer-hl_8cfbfa84-zone-pricewise:jwfhifn0fegg -k https://lumtest.com/myip.json

  const username = String(process.env.BRIGHT_DATA_USERNAME);
  const password = String(process.env.BRIGHT_DATA_PASSWORD);

  const port = 22225;
  const session_id = (1000000 * Math.random()) | 0;
  const options = {
    auth: {
      username: `${username}-session-${session_id}`,
      password,
    },
    host: "brd.superproxy.io",
    port,
    rejectUnauthorized: false,
  };

  try {
    const response = await axios.get(url, options);
    const $ = cheerio.load(response.data);
    // Extract product title

    const currentPrice = extractPrice(
      $(".a-price-whole").first(),
      $("a.size.base.a-color-price"),
      $("a.button-selected .a-color-base"),
      $(".a-price.a-text-price")
    );

    const originalPrice = extractPrice(
      $("span.a-text-strike").first(),
      $("#priceblock_ourprice"),
      $(".a-price.a-text-price span.a-offscreen"),
      $("#listPrice"),
      $("#priceblock_dealprice"),
      $(".a-size-base.a-color-price")
    );

    const isOutOfStock =
      $("#availibility span").text().trim().toLowerCase() ===
      "currently unavailable";

    const images =
      $("#imgBlkFront").attr("data-a-dynamic-image") ||
      $("#landingImage").attr("data-a-dynamic-image") ||
      "{}";

    const imageUrls = Object.keys(JSON.parse(images));

    const currency = extractCurrency($(".a-price-symbol"));

    const discountRate = $('span[class*="savings-percent"]')
      .first()
      .text()
      .replace(/[-%]/g, "");

    const title = $("#productTitle").text().trim();
    // Construct Data Object with Scraped Information

    const description = extractDescription($);

    const data = {
      url,
      currency: currency || "$",
      image: imageUrls[0],
      title,
      currentPrice: Number(currentPrice),
      originalPrice: parseFloat(originalPrice),
      priceHistory: [],
      discountRate: Number(discountRate),
      category: "category",
      reviewsCount: 100,
      stars: 4.5,
      isOutOfStock,
      description,
      lowestPrice: Number(currentPrice) || parseFloat(originalPrice),
      highestPrice: parseFloat(originalPrice) || Number(currentPrice),
      averagePrice: Number(currentPrice) || parseFloat(originalPrice),
    };

    return data;
  } catch (error: any) {
    throw new Error(`Failed to scrape product ${error.message}`);
  }
}

import { Router } from "express";

const router = Router();

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const EXCHANGERATE_BASE = "https://api.exchangerate-api.com/v4/latest/USD";

const COIN_IDS = [
  "bitcoin",
  "ethereum",
  "solana",
  "dogecoin",
  "binancecoin",
  "ripple",
  "cardano",
  "polkadot",
  "chainlink",
  "avalanche-2",
  "uniswap",
  "litecoin",
];

const COIN_SYMBOLS: Record<string, string> = {
  bitcoin: "BTC",
  ethereum: "ETH",
  solana: "SOL",
  dogecoin: "DOGE",
  binancecoin: "BNB",
  ripple: "XRP",
  cardano: "ADA",
  polkadot: "DOT",
  chainlink: "LINK",
  "avalanche-2": "AVAX",
  uniswap: "UNI",
  litecoin: "LTC",
};

let priceCache: any = null;
let priceCacheTime = 0;
let newsCache: any[] = [];
let newsCacheTime = 0;
let forexCache: any = null;
let forexCacheTime = 0;

router.get("/market/prices", async (req, res) => {
  try {
    const now = Date.now();
    if (priceCache && now - priceCacheTime < 30_000) {
      return res.json(priceCache);
    }

    const ids = COIN_IDS.join(",");
    const url = `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) throw new Error(`CoinGecko error: ${response.status}`);
    const raw = await response.json() as Record<string, any>;

    const coins = Object.entries(raw).map(([id, data]) => ({
      id,
      symbol: COIN_SYMBOLS[id] ?? id.toUpperCase(),
      name: id.charAt(0).toUpperCase() + id.slice(1).replace("-", " "),
      price: data.usd ?? 0,
      change24h: data.usd_24h_change ?? 0,
      marketCap: data.usd_market_cap ?? 0,
      volume24h: data.usd_24h_vol ?? 0,
    }));

    priceCache = { coins, updatedAt: now };
    priceCacheTime = now;
    return res.json(priceCache);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch crypto prices");
    if (priceCache) return res.json(priceCache);
    return res.status(503).json({ error: "Price data unavailable", coins: [] });
  }
});

router.get("/market/forex", async (req, res) => {
  try {
    const now = Date.now();
    if (forexCache && now - forexCacheTime < 60_000) {
      return res.json(forexCache);
    }

    const response = await fetch(EXCHANGERATE_BASE, {
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) throw new Error(`ExchangeRate error: ${response.status}`);
    const data = await response.json() as any;
    const rates = data.rates ?? {};

    const PAIRS = ["EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "NZD", "NGN", "ZAR"];
    const pairs = PAIRS.map((currency) => ({
      pair: `USD/${currency}`,
      rate: rates[currency] ?? 0,
      base: "USD",
      quote: currency,
    }));

    const goldPriceUSD = 2350;
    pairs.unshift({ pair: "XAU/USD", rate: goldPriceUSD, base: "XAU", quote: "USD" });

    forexCache = { pairs, updatedAt: now };
    forexCacheTime = now;
    return res.json(forexCache);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch forex rates");
    if (forexCache) return res.json(forexCache);
    return res.status(503).json({ error: "Forex data unavailable", pairs: [] });
  }
});

router.get("/market/news", async (req, res) => {
  try {
    const now = Date.now();
    if (newsCache.length > 0 && now - newsCacheTime < 300_000) {
      return res.json({ articles: newsCache, updatedAt: newsCacheTime });
    }

    const feeds = [
      {
        url: "https://www.reddit.com/r/CryptoCurrency/hot.json?limit=15",
        source: "Reddit r/CryptoCurrency",
        category: "crypto",
      },
      {
        url: "https://www.reddit.com/r/Forex/hot.json?limit=8",
        source: "Reddit r/Forex",
        category: "forex",
      },
    ];

    const articles: any[] = [];

    for (const feed of feeds) {
      try {
        const response = await fetch(feed.url, {
          headers: { "User-Agent": "TradeMindAI/1.0" },
          signal: AbortSignal.timeout(6000),
        });
        if (!response.ok) continue;
        const data = await response.json() as any;
        const posts = data?.data?.children ?? [];
        for (const post of posts) {
          const p = post.data;
          if (!p.title || p.score < 10) continue;
          articles.push({
            id: p.id,
            title: p.title,
            summary: p.selftext?.slice(0, 200) || p.title,
            url: `https://reddit.com${p.permalink}`,
            source: feed.source,
            category: feed.category,
            score: p.score,
            publishedAt: p.created_utc * 1000,
            thumbnail: p.thumbnail?.startsWith("http") ? p.thumbnail : null,
          });
        }
      } catch {}
    }

    articles.sort((a, b) => b.publishedAt - a.publishedAt);
    newsCache = articles.slice(0, 30);
    newsCacheTime = now;

    return res.json({ articles: newsCache, updatedAt: newsCacheTime });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch market news");
    return res.json({ articles: newsCache, updatedAt: newsCacheTime });
  }
});

router.post("/payment/initiate", async (req, res) => {
  const { planTier, billingInterval, userEmail, userName } = req.body as {
    planTier: "base" | "pro";
    billingInterval: "weekly" | "monthly";
    userEmail: string;
    userName: string;
  };

  const PRICES: Record<string, Record<string, number>> = {
    base: { weekly: 8000, monthly: 24000 },
    pro: { weekly: 16000, monthly: 48000 },
  };

  const amount = PRICES[planTier]?.[billingInterval];
  if (!amount) {
    return res.status(400).json({ error: "Invalid plan or interval" });
  }

  const apiKey = process.env.BLUSALT_API_KEY;
  const baseUrl = process.env.BLUSALT_BASE_URL || "https://api.blusaltpaymentpro.com";
  const appDomain = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS?.split(",")[0];

  if (!apiKey) {
    return res.status(503).json({
      error: "Payment gateway not configured",
      message: "Set BLUSALT_API_KEY environment variable to enable payments",
    });
  }

  try {
    const ref = `TM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const payload = {
      amount,
      currency: "NGN",
      reference: ref,
      customer: {
        email: userEmail,
        name: userName || "Trader",
      },
      metadata: {
        plan: planTier,
        interval: billingInterval,
        app: "TradeMindAI",
      },
      callback_url: `https://${appDomain}/api/payment/callback`,
      return_url: `https://${appDomain}/api/payment/success?ref=${ref}`,
    };

    const response = await fetch(`${baseUrl}/v1/payment/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errText = await response.text();
      req.log.error({ status: response.status, body: errText }, "BluSalt API error");
      throw new Error(`Payment gateway error: ${response.status}`);
    }

    const data = await response.json() as any;
    return res.json({
      paymentUrl: data.payment_url || data.data?.payment_url,
      reference: ref,
      amount,
      currency: "NGN",
    });
  } catch (err) {
    req.log.error({ err }, "Payment initiation failed");
    return res.status(500).json({ error: "Payment initiation failed. Please try again." });
  }
});

router.get("/payment/verify/:reference", async (req, res) => {
  const { reference } = req.params;
  const apiKey = process.env.BLUSALT_API_KEY;
  const baseUrl = process.env.BLUSALT_BASE_URL || "https://api.blusaltpaymentpro.com";

  if (!apiKey) {
    return res.status(503).json({ error: "Payment gateway not configured" });
  }

  try {
    const response = await fetch(`${baseUrl}/v1/payment/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-API-Key": apiKey,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error(`Verification failed: ${response.status}`);
    const data = await response.json() as any;

    return res.json({
      success: data.status === "success" || data.data?.status === "success",
      reference,
      data,
    });
  } catch (err) {
    req.log.error({ err }, "Payment verification failed");
    return res.status(500).json({ error: "Payment verification failed" });
  }
});

export default router;

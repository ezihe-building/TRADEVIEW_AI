import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] ?? "placeholder",
});

router.post("/analyze-chart", async (req, res) => {
  const { imageBase64, imageUri, pair, timeframe, marketType } = req.body as {
    imageBase64?: string;
    imageUri?: string;
    pair?: string;
    timeframe?: string;
    marketType?: string;
  };

  const systemPrompt = `You are TradeMind AI — an expert professional trading analyst specializing in technical analysis.
You analyze trading charts and provide structured, professional insights.

Always respond with a valid JSON object following this exact structure:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "confidence": <number 0-100>,
  "direction": "long" | "short" | "wait",
  "entry": "<price level or range as string>",
  "stopLoss": "<price level as string>",
  "takeProfit": "<price level or target as string>",
  "riskLevel": "low" | "medium" | "high",
  "patterns": ["<pattern1>", "<pattern2>"],
  "indicators": ["<indicator signal1>", "<indicator signal2>"],
  "strategy": "<1-2 sentence trading strategy recommendation>",
  "reasoning": "<2-4 sentence explanation of the analysis>"
}

Rules:
- Base all analysis on visible chart patterns, price action, and structure
- If no image is provided or it's not a chart, still return a valid JSON with realistic analysis for the given pair
- patterns: include candlestick patterns (e.g. "Bullish Engulfing", "Head & Shoulders", "Double Bottom")
- indicators: note RSI, MACD, MA signals if visible (e.g. "RSI Oversold", "MACD Bullish Cross", "Above 200 MA")
- Confidence range: 40-90 (never claim certainty)
- Always emphasize this is for educational purposes`;

  try {
    let messages: OpenAI.Chat.ChatCompletionMessageParam[];

    if (imageBase64) {
      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this ${marketType ?? "crypto"} trading chart for ${pair ?? "Unknown"} on the ${timeframe ?? "1h"} timeframe. Provide a complete technical analysis.`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "high",
              },
            },
          ],
        },
      ];
    } else {
      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Analyze the current market conditions for ${pair ?? "BTC/USDT"} on the ${timeframe ?? "1h"} timeframe in the ${marketType ?? "crypto"} market. Provide a realistic technical analysis based on common market conditions.`,
        },
      ];
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 1024,
      messages,
    });

    const content = completion.choices[0]?.message?.content ?? "{}";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const analysis = JSON.parse(jsonMatch[0]);
    res.json(analysis);
  } catch (err) {
    req.log.error({ err }, "Chart analysis failed");
    res.status(500).json({
      sentiment: "neutral",
      confidence: 50,
      direction: "wait",
      entry: "N/A",
      stopLoss: "N/A",
      takeProfit: "N/A",
      riskLevel: "medium",
      patterns: [],
      indicators: [],
      strategy: "Analysis unavailable. Please try again.",
      reasoning: "The AI analysis could not be completed at this time.",
    });
  }
});

export default router;

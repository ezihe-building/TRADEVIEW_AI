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

  const systemPrompt = `You are TradeMind AI — a highly skilled professional trading analyst and technical analysis expert.
You analyze trading charts with precision and provide actionable, real trading insights.

Always respond with a valid JSON object following this exact structure:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "confidence": <number 65-92>,
  "direction": "long" | "short" | "wait",
  "entry": "<specific price level or range>",
  "stopLoss": "<specific price level>",
  "takeProfit": "<specific price level or target>",
  "riskRewardRatio": "<e.g. 1:2.5>",
  "riskLevel": "low" | "medium" | "high",
  "patterns": ["<pattern1>", "<pattern2>"],
  "indicators": ["<indicator signal1>", "<indicator signal2>"],
  "keyLevels": {
    "support": "<price level>",
    "resistance": "<price level>"
  },
  "strategy": "<2-3 sentence professional trading strategy recommendation>",
  "reasoning": "<3-5 sentence detailed technical analysis explanation covering price structure, momentum, and key confluences>",
  "tradeManagement": "<1-2 sentence on position sizing and trade management advice>"
}

Rules:
- Base all analysis on visible chart patterns, price action, candle structure, and market context
- If no image is provided, generate a realistic and consistent analysis for the given pair based on common market conditions
- patterns: identify specific candlestick and chart patterns (e.g. "Bullish Engulfing", "Head & Shoulders", "Double Bottom", "Bull Flag", "Descending Triangle")
- indicators: identify RSI, MACD, MA cross signals if visible (e.g. "RSI Oversold at 28", "MACD Bullish Crossover", "Price above 200 EMA", "Volume Spike on Breakout")
- Confidence range: 65-92 — be realistic and specific, not generic
- Entry, stop loss and take profit must be specific price levels, not vague ranges
- riskRewardRatio must reflect the entry/SL/TP math
- reasoning must be professional and cover: trend direction, momentum, key confluences, risk factors
- tradeManagement should mention risk per trade (e.g. 1-2% of account)`;

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
              text: `Perform a full professional technical analysis on this ${marketType ?? "crypto"} chart for ${pair ?? "Unknown"} on the ${timeframe ?? "1h"} timeframe. Identify all visible patterns, indicator signals, key levels, and provide specific entry, stop loss, and take profit levels. Be precise and professional.`,
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
          content: `Analyze the current market conditions for ${pair ?? "BTC/USDT"} on the ${timeframe ?? "1h"} timeframe in the ${marketType ?? "crypto"} market. Provide a complete and realistic professional technical analysis with specific price levels.`,
        },
      ];
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      max_completion_tokens: 1500,
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
      riskRewardRatio: "N/A",
      riskLevel: "medium",
      patterns: [],
      indicators: [],
      keyLevels: { support: "N/A", resistance: "N/A" },
      strategy: "Analysis unavailable. Please try again.",
      reasoning: "The AI analysis could not be completed at this time.",
      tradeManagement: "N/A",
    });
  }
});

export default router;

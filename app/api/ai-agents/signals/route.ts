import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(req: Request) {
  try {
    const { agentId, agentType, assets, indicators, riskTolerance } = await req.json()

    // Create a prompt based on the agent configuration
    const prompt = `
      You are an AI trading agent specialized in ${agentType}. 
      Generate 1 detailed trading signal for one of these assets: ${assets.join(", ")}.
      
      Use these technical indicators in your analysis: ${indicators.join(", ")}.
      Your risk tolerance level is: ${riskTolerance}/100 (higher means more aggressive).
      
      Format your response as a JSON object with these fields:
      - asset: The cryptocurrency symbol (e.g., "BTC")
      - type: Either "Buy" or "Sell"
      - signal: A detailed explanation of the signal (1-2 sentences)
      - confidence: A number between 65-95 representing confidence level
      - price: A realistic current price for the asset
      - timeframe: The recommended timeframe for this trade (e.g., "4h", "1d", "1w")
    `

    // Generate the signal using AI
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.7,
      maxTokens: 500,
    })

    // Parse the AI-generated text into JSON
    let signal
    try {
      signal = JSON.parse(text)
    } catch (error) {
      console.error("Error parsing AI response:", error)
      console.log("Raw AI response:", text)

      // Fallback signal if parsing fails
      signal = {
        asset: assets[0] || "BTC",
        type: Math.random() > 0.5 ? "Buy" : "Sell",
        signal: "Technical indicators suggest a potential price movement.",
        confidence: Math.floor(Math.random() * 20) + 75,
        price: 45000,
        timeframe: "1d",
      }
    }

    // Add additional metadata
    const enrichedSignal = {
      ...signal,
      id: `${agentId}-${Date.now()}`,
      agentId,
      timestamp: new Date().toISOString(),
      result: "Pending",
    }

    return NextResponse.json(enrichedSignal)
  } catch (error) {
    console.error("Error generating AI signal:", error)
    return NextResponse.json({ error: "Failed to generate signal" }, { status: 500 })
  }
}

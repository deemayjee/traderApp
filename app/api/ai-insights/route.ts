import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function GET() {
  try {
    // This would typically connect to a real API or database
    // For demo purposes, we're generating insights with AI
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt:
        'Generate 3 crypto market insights in JSON format. Each insight should have a type (signal, trend, or alert), title, description, confidence (number between 60-95), and time (like "2h ago"). Make them realistic and specific.',
    })

    // Parse the AI-generated text into JSON
    const insights = JSON.parse(text)

    return NextResponse.json(insights)
  } catch (error) {
    console.error("Error generating AI insights:", error)
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 })
  }
}

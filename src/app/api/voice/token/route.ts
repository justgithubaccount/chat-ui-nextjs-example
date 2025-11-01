import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

// Validation schema for voice session configuration
const VoiceSessionConfigSchema = z.object({
  model: z.string().optional().default("gpt-realtime"),
  voice: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]).optional().default("alloy"),
  instructions: z.string().optional(),
  temperature: z.number().min(0).max(2).optional().default(0.8),
  tools: z.array(z.any()).optional().default([]),
  tool_choice: z.string().optional().default("auto"),
  max_response_output_tokens: z.number().min(1).max(4096).optional().default(4096)
});

/**
 * API Route: Generate ephemeral token for OpenAI Realtime API
 * This creates a secure, short-lived token that clients can use to connect
 * to the OpenAI Realtime API via WebRTC without exposing the main API key.
 */
export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error("OPENAI_API_KEY is not configured");
      return NextResponse.json(
        { error: "Voice features are not configured" },
        { status: 503 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // Validate configuration
    const validationResult = VoiceSessionConfigSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid configuration",
          details: validationResult.error.flatten()
        },
        { status: 400 }
      );
    }

    const config = validationResult.data;

    // Build session configuration
    const sessionConfig = {
      type: "realtime",
      model: config.model,
      instructions: config.instructions || "You are a helpful assistant engaging in a voice conversation.",
      voice: config.voice,
      input_audio_format: "pcm16",
      output_audio_format: "pcm16",
      input_audio_transcription: {
        model: "whisper-1"
      },
      turn_detection: {
        type: "server_vad", // Voice Activity Detection
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500
      },
      tools: config.tools,
      tool_choice: config.tool_choice,
      temperature: config.temperature,
      max_response_output_tokens: config.max_response_output_tokens
    };

    // Request ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: sessionConfig
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to generate voice session token" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Validate token format
    if (!data.value || typeof data.value !== 'string' || !data.value.startsWith("ek_")) {
      console.error("Invalid token format received from OpenAI");
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 500 }
      );
    }

    // Return the ephemeral token along with session metadata
    return NextResponse.json({
      token: data.value,
      expiresIn: 60, // Token expires in 60 seconds
      sessionConfig: {
        model: config.model,
        voice: config.voice,
        instructions: config.instructions
      },
      userId: session.user.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error generating voice token:", error);
    return NextResponse.json(
      { error: "Failed to generate voice session token" },
      { status: 500 }
    );
  }
}

// GET endpoint to check if voice features are available
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const isConfigured = !!process.env.OPENAI_API_KEY;
  const enableVoice = process.env.ENABLE_VOICE_FEATURES !== "false";

  return NextResponse.json({
    available: isConfigured && enableVoice,
    models: ["gpt-realtime"],
    voices: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"],
    features: {
      webrtc: true,
      websocket: false, // Server-side only
      transcription: true,
      interruption: true,
      tools: true
    }
  });
}
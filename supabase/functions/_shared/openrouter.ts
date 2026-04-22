import { logger } from "./logger.ts";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const APP_NAME = "Founder Diaries";
const APP_URL = "https://founderdiaries.app";

/** OpenRouter model constants — select the right model for each job */
export const MODELS = {
  /** Creative writing, voice matching, tool use — best quality */
  CONTENT_GENERATION: "deepseek/deepseek-chat-v3-0324",
  /** Analytical tasks, JSON extraction — fast + cheap */
  ANALYSIS: "google/gemini-2.5-flash",
  /** Image generation via multimodal model */
  IMAGE_GENERATION: "google/gemini-2.5-flash",
  /** Post-generation humanise pass — cheap + fast */
  HUMANISE: "deepseek/deepseek-chat-v3-0324",
} as const;

/** Anthropic-style tool → OpenAI-style tool */
export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface OpenAITool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export function convertTool(anthropicTool: AnthropicTool): OpenAITool {
  return {
    type: "function",
    function: {
      name: anthropicTool.name,
      description: anthropicTool.description,
      parameters: anthropicTool.input_schema,
    },
  };
}

/** Message format for OpenRouter (OpenAI-compatible) */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterOptions {
  model: string;
  messages: ChatMessage[];
  tools?: OpenAITool[];
  tool_choice?: { type: "function"; function: { name: string } };
  max_tokens?: number;
  temperature?: number;
}

interface OpenRouterChoice {
  message: {
    content: string | null;
    tool_calls?: Array<{
      id: string;
      type: "function";
      function: {
        name: string;
        arguments: string;
      };
    }>;
  };
}

interface OpenRouterResponse {
  id: string;
  choices: OpenRouterChoice[];
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

function getApiKey(): string {
  const key = Deno.env.get("OPENROUTER_API_KEY");
  if (!key) throw new Error("OPENROUTER_API_KEY not configured");
  return key;
}

/**
 * Call OpenRouter chat completions API.
 * Handles auth, logging, and error propagation.
 */
export async function callOpenRouter(
  options: OpenRouterOptions,
  context?: { functionName?: string; userId?: string }
): Promise<OpenRouterResponse> {
  const apiKey = getApiKey();
  const startTime = Date.now();

  const body: Record<string, unknown> = {
    model: options.model,
    messages: options.messages,
    max_tokens: options.max_tokens ?? 2048,
  };

  if (options.temperature !== undefined) {
    body.temperature = options.temperature;
  }
  if (options.tools && options.tools.length > 0) {
    body.tools = options.tools;
  }
  if (options.tool_choice) {
    body.tool_choice = options.tool_choice;
  }

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": APP_URL,
      "X-Title": APP_NAME,
    },
    body: JSON.stringify(body),
  });

  const latencyMs = Date.now() - startTime;

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error("OpenRouter API error", {
      functionName: context?.functionName ?? "unknown",
      userId: context?.userId ?? "unknown",
      metadata: {
        model: options.model,
        status: response.status,
        body: errorBody,
        latencyMs,
      },
    });
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const result = (await response.json()) as OpenRouterResponse;

  logger.info("OpenRouter call completed", {
    functionName: context?.functionName ?? "unknown",
    userId: context?.userId ?? "unknown",
    metadata: {
      model: result.model,
      latencyMs,
      promptTokens: result.usage?.prompt_tokens,
      completionTokens: result.usage?.completion_tokens,
    },
  });

  return result;
}

/**
 * Simplified text-only call — no tools.
 * Returns the raw text content from the first choice.
 */
export async function callOpenRouterChat(
  model: string,
  messages: ChatMessage[],
  maxTokens = 2048,
  context?: { functionName?: string; userId?: string }
): Promise<string> {
  const result = await callOpenRouter(
    { model, messages, max_tokens: maxTokens },
    context,
  );
  return extractTextContent(result);
}

/**
 * Extract tool call arguments from an OpenRouter response.
 * Returns the parsed JSON object from the first tool call.
 */
export function extractToolUse(
  response: OpenRouterResponse
): Record<string, unknown> | null {
  const toolCalls = response.choices?.[0]?.message?.tool_calls;
  if (!toolCalls || toolCalls.length === 0) return null;

  const firstCall = toolCalls[0];
  try {
    return JSON.parse(firstCall.function.arguments) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Extract text content from an OpenRouter response.
 */
export function extractTextContent(response: OpenRouterResponse): string {
  return response.choices?.[0]?.message?.content ?? "";
}

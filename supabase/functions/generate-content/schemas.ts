import { z } from "npm:zod@3";
import type { OpenAITool } from "../_shared/openrouter.ts";

export const LinkedInPostSchema = z.object({
  title: z.string().min(1).max(100),
  hookLine: z.string().min(1).max(200),
  bodyText: z.string().min(50).max(2000),
  hashtags: z.array(z.string()).min(3).max(5),
  imagePrompt: z.string().min(1).max(300),
  estimatedReadTime: z.number().int().min(1).max(10),
});

export const CarouselSlideSchema = z.object({
  slideNumber: z.number().int().min(1),
  heading: z.string().min(1).max(80),
  bodyText: z.string().min(1).max(150),
  imagePrompt: z.string().min(1).max(200),
});

export const CarouselSchema = z.object({
  title: z.string().min(1).max(100),
  caption: z.string().min(50).max(500),
  slides: z.array(CarouselSlideSchema).min(4).max(10),
  hashtags: z.array(z.string()).min(3).max(5),
});

export const ThreadTweetSchema = z.object({
  order: z.number().int().min(1),
  text: z.string().min(1).max(280),
});

export const ThreadSchema = z.object({
  title: z.string().min(1).max(100),
  tweets: z.array(ThreadTweetSchema).min(4).max(10),
  imagePrompt: z.string().min(1).max(300),
});

export const SinglePostSchema = z.object({
  title: z.string().min(1).max(100),
  bodyText: z.string().min(1).max(280),
  hashtags: z.array(z.string()).min(0).max(2),
  imagePrompt: z.string().min(1).max(300),
});

export type LinkedInPost = z.infer<typeof LinkedInPostSchema>;
export type Carousel = z.infer<typeof CarouselSchema>;
export type Thread = z.infer<typeof ThreadSchema>;
export type SinglePost = z.infer<typeof SinglePostSchema>;

// OpenAI-format tool definitions for OpenRouter
function makeTool(
  name: string,
  description: string,
  parameters: Record<string, unknown>
): OpenAITool {
  return { type: "function", function: { name, description, parameters } };
}

export const contentTools = {
  linkedin_post: makeTool("create_linkedin_post", "Create a structured LinkedIn post from diary content", {
    type: "object",
    properties: {
      title: { type: "string", description: "Short title summarizing the post topic" },
      hookLine: { type: "string", description: "Opening hook line to grab attention" },
      bodyText: { type: "string", description: "Full post body text with paragraphs" },
      hashtags: { type: "array", items: { type: "string" }, description: "3-5 relevant hashtags without #" },
      imagePrompt: { type: "string", description: "Detailed prompt for generating a complementary image" },
      estimatedReadTime: { type: "number", description: "Estimated read time in minutes" },
    },
    required: ["title", "hookLine", "bodyText", "hashtags", "imagePrompt", "estimatedReadTime"],
  }),

  carousel: makeTool("create_carousel", "Create a structured LinkedIn carousel from diary content", {
    type: "object",
    properties: {
      title: { type: "string", description: "Carousel series title" },
      caption: { type: "string", description: "Post caption accompanying the carousel" },
      slides: {
        type: "array",
        items: {
          type: "object",
          properties: {
            slideNumber: { type: "number" },
            heading: { type: "string", description: "Slide heading, max 80 chars" },
            bodyText: { type: "string", description: "Slide body text, max 150 chars" },
            imagePrompt: { type: "string", description: "Visual concept for this slide" },
          },
          required: ["slideNumber", "heading", "bodyText", "imagePrompt"],
        },
        description: "4-10 carousel slides",
      },
      hashtags: { type: "array", items: { type: "string" }, description: "3-5 relevant hashtags without #" },
    },
    required: ["title", "caption", "slides", "hashtags"],
  }),

  thread: makeTool("create_thread", "Create a structured X thread from diary content", {
    type: "object",
    properties: {
      title: { type: "string", description: "Thread topic title" },
      tweets: {
        type: "array",
        items: {
          type: "object",
          properties: {
            order: { type: "number" },
            text: { type: "string", description: "Tweet text, max 280 characters" },
          },
          required: ["order", "text"],
        },
        description: "4-10 tweets forming the thread",
      },
      imagePrompt: { type: "string", description: "Visual concept for the first tweet image" },
    },
    required: ["title", "tweets", "imagePrompt"],
  }),

  single_post: makeTool("create_single_post", "Create a single X post from diary content", {
    type: "object",
    properties: {
      title: { type: "string" },
      bodyText: { type: "string", description: "Tweet text, max 280 characters" },
      hashtags: { type: "array", items: { type: "string" }, description: "0-2 hashtags" },
      imagePrompt: { type: "string", description: "Visual concept for the post image" },
    },
    required: ["title", "bodyText", "hashtags", "imagePrompt"],
  }),

};

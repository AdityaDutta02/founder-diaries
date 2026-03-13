import { z } from "npm:zod@3";

export const TranscribeRequestSchema = z.object({
  diaryEntryId: z.string().uuid(),
  audioStoragePath: z.string().min(1),
});

export const GenerateContentRequestSchema = z.object({
  userId: z.string().uuid(),
  diaryEntryId: z.string().uuid(),
  platform: z.enum(["linkedin", "instagram", "x"]),
  contentType: z.enum(["post", "carousel", "thread", "reel_caption"]),
});

export const GenerateImageRequestSchema = z.object({
  postId: z.string().uuid(),
  imagePrompt: z.string().min(1).max(500),
  aspectRatio: z.enum(["1:1", "4:5", "16:9"]),
});

export const ScrapeCreatorsRequestSchema = z.object({
  userId: z.string().uuid(),
  platforms: z.array(z.enum(["linkedin", "instagram", "x"])).min(1),
  nicheKeywords: z.array(z.string()).min(1),
  industry: z.string().min(1),
});

export const AnalyzeCreatorsRequestSchema = z.object({
  userId: z.string().uuid(),
  platform: z.enum(["linkedin", "instagram", "x"]),
});

export const SyncDiaryRequestSchema = z.object({
  entries: z.array(
    z.object({
      localId: z.string(),
      entryDate: z.string(),
      textContent: z.string().optional(),
      audioStoragePath: z.string().optional(),
      imageStoragePaths: z.array(z.string()).optional(),
      mood: z.string().optional(),
    })
  ),
});

export type TranscribeRequest = z.infer<typeof TranscribeRequestSchema>;
export type GenerateContentRequest = z.infer<typeof GenerateContentRequestSchema>;
export type GenerateImageRequest = z.infer<typeof GenerateImageRequestSchema>;
export type ScrapeCreatorsRequest = z.infer<typeof ScrapeCreatorsRequestSchema>;
export type SyncDiaryRequest = z.infer<typeof SyncDiaryRequestSchema>;

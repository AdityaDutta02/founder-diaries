import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { AppError, handleError } from "../_shared/errors.ts";
import { logger } from "../_shared/logger.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { GenerateImageRequestSchema } from "../_shared/validators.ts";
import {
  callOpenRouter,
  MODELS,
  type ChatMessage,
} from "../_shared/openrouter.ts";

const MODEL = MODELS.IMAGE_GENERATION;

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const functionName = "generate-image";

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new AppError("Missing Authorization header", 401);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new AppError("Invalid or expired token", 401);

    // Parse and validate body
    const rawBody = await req.json();
    const parseResult = GenerateImageRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      throw new AppError("Invalid request body", 400, { issues: parseResult.error.issues });
    }
    const { postId, imagePrompt, aspectRatio } = parseResult.data;

    // Verify the post belongs to the authenticated user
    const { data: post, error: postError } = await supabaseAdmin
      .from("generated_posts")
      .select("id, user_id")
      .eq("id", postId)
      .single();

    if (postError || !post) throw new AppError("Post not found", 404);
    if (post.user_id !== user.id) throw new AppError("Forbidden", 403);

    logger.info("Image generation started", {
      functionName,
      userId: user.id,
      metadata: { postId, aspectRatio },
    });

    // Build the full image prompt
    const fullPrompt = `Create a professional social media graphic. Topic: ${imagePrompt}. Style: Clean, modern, visually striking. No text overlay. Aspect ratio: ${aspectRatio}. High quality, suitable for professional social media.`;

    // Call OpenRouter with Gemini Flash for image generation
    const messages: ChatMessage[] = [
      { role: "user", content: fullPrompt },
    ];

    const response = await callOpenRouter(
      {
        model: MODEL,
        messages,
        max_tokens: 4096,
      },
      { functionName, userId: user.id },
    );

    // Extract image data from response
    // OpenRouter returns Gemini image gen as base64 in the response content
    const content = response.choices?.[0]?.message?.content ?? "";

    // Check if we got an inline image (base64 data URL pattern)
    const base64Match = content.match(/data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)/);

    let imageBytes: Uint8Array;
    let mimeType: string;

    if (base64Match) {
      mimeType = `image/${base64Match[1]}`;
      imageBytes = Uint8Array.from(
        atob(base64Match[2]),
        (char) => char.charCodeAt(0)
      );
    } else {
      // Fallback: try parsing the raw content as a base64 string
      // Some OpenRouter responses return raw base64 without data URL prefix
      try {
        imageBytes = Uint8Array.from(
          atob(content.trim()),
          (char) => char.charCodeAt(0)
        );
        mimeType = "image/png";
      } catch {
        logger.error("No valid image data in AI response", {
          functionName,
          userId: user.id,
          metadata: { contentLength: content.length, contentPreview: content.slice(0, 200) },
        });
        throw new AppError("No image returned from generation service", 500);
      }
    }

    const extension = mimeType.split("/")[1] ?? "png";

    // Upload to Supabase Storage
    const storagePath = `${user.id}/${postId}.${extension}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("generated-images")
      .upload(storagePath, imageBytes, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      throw new AppError("Failed to upload generated image", 500, {
        storageError: uploadError.message,
      });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("generated-images")
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Update the generated post with the image URL
    const { error: updateError } = await supabaseAdmin
      .from("generated_posts")
      .update({
        generated_image_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    if (updateError) {
      throw new AppError("Failed to update post with image URL", 500);
    }

    logger.info("Image generation completed", {
      functionName,
      userId: user.id,
      metadata: { postId, storagePath, model: MODEL },
    });

    return new Response(
      JSON.stringify({ success: true, imageUrl: publicUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return handleError(error, functionName);
  }
});

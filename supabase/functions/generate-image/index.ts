import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { AppError, handleError } from "../_shared/errors.ts";
import { logger } from "../_shared/logger.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { GenerateImageRequestSchema } from "../_shared/validators.ts";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_IMAGE_MODEL = "gemini-2.0-flash-exp";

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

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) throw new AppError("GEMINI_API_KEY not configured", 500);

    // Build the full image prompt
    const fullPrompt = `Create a professional social media graphic. Topic: ${imagePrompt}. Style: Clean, modern, visually striking. No text overlay. Aspect ratio: ${aspectRatio}. High quality, suitable for professional social media.`;

    // Call Gemini image generation API
    const geminiUrl = `${GEMINI_API_BASE}/${GEMINI_IMAGE_MODEL}:generateContent?key=${geminiApiKey}`;
    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: fullPrompt },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE"],
        },
      }),
    });

    if (!geminiResponse.ok) {
      const geminiError = await geminiResponse.text();
      logger.error("Gemini API error", {
        functionName,
        userId: user.id,
        metadata: { status: geminiResponse.status, body: geminiError },
      });
      throw new AppError("Image generation service error", 502);
    }

    const geminiResult = await geminiResponse.json();
    const imagePart = geminiResult.candidates?.[0]?.content?.parts?.find(
      (part: { inlineData?: { mimeType: string; data: string } }) => part.inlineData
    );

    if (!imagePart?.inlineData?.data) {
      throw new AppError("No image returned from generation service", 500);
    }

    // Decode base64 image bytes
    const imageBytes = Uint8Array.from(
      atob(imagePart.inlineData.data),
      (char) => char.charCodeAt(0)
    );
    const mimeType: string = imagePart.inlineData.mimeType ?? "image/png";
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
      metadata: { postId, storagePath },
    });

    return new Response(
      JSON.stringify({ success: true, imageUrl: publicUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return handleError(error, functionName);
  }
});

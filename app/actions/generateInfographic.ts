'use server';

import { GoogleGenAI } from '@google/genai';
import { createGeneration, updateGenerationResult, markGenerationFailed } from './generations';
import { getUserCredits } from './credits';
import { uploadInfographic } from './storage';
import { createClient } from '@/lib/supabase/server';

// Infographic generation result type
export interface GenerationResult {
  success: boolean;
  imageBase64?: string;
  imageUrl?: string; // Supabase Storage URL
  mimeType?: string;
  error?: string;
  textResponse?: string;
  generationId?: string;
  creditsRemaining?: number;
}

/**
 * Crafts a detailed system prompt optimized for infographic generation.
 * This prompt guides the AI to produce high-quality, professional infographics.
 * Includes instructions for using Google Search when URLs or data lookups are needed.
 */
function buildInfographicPrompt(userPrompt: string): string {
  return `You are a professional infographic designer and data visualization expert with access to Google Search. Create a stunning, high-quality infographic based on the following request.

## IMPORTANT - Data Research Instructions:
- If the user provides a URL, USE GOOGLE SEARCH to fetch and extract the key information from that webpage
- If the user mentions a topic that requires current data, statistics, or facts, USE GOOGLE SEARCH to find accurate, up-to-date information
- Always verify facts and statistics through search before including them in the infographic
- Include source attribution in the infographic footer when using searched data

## Design Guidelines:
- **Layout**: Use a clean, organized vertical layout with clear visual hierarchy
- **Typography**: Render all text clearly and legibly. Use bold headers, readable body text, and ensure proper text placement
- **Color Scheme**: Use a cohesive, professional color palette with good contrast
- **Data Visualization**: If data/statistics are mentioned or found via search, represent them with charts, icons, or visual elements
- **Icons & Graphics**: Include relevant icons and visual elements to illustrate concepts
- **Branding Elements**: Add subtle decorative elements like shapes, lines, or gradients to enhance visual appeal
- **White Space**: Use adequate spacing between sections for readability

## Content Structure:
1. A prominent, eye-catching title at the top
2. Key points organized into clear sections with headers
3. Visual representations (icons, charts, illustrations) for each main point
4. A clean footer or conclusion section (include data sources if searched)

## Style:
- Modern, professional aesthetic
- Flat design with subtle shadows/depth where appropriate
- Consistent iconography style throughout
- Print-ready quality with crisp edges

## User Request:
${userPrompt}

Generate a complete, visually stunning infographic that clearly communicates the information above. If the request includes URLs or topics requiring research, use Google Search to gather accurate data first. Make sure all text is spelled correctly and rendered clearly.`;
}

/**
 * Generates an infographic using Google Gemini's Nano Banana Pro model.
 * Uses the gemini-3-pro-image-preview model for high-quality image generation
 * with advanced text rendering capabilities.
 * 
 * This function also handles credits deduction and generation tracking.
 */
export async function generateInfographic(
  userPrompt: string,
  aspectRatio: '9:16' | '3:4' | '1:1' | '16:9' = '9:16',
  imageSize: '1K' | '2K' = '2K'
): Promise<GenerationResult> {
  // Validate API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: 'GEMINI_API_KEY environment variable is not set. Please add it to your .env.local file.',
    };
  }

  // Validate user prompt
  if (!userPrompt || userPrompt.trim().length === 0) {
    return {
      success: false,
      error: 'Please provide a description for your infographic.',
    };
  }

  // Check user credits and create generation record
  const credits = await getUserCredits();
  if (!credits || credits.balance < 1) {
    return {
      success: false,
      error: 'Insufficient credits. Please purchase more credits to continue.',
      creditsRemaining: credits?.balance || 0,
    };
  }

  // Create generation record and deduct credits
  const generationResult = await createGeneration(
    userPrompt.trim(),
    aspectRatio,
    imageSize,
    1 // Credits required
  );

  if (!generationResult.success || !generationResult.generationId) {
    return {
      success: false,
      error: generationResult.error || 'Failed to create generation record.',
    };
  }

  const generationId = generationResult.generationId;

  try {
    // Initialize the Gemini client
    const ai = new GoogleGenAI({ apiKey });

    // Build the optimized infographic prompt
    const fullPrompt = buildInfographicPrompt(userPrompt.trim());

    // Configure tools - Google Search for fetching data from URLs and real-time info
    const tools = [
      {
        googleSearch: {},
      },
    ];

    // Call the Gemini 3 Pro Image Preview model (Nano Banana Pro)
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: fullPrompt,
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: imageSize,
        },
        tools,
      },
    });

    // Process the response
    let imageBase64: string | undefined;
    let mimeType: string | undefined;
    let textResponse: string | undefined;

    // Extract image and text from response parts
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          textResponse = part.text;
        } else if (part.inlineData) {
          imageBase64 = part.inlineData.data;
          mimeType = part.inlineData.mimeType || 'image/png';
        }
      }
    }

    // Check if we got an image
    if (!imageBase64) {
      // Mark generation as failed and refund credits
      await markGenerationFailed(generationId, 'AI did not generate an image');
      
      return {
        success: false,
        error: 'The AI did not generate an image. Please try again with a different prompt.',
        textResponse,
        generationId,
      };
    }

    // Get user ID for storage path
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      await markGenerationFailed(generationId, 'User not authenticated');
      return {
        success: false,
        error: 'Authentication error. Please log in again.',
        generationId,
      };
    }

    // Upload image to Supabase Storage
    const uploadResult = await uploadInfographic(
      imageBase64,
      user.id,
      generationId,
      mimeType || 'image/png'
    );

    let imageUrl: string | undefined;
    
    if (uploadResult.success && uploadResult.url) {
      imageUrl = uploadResult.url;
      // Save the generation result with storage URL
      await updateGenerationResult(generationId, imageUrl, textResponse, true);
    } else {
      // Storage upload failed, save base64 as fallback
      console.warn('Storage upload failed, saving base64:', uploadResult.error);
      await updateGenerationResult(generationId, imageBase64, textResponse, false);
    }

    // Get updated credits balance
    const updatedCredits = await getUserCredits();

    return {
      success: true,
      imageBase64,
      imageUrl,
      mimeType,
      textResponse,
      generationId,
      creditsRemaining: updatedCredits?.balance || 0,
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // Handle specific error types
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Mark generation as failed and refund credits
    await markGenerationFailed(generationId, errorMessage);
    
    // Check for common error patterns
    if (errorMessage.includes('API_KEY')) {
      return {
        success: false,
        error: 'Invalid API key. Please check your GEMINI_API_KEY in .env.local',
        generationId,
      };
    }
    
    if (errorMessage.includes('SAFETY') || errorMessage.includes('blocked')) {
      return {
        success: false,
        error: 'The request was blocked by safety filters. Please try a different prompt.',
        generationId,
      };
    }

    if (errorMessage.includes('quota') || errorMessage.includes('rate')) {
      return {
        success: false,
        error: 'API rate limit exceeded. Please wait a moment and try again.',
        generationId,
      };
    }

    return {
      success: false,
      error: `Failed to generate infographic: ${errorMessage}`,
      generationId,
    };
  }
}

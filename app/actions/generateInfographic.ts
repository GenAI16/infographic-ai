'use server';

import { GoogleGenAI } from '@google/genai';

// Infographic generation result type
export interface GenerationResult {
  success: boolean;
  imageBase64?: string;
  mimeType?: string;
  error?: string;
  textResponse?: string;
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
      return {
        success: false,
        error: 'The AI did not generate an image. Please try again with a different prompt.',
        textResponse,
      };
    }

    return {
      success: true,
      imageBase64,
      mimeType,
      textResponse,
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // Handle specific error types
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Check for common error patterns
    if (errorMessage.includes('API_KEY')) {
      return {
        success: false,
        error: 'Invalid API key. Please check your GEMINI_API_KEY in .env.local',
      };
    }
    
    if (errorMessage.includes('SAFETY') || errorMessage.includes('blocked')) {
      return {
        success: false,
        error: 'The request was blocked by safety filters. Please try a different prompt.',
      };
    }

    if (errorMessage.includes('quota') || errorMessage.includes('rate')) {
      return {
        success: false,
        error: 'API rate limit exceeded. Please wait a moment and try again.',
      };
    }

    return {
      success: false,
      error: `Failed to generate infographic: ${errorMessage}`,
    };
  }
}

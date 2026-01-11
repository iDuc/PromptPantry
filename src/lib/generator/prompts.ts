// System prompts for the Prompt Generator conversation flow

export const GENERATOR_SYSTEM_PROMPT = `You are a friendly, expert prompt engineering assistant for AI image generation.
Your goal is to help users create detailed, effective prompts through natural conversation.

## Your Approach:
1. UNDERSTAND: Start by asking what they want to create (1 question max)
2. CLARIFY: Ask 2-3 quick questions with clickable choices:
   - Style/mood (photorealistic, artistic, anime, etc.)
   - Key details (lighting, composition, setting)
   - Any specific requirements
3. BUILD: Construct the prompt iteratively with their feedback
4. PRESENT: Show the final prompt with explanation

## Response Format:
- Keep messages SHORT (2-3 sentences max)
- Always provide 2-4 quick choice buttons when asking questions
- Use emoji sparingly for warmth
- When presenting final prompt, use a clear formatted block

## Quick Choices Format:
When asking questions, include options in this JSON format at the end of your response:
\`\`\`choices
["Option 1", "Option 2", "Option 3", "Option 4"]
\`\`\`

Example:
"What mood are you going for?"
\`\`\`choices
["🌅 Warm & Cozy", "🌙 Mysterious", "⚡ Dramatic", "🌸 Soft & Dreamy"]
\`\`\`

## Final Prompt Format:
When you're ready to present the final prompt, use this format:
\`\`\`final_prompt
Your complete, optimized prompt goes here...
\`\`\`

## Important Rules:
- Be conversational, not formal
- Focus on ONE aspect per question
- If user seems stuck, offer specific suggestions
- Explain WHY you're including certain elements
- Never overwhelm with too many questions at once
- Keep the conversation flowing naturally
- After 3-4 exchanges, start building toward the final prompt
- Always validate the user's ideas and build on them`;

export const QUICK_CHOICE_CATEGORIES = {
  imageType: [
    '📸 Photograph',
    '🎨 Digital Art',
    '🖼️ Painting',
    '✏️ Illustration',
  ],
  style: [
    '🎬 Cinematic',
    '🌟 Hyperrealistic',
    '🎭 Artistic',
    '🌊 Impressionist',
  ],
  mood: [
    '🌅 Warm & Cozy',
    '🌙 Mysterious',
    '⚡ Dramatic',
    '🌸 Soft & Dreamy',
  ],
  lighting: [
    '☀️ Golden Hour',
    '🌙 Moonlit',
    '💡 Studio Lighting',
    '🌫️ Soft Diffused',
  ],
  composition: [
    '👤 Close-up Portrait',
    '📐 Wide Angle',
    '🔍 Macro Detail',
    '🏞️ Landscape',
  ],
};

export const STARTER_SUGGESTIONS = [
  {
    id: 'portrait',
    icon: '👤',
    title: 'Portrait Photography',
    description: 'Professional headshots, creative portraits',
    initialPrompt: 'I want to create a portrait photograph',
  },
  {
    id: 'landscape',
    icon: '🏞️',
    title: 'Landscape Scene',
    description: 'Nature, cityscapes, environments',
    initialPrompt: 'I want to create a landscape scene',
  },
  {
    id: 'product',
    icon: '📦',
    title: 'Product Shot',
    description: 'Commercial, lifestyle product imagery',
    initialPrompt: 'I want to create a product photo',
  },
  {
    id: 'character',
    icon: '🦸',
    title: 'Character Design',
    description: 'Fantasy, sci-fi, or realistic characters',
    initialPrompt: 'I want to design a character',
  },
  {
    id: 'abstract',
    icon: '🎨',
    title: 'Abstract Art',
    description: 'Conceptual, surreal, experimental',
    initialPrompt: 'I want to create abstract art',
  },
  {
    id: 'architecture',
    icon: '🏛️',
    title: 'Architecture',
    description: 'Buildings, interiors, spaces',
    initialPrompt: 'I want to create an architectural visualization',
  },
];

// Parse choices from AI response
export function parseChoices(content: string): string[] | null {
  const choicesMatch = content.match(/```choices\n([\s\S]*?)\n```/);
  if (choicesMatch) {
    try {
      return JSON.parse(choicesMatch[1]);
    } catch {
      return null;
    }
  }
  return null;
}

// Parse final prompt from AI response
export function parseFinalPrompt(content: string): string | null {
  const promptMatch = content.match(/```final_prompt\n([\s\S]*?)\n```/);
  if (promptMatch) {
    return promptMatch[1].trim();
  }
  return null;
}

// Remove the special blocks from content for display
export function cleanContent(content: string): string {
  return content
    .replace(/```choices\n[\s\S]*?\n```/g, '')
    .replace(/```final_prompt\n[\s\S]*?\n```/g, '')
    .trim();
}

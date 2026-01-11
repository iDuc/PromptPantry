/**
 * Midjourney Prompt Parser
 * Extracts parameters and cleans the base prompt from a Midjourney prompt string
 */

export interface MidjourneyParameters {
  version?: string;           // --v 6.1
  aspectRatio?: string;       // --ar 16:9
  chaos?: number;             // --chaos 40
  stylize?: number;           // --stylize 750 or --s 750
  quality?: number;           // --quality 1 or --q 1
  raw?: boolean;              // --raw
  tile?: boolean;             // --tile
  stop?: number;              // --stop 80
  seed?: number;              // --seed 12345
  weird?: number;             // --weird 250 or --w 250
  no?: string;                // --no red, blue (negative prompt)
  styleRefs?: string[];       // --sref urls
  characterRefs?: string[];   // --cref urls
  imageRefs?: string[];       // Image URLs at start of prompt
  niji?: string;              // --niji 6
  style?: string;             // --style raw, cute, etc.
  personalize?: string;       // --p or --personalize
  repeat?: number;            // --repeat 4 or --r 4
}

export interface ParsedMidjourneyPrompt {
  cleanPrompt: string;
  parameters: MidjourneyParameters;
  rawParameters: Record<string, string | number | boolean>;
}

/**
 * Parse a Midjourney prompt and extract all parameters
 */
export function parseMidjourneyPrompt(input: string): ParsedMidjourneyPrompt {
  let prompt = input.trim();
  const parameters: MidjourneyParameters = {};
  const rawParameters: Record<string, string | number | boolean> = {};

  // Extract image URLs at the start (before any text)
  const imageUrlPattern = /^((?:https?:\/\/[^\s]+\s*)+)/;
  const imageMatch = prompt.match(imageUrlPattern);
  if (imageMatch) {
    const urls = imageMatch[1].trim().split(/\s+/).filter(url =>
      url.startsWith('http') && !url.includes('--')
    );
    if (urls.length > 0) {
      parameters.imageRefs = urls;
      prompt = prompt.slice(imageMatch[0].length).trim();
    }
  }

  // Extract --sref (style reference) URLs
  const srefPattern = /--sref\s+((?:https?:\/\/[^\s]+\s*)+)/gi;
  let srefMatch;
  while ((srefMatch = srefPattern.exec(prompt)) !== null) {
    const urls = srefMatch[1].trim().split(/\s+/).filter(url =>
      url.startsWith('http')
    );
    parameters.styleRefs = [...(parameters.styleRefs || []), ...urls];
    rawParameters['sref'] = urls.join(' ');
  }
  prompt = prompt.replace(srefPattern, '').trim();

  // Extract --cref (character reference) URLs
  const crefPattern = /--cref\s+((?:https?:\/\/[^\s]+\s*)+)/gi;
  let crefMatch;
  while ((crefMatch = crefPattern.exec(prompt)) !== null) {
    const urls = crefMatch[1].trim().split(/\s+/).filter(url =>
      url.startsWith('http')
    );
    parameters.characterRefs = [...(parameters.characterRefs || []), ...urls];
    rawParameters['cref'] = urls.join(' ');
  }
  prompt = prompt.replace(crefPattern, '').trim();

  // Extract numeric parameters
  const numericParams: Array<{
    pattern: RegExp;
    key: keyof MidjourneyParameters;
    rawKey: string;
  }> = [
    { pattern: /--v\s+([\d.]+)/i, key: 'version', rawKey: 'v' },
    { pattern: /--chaos\s+(\d+)/i, key: 'chaos', rawKey: 'chaos' },
    { pattern: /--(?:stylize|s)\s+(\d+)/i, key: 'stylize', rawKey: 'stylize' },
    { pattern: /--(?:quality|q)\s+([\d.]+)/i, key: 'quality', rawKey: 'quality' },
    { pattern: /--stop\s+(\d+)/i, key: 'stop', rawKey: 'stop' },
    { pattern: /--seed\s+(\d+)/i, key: 'seed', rawKey: 'seed' },
    { pattern: /--(?:weird|w)\s+(\d+)/i, key: 'weird', rawKey: 'weird' },
    { pattern: /--(?:repeat|r)\s+(\d+)/i, key: 'repeat', rawKey: 'repeat' },
    { pattern: /--niji\s+([\d.]+)/i, key: 'niji', rawKey: 'niji' },
  ];

  for (const { pattern, key, rawKey } of numericParams) {
    const match = prompt.match(pattern);
    if (match) {
      const value = match[1];
      if (key === 'version' || key === 'niji') {
        (parameters as Record<string, unknown>)[key] = value;
      } else {
        (parameters as Record<string, unknown>)[key] = parseFloat(value);
      }
      rawParameters[rawKey] = value;
      prompt = prompt.replace(pattern, '').trim();
    }
  }

  // Extract aspect ratio
  const arMatch = prompt.match(/--ar\s+([\d:]+)/i);
  if (arMatch) {
    parameters.aspectRatio = arMatch[1];
    rawParameters['ar'] = arMatch[1];
    prompt = prompt.replace(/--ar\s+[\d:]+/i, '').trim();
  }

  // Extract boolean parameters
  const booleanParams: Array<{
    pattern: RegExp;
    key: keyof MidjourneyParameters;
    rawKey: string;
  }> = [
    { pattern: /--raw\b/i, key: 'raw', rawKey: 'raw' },
    { pattern: /--tile\b/i, key: 'tile', rawKey: 'tile' },
  ];

  for (const { pattern, key, rawKey } of booleanParams) {
    if (pattern.test(prompt)) {
      (parameters as Record<string, unknown>)[key] = true;
      rawParameters[rawKey] = true;
      prompt = prompt.replace(pattern, '').trim();
    }
  }

  // Extract --style
  const styleMatch = prompt.match(/--style\s+(\w+)/i);
  if (styleMatch) {
    parameters.style = styleMatch[1];
    rawParameters['style'] = styleMatch[1];
    prompt = prompt.replace(/--style\s+\w+/i, '').trim();
  }

  // Extract --no (negative prompt)
  const noMatch = prompt.match(/--no\s+([^-]+?)(?=\s+--|$)/i);
  if (noMatch) {
    parameters.no = noMatch[1].trim();
    rawParameters['no'] = noMatch[1].trim();
    prompt = prompt.replace(/--no\s+[^-]+?(?=\s+--|$)/i, '').trim();
  }

  // Extract --p or --personalize
  const personalizeMatch = prompt.match(/--(?:personalize|p)\s*(\w*)/i);
  if (personalizeMatch) {
    parameters.personalize = personalizeMatch[1] || 'default';
    rawParameters['personalize'] = parameters.personalize;
    prompt = prompt.replace(/--(?:personalize|p)\s*\w*/i, '').trim();
  }

  // Clean up any remaining standalone URLs in the prompt that might be srefs
  const remainingUrls = prompt.match(/https?:\/\/s\.mj\.run\/[^\s]+/g);
  if (remainingUrls) {
    parameters.styleRefs = [...(parameters.styleRefs || []), ...remainingUrls];
    for (const url of remainingUrls) {
      prompt = prompt.replace(url, '').trim();
    }
  }

  // Clean up extra whitespace
  prompt = prompt.replace(/\s+/g, ' ').trim();

  return {
    cleanPrompt: prompt,
    parameters,
    rawParameters,
  };
}

/**
 * Format parameters back to Midjourney command format
 */
export function formatMidjourneyParameters(params: MidjourneyParameters): string {
  const parts: string[] = [];

  if (params.version) parts.push(`--v ${params.version}`);
  if (params.niji) parts.push(`--niji ${params.niji}`);
  if (params.aspectRatio) parts.push(`--ar ${params.aspectRatio}`);
  if (params.chaos !== undefined) parts.push(`--chaos ${params.chaos}`);
  if (params.stylize !== undefined) parts.push(`--stylize ${params.stylize}`);
  if (params.quality !== undefined) parts.push(`--quality ${params.quality}`);
  if (params.weird !== undefined) parts.push(`--weird ${params.weird}`);
  if (params.stop !== undefined) parts.push(`--stop ${params.stop}`);
  if (params.seed !== undefined) parts.push(`--seed ${params.seed}`);
  if (params.repeat !== undefined) parts.push(`--repeat ${params.repeat}`);
  if (params.raw) parts.push('--raw');
  if (params.tile) parts.push('--tile');
  if (params.style) parts.push(`--style ${params.style}`);
  if (params.no) parts.push(`--no ${params.no}`);
  if (params.personalize) parts.push(`--personalize ${params.personalize}`);
  if (params.styleRefs?.length) {
    parts.push(`--sref ${params.styleRefs.join(' ')}`);
  }
  if (params.characterRefs?.length) {
    parts.push(`--cref ${params.characterRefs.join(' ')}`);
  }

  return parts.join(' ');
}

/**
 * Detect if a prompt looks like it came from Midjourney
 */
export function detectMidjourneyPrompt(input: string): boolean {
  const mjIndicators = [
    /--v\s+[\d.]+/i,
    /--ar\s+[\d:]+/i,
    /--chaos\s+\d+/i,
    /--stylize\s+\d+/i,
    /--s\s+\d+/i,
    /--sref\s+/i,
    /--cref\s+/i,
    /--niji/i,
    /--raw\b/i,
    /--tile\b/i,
    /https?:\/\/s\.mj\.run\//i,
  ];

  return mjIndicators.some(pattern => pattern.test(input));
}

import { SmartConstraintResult, FacilityCategory, AccessCondition } from '../types';

/**
 * Deterministic local NLP fallback engine when offline or server unreachable.
 * Mirrors Gemini structured output schema.
 */
export function parseNaturalLanguageQueryLocally(query: string): SmartConstraintResult {
  const lower = query.toLowerCase().trim();
  const categories: FacilityCategory[] = [];
  const accessAllowed: AccessCondition[] = ['public', 'customers_only', 'permission_required'];

  // Category detection
  if (lower.includes('water') || lower.includes('drink') || lower.includes('tap') || lower.includes('refill') || lower.includes('thirsty') || lower.includes('bottle')) {
    categories.push('water');
  }
  if (lower.includes('toilet') || lower.includes('restroom') || lower.includes('washroom') || lower.includes('loo') || lower.includes('bathroom') || lower.includes('urinal')) {
    categories.push('toilets');
  }
  if (lower.includes('shade') || lower.includes('rest') || lower.includes('sit') || lower.includes('bench') || lower.includes('break') || lower.includes('cool down') || lower.includes('sun')) {
    if (lower.includes('shade') || lower.includes('sun')) {
      categories.push('shade');
    } else {
      categories.push('break');
    }
  }
  if (lower.includes('charge') || lower.includes('charging') || lower.includes('plug') || lower.includes('socket') || lower.includes('battery') || lower.includes('phone dying') || lower.includes('power')) {
    categories.push('charging');
  }

  // If no category explicitly matched, default to 'all'
  if (categories.length === 0) {
    categories.push('all');
  }

  // Access restrictions check
  // E.g. "open to non-customers", "free", "public only", "don't want to buy anything"
  if (
    lower.includes('non-customer') ||
    lower.includes('non customer') ||
    lower.includes('public only') ||
    lower.includes('free') ||
    lower.includes('without buying') ||
    lower.includes('no purchase')
  ) {
    // Exclude customers_only
    const filtered = accessAllowed.filter(a => a !== 'customers_only');
    accessAllowed.length = 0;
    accessAllowed.push(...filtered);
  }

  // Walking time / distance constraints
  let maxWalkMinutes: number | undefined = undefined;
  const minMatch = lower.match(/(\d+)\s*(min|minute|mins)/);
  if (minMatch) {
    maxWalkMinutes = parseInt(minMatch[1], 10);
  } else if (lower.includes('short walk') || lower.includes('quick walk') || lower.includes('near me') || lower.includes('nearby') || lower.includes('urgent') || lower.includes('now')) {
    maxWalkMinutes = 8;
  }

  // Time sensitivity
  let timeSensitivity: 'immediate' | 'soon' | 'planned' = 'immediate';
  if (lower.includes('later') || lower.includes('route') || lower.includes('planned')) {
    timeSensitivity = 'soon';
  }

  // Disambiguation for multi-category requests
  let clarificationPrompt = undefined;
  if (categories.length >= 2) {
    clarificationPrompt = {
      question: `You asked for ${categories.join(' and ')}. Find one place with all?`,
      optionA: {
        label: 'Yes, all in one place',
        patch: { singleStopRequired: true }
      },
      optionB: {
        label: 'Either is fine',
        patch: { singleStopRequired: false }
      }
    };
  }

  // Generate grounded explanation
  const categoryNames = categories.includes('all') ? 'essential facilities' : categories.join(' & ');
  const accessStr = accessAllowed.includes('customers_only') 
    ? 'public and customer-accessible' 
    : 'strictly public & permission-free';
  const walkStr = maxWalkMinutes ? `within ${maxWalkMinutes} min walk` : 'nearby';

  const explanation = `Showing verified ${categoryNames} ${walkStr} (${accessStr}). Ranked by confirmed reliability.`;

  return {
    categories,
    maxWalkMinutes,
    accessConditionsAllowed: accessAllowed,
    singleStopRequired: categories.length > 1,
    timeSensitivity,
    detectedIntent: `Find ${categoryNames} ${walkStr}`,
    explanation,
    clarificationPrompt
  };
}

/**
 * Main parse request handler: attempts server-side Gemini AI orchestration,
 * with graceful local fallback.
 */
export async function parseNaturalLanguageQuery(query: string): Promise<SmartConstraintResult> {
  if (!query || query.trim().length === 0) {
    return {
      categories: ['all'],
      accessConditionsAllowed: ['public', 'customers_only', 'permission_required'],
      singleStopRequired: false,
      timeSensitivity: 'immediate',
      detectedIntent: 'All nearby essential facilities',
      explanation: 'Showing all nearby facilities ranked by verified availability.'
    };
  }

  try {
    const response = await fetch('/api/ai/parse-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      // Short timeout to guarantee fast outdoor performance
      signal: AbortSignal.timeout(2500)
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.categories) {
        return data as SmartConstraintResult;
      }
    }
  } catch (err) {
    // Graceful offline fallback
    console.debug('Using local NLP intent parser (offline or server standby):', err);
  }

  return parseNaturalLanguageQueryLocally(query);
}

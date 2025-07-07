// $lib/utils/fuzzySearch.ts
interface FuzzySearchOptions {
  threshold?: number;
  keys?: string[];
  includeScore?: boolean;
  shouldSort?: boolean;
  tokenize?: boolean;
  minMatchCharLength?: number;
}

interface FuzzySearchResult {
  item: any;
  score: number;
}

export class FuzzySearch {
  private items: any[];
  private options: FuzzySearchOptions;

  constructor(items: any[], options: FuzzySearchOptions = {}) {
    this.items = items;
    this.options = {
      threshold: 0.6,
      keys: [],
      includeScore: false,
      shouldSort: true,
      tokenize: true,
      minMatchCharLength: 2,
      ...options
    };
  }

  search(query: string): FuzzySearchResult[] {
    if (!query.trim()) return [];

    const results: FuzzySearchResult[] = [];
    const searchTerms = this.options.tokenize 
      ? query.toLowerCase().split(/\s+/).filter(term => term.length >= (this.options.minMatchCharLength || 1))
      : [query.toLowerCase()];

    for (const item of this.items) {
      const score = this.calculateScore(item, searchTerms);
      if (score >= (this.options.threshold || 0.6)) {
        results.push({ item, score });
      }
    }

    if (this.options.shouldSort) {
      results.sort((a, b) => b.score - a.score);
    }

    return results;
  }

  private calculateScore(item: any, searchTerms: string[]): number {
    let maxScore = 0;
    const keys = this.options.keys || [];

    // If no keys specified, search in all string properties
    if (keys.length === 0) {
      const text = this.extractAllText(item).toLowerCase();
      maxScore = this.scoreText(text, searchTerms);
    } else {
      // Search in specified keys
      for (const key of keys) {
        const text = this.getNestedValue(item, key);
        if (text) {
          const score = this.scoreText(text.toLowerCase(), searchTerms);
          maxScore = Math.max(maxScore, score);
        }
      }
    }

    return maxScore;
  }

  private scoreText(text: string, searchTerms: string[]): number {
    let totalScore = 0;
    let matchedTerms = 0;

    for (const term of searchTerms) {
      const score = this.scoreTerm(text, term);
      if (score > 0) {
        totalScore += score;
        matchedTerms++;
      }
    }

    // Return average score weighted by matched terms ratio
    return matchedTerms > 0 ? (totalScore / searchTerms.length) * (matchedTerms / searchTerms.length) : 0;
  }

  private scoreTerm(text: string, term: string): number {
    // Exact match
    if (text === term) return 1.0;
    
    // Starts with
    if (text.startsWith(term)) return 0.9;
    
    // Contains
    if (text.includes(term)) return 0.8;
    
    // Fuzzy match (simple character-based)
    const fuzzyScore = this.fuzzyMatch(text, term);
    return fuzzyScore > 0.7 ? fuzzyScore * 0.7 : 0;
  }

  private fuzzyMatch(text: string, term: string): number {
    const textLen = text.length;
    const termLen = term.length;
    
    if (termLen > textLen) return 0;
    
    let matches = 0;
    let textIndex = 0;
    
    for (let i = 0; i < termLen; i++) {
      const char = term[i];
      let found = false;
      
      for (let j = textIndex; j < textLen; j++) {
        if (text[j] === char) {
          matches++;
          textIndex = j + 1;
          found = true;
          break;
        }
      }
      
      if (!found) break;
    }
    
    return matches / termLen;
  }

  private getNestedValue(obj: any, path: string): string | null {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return null;
      }
    }
    
    return current ? String(current) : null;
  }

  private extractAllText(obj: any): string {
    const texts: string[] = [];
    
    const extract = (value: any) => {
      if (typeof value === 'string') {
        texts.push(value);
      } else if (Array.isArray(value)) {
        value.forEach(extract);
      } else if (value && typeof value === 'object') {
        Object.values(value).forEach(extract);
      }
    };
    
    extract(obj);
    return texts.join(' ');
  }
}

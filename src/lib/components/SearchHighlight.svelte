<!-- $lib/components/SearchHighlight.svelte -->
<script lang="ts">
  interface Props {
    text: string;
    searchQuery: string;
    className?: string;
  }

  let { text, searchQuery, className = '' }: Props = $props();

  function highlightText(text: string, query: string): string {
    if (!query.trim()) return text;
    
    const tokens = query.trim().split(/\s+/);
    let highlightedText = text;
    
    tokens.forEach(token => {
      if (token.length >= 2) {
        const regex = new RegExp(`(${escapeRegExp(token)})`, 'gi');
        highlightedText = highlightedText.replace(regex, '<mark class="search-highlight">$1</mark>');
      }
    });
    
    return highlightedText;
  }

  function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  let highlightedText = $derived(highlightText(text, searchQuery));
</script>

<span class={className}>
  {@html highlightedText}
</span>

<style>
  :global(.search-highlight) {
    background-color: #fff3cd;
    color: #856404;
    padding: 0.1rem 0.2rem;
    border-radius: 2px;
    font-weight: 600;
  }
</style>

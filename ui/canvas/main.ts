import { mount } from 'svelte';
import PraxisCanvas from './components/PraxisCanvas.svelte';

// Fetch schema from the API server (which is proxied by Vite)
async function init() {
  try {
    const response = await fetch('/api/schema');
    const schema = await response.json();

    mount(PraxisCanvas, {
      target: document.getElementById('app')!,
      props: {
        schema: schema,
        theme: 'dark',
      },
    });
  } catch (error) {
    console.error('Failed to load schema:', error);
    document.getElementById('app')!.innerHTML =
      `<div style="color: red; padding: 20px;">Failed to load schema: ${error}</div>`;
  }
}

init();

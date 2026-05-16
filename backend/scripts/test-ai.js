import { generateText } from '../src/lib/aiClient.js';

async function main() {
  try {
    const prompt = process.argv.slice(2).join(' ') || 'Say hello in one sentence.';
    console.log('Prompt:', prompt);
    const out = await generateText(prompt, { max_tokens: 100, temperature: 0.2 });
    console.log('=== AI Response ===');
    console.log(out);
  } catch (err) {
    console.error('AI test failed:', err?.message || err);
    process.exitCode = 2;
  }
}

main();

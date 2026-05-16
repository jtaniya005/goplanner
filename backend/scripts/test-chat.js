import 'dotenv/config';
import { generateChatViaRouter } from '../src/lib/aiClient.js';

async function main() {
  try {
    const model = 'moonshotai/Kimi-K2-Instruct-0905';
    const messages = [
      { role: 'user', content: 'List 10 tourist places in Delhi.' }
    ];
    console.log('Calling model:', model);
    const out = await generateChatViaRouter(model, messages);
    console.log('=== CHAT OUTPUT ===');
    console.log(out);
  } catch (err) {
    console.error('Chat test failed:', err?.message || err);
    process.exitCode = 2;
  }
}

main();

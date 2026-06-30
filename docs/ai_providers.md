# Pluggable AI Provider Layer

The **AI Provider Layer** defines pluggable LLM integrations, allowing users to configure QAMate to utilize Google Gemini, OpenAI GPT, Anthropic Claude, or local Ollama servers.

---

## 1. Provider Independence Philosophy

To keep QAMate highly performant and decoupled from vendor-specific packages, the `@qamate/engine` does not import SDK wrappers (such as `@google/generative-ai` or `openai`). 

Instead, it interacts with AI completion endpoints using the native Node.js **`fetch`** client. This ensures the engine remains lightweight, portable, and easily testable without introducing dependency conflicts.

---

## 2. Supported Providers & Payload Formats

### Google Gemini Provider (`gemini`)
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/{modelName}:generateContent?key={apiKey}`
- **Payload Shape**:
  ```json
  {
    "systemInstruction": {
      "parts": [{ "text": "system prompt" }]
    },
    "contents": [
      {
        "parts": [{ "text": "user prompt" }]
      }
    ],
    "generationConfig": {
      "temperature": 0.7,
      "responseMimeType": "text/plain"
    }
  }
  ```

### OpenAI Provider (`openai`)
- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **Headers**: `Authorization: Bearer {apiKey}`
- **Payload Shape**:
  ```json
  {
    "model": "gpt-4o",
    "messages": [
      { "role": "system", "content": "system prompt" },
      { "role": "user", "content": "user prompt" }
    ],
    "temperature": 0.7
  }
  ```

### Anthropic Claude Provider (`claude`)
- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **Headers**: `x-api-key: {apiKey}`, `anthropic-version: 2023-06-01`
- **Payload Shape**:
  ```json
  {
    "model": "claude-3-5-sonnet-20240620",
    "messages": [{ "role": "user", "content": "user prompt" }],
    "system": "system prompt",
    "temperature": 0.7,
    "max_tokens": 4096
  }
  ```

### Ollama Local Provider (`ollama`)
- **Endpoint**: `{apiEndpoint}/api/chat` (Defaults to `http://localhost:11434/api/chat`)
- **Payload Shape**:
  ```json
  {
    "model": "llama3",
    "messages": [
      { "role": "system", "content": "system prompt" },
      { "role": "user", "content": "user prompt" }
    ],
    "options": {
      "temperature": 0.7
    },
    "stream": false
  }
  ```

---

## 3. Resolving Providers via `LLMProviderFactory`

Instantiate providers dynamically using the factory:

```typescript
import { LLMProviderFactory } from './providers/index.js';

const activeProvider = LLMProviderFactory.createProvider({
  providerId: 'gemini',
  apiKey: process.env.GEMINI_API_KEY,
  modelName: 'gemini-1.5-pro',
});

const response = await activeProvider.generate("Verify storage permissions access");
```
If API keys or parameters are missing, the factory raises explicit validation errors before initiating any HTTP connections.

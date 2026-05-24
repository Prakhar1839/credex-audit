# PROMPTS.md

## AI Summary Prompt

**Location:** `lib/ai-summary.ts`, `generateAiSummary()`
**Model:** `claude-haiku-4-5` (fast, cheap, sufficient for a paragraph)
**Max tokens:** 200

### The prompt

```
You are writing a concise, direct audit summary for a startup founder or engineering manager.
No fluff, no AI-assistant voice. Sound like a sharp CFO advisor.

Audit data:
- Team size: {teamSize}
- Primary use case: {primaryUseCase}
- Tools: {toolList}
- {savingsLine}
- Key findings: {topFindings}

Write exactly one paragraph (90–110 words) that:
1. Opens with the most important finding or an honest "you're spending well"
2. Names 1–2 specific tools and explains why (use numbers)
3. Ends with a concrete next step

Do not use bullet points. Do not start with "Based on". Do not use em-dashes excessively. Be direct and specific.
```

### Why I wrote it this way

**Persona instruction first ("sharp CFO advisor"):** Without a strong persona, Haiku defaults to an assistant-voice that says "Great news!" and "Based on the information provided." The CFO framing suppresses this and encourages the specific, numbered language finance people use.

**Explicit don'ts:** "Do not start with Based on" and "Do not use em-dashes excessively" directly address the most common failure modes I observed in testing. Positive constraints alone weren't enough.

**Word count constraint:** "90–110 words" rather than "~100 words" because an approximation gives the model permission to write 150 words. Hard bounds get honored better.

**Numbers in context:** I inject the actual tool names, spend figures, and savings calculations into the prompt. The model doesn't need to do math — it needs to write. Keeping reasoning outside the model (in the audit engine) means the narrative is accurate even if the model paraphrases loosely.

### What I tried that didn't work

**System prompt only:** Putting the persona in a `system` message and the data in the user turn produced worse output on Haiku — the model seemed to weight the user turn's implicit tone over the system prompt persona. Consolidating into one user message worked better.

**Asking for bullet points:** An early version asked for "3 bullet points." The output was generic and didn't sound like a human advisor. The paragraph format forces cohesive reasoning.

**Longer max_tokens:** At 400 tokens, the model would write a meandering essay. 200 tokens forces concision.

### Fallback

If the Anthropic API fails (network error, 429, 500), or `ANTHROPIC_API_KEY` is not set, `generateFallbackSummary()` builds a template-based paragraph from the same audit data. It's not as polished but it's always accurate. The API failure is logged to the server console.

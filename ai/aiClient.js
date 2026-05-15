const { OpenAI } = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const School = require('../models/schoolModel');

let _openai = null;
let _anthropic = null;

const getOpenAIClient = () => {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
};

const getAnthropicClient = () => {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const callOpenAI = async (systemPrompt, userPrompt, options = {}) => {
  const client = getOpenAIClient();
  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: userPrompt });

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await client.chat.completions.create({
        model: options.model || 'gpt-4o',
        messages,
        max_tokens: options.maxTokens || 2048,
        temperature: options.temperature || 0.7,
      });
      return { text: res.choices[0].message.content, tokens: res.usage?.total_tokens || 0, provider: 'openai' };
    } catch (err) {
      if (err.status === 429 && attempt < 3) {
        await sleep(1000 * Math.pow(2, attempt - 1));
        continue;
      }
      throw err;
    }
  }
};

const callAnthropic = async (systemPrompt, userPrompt, options = {}) => {
  const client = getAnthropicClient();
  const systemContent = systemPrompt
    ? [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }]
    : undefined;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await client.messages.create({
        model: options.model || 'claude-sonnet-4-6',
        max_tokens: options.maxTokens || 2048,
        system: systemContent,
        messages: [{ role: 'user', content: userPrompt }],
      });
      return {
        text: res.content[0].text,
        tokens: (res.usage?.input_tokens || 0) + (res.usage?.output_tokens || 0),
        provider: 'anthropic',
      };
    } catch (err) {
      if (err.status === 429 && attempt < 3) {
        await sleep(1000 * Math.pow(2, attempt - 1));
        continue;
      }
      throw err;
    }
  }
};

const callAI = async (userPrompt, options = {}) => {
  return callAIWithSystem(null, userPrompt, options);
};

const callAIWithSystem = async (systemPrompt, userPrompt, options = {}) => {
  try {
    return await callOpenAI(systemPrompt, userPrompt, options);
  } catch (openaiErr) {
    console.warn('[AIClient] OpenAI failed, falling back to Anthropic:', openaiErr.message);
    try {
      return await callAnthropic(systemPrompt, userPrompt, options);
    } catch (anthropicErr) {
      console.error('[AIClient] Both providers failed:', anthropicErr.message);
      throw new Error('AI_UNAVAILABLE');
    }
  }
};

const callAIStructured = async (systemPrompt, userPrompt, options = {}) => {
  const jsonInstruction = '\n\nIMPORTANT: Return ONLY valid JSON. No markdown, no code fences, no explanation — raw JSON only.';
  const result = await callAIWithSystem(systemPrompt, userPrompt + jsonInstruction, options);

  try {
    const cleaned = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return { data: JSON.parse(cleaned), tokens: result.tokens, provider: result.provider };
  } catch {
    // retry with more explicit instruction
    const retryPrompt = userPrompt + '\n\nYou MUST return ONLY a raw JSON object or array. No text before or after. No markdown. Just JSON.';
    const retryResult = await callAIWithSystem(systemPrompt, retryPrompt, options);
    const cleaned = retryResult.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return { data: JSON.parse(cleaned), tokens: retryResult.tokens, provider: retryResult.provider };
  }
};

const trackTokenUsage = async (schoolId, tokens) => {
  if (!schoolId || !tokens) return;
  try {
    await School.findByIdAndUpdate(schoolId, { $inc: { 'subscription.usedAiTokens': tokens } });
  } catch (err) {
    console.warn('[AIClient] Token tracking failed:', err.message);
  }
};

const checkTokenBudget = (school) => {
  if (!school?.subscription) return true;
  const { aiTokenBudget = 100000, usedAiTokens = 0 } = school.subscription;
  return usedAiTokens < aiTokenBudget;
};

module.exports = {
  callAI,
  callAIWithSystem,
  callAIStructured,
  trackTokenUsage,
  checkTokenBudget,
  getOpenAIClient,
  getAnthropicClient,
};

export async function callGroq(apiKey, systemPrompt, userPrompt) {
  const model = process.env.GROQ_MODEL?.trim() || 'llama-3.3-70b-versatile';

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 1200,
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(`groq quota exceeded (model ${model}): add credits/billing and retry`);
    }
    throw new Error(`groq model ${model} error ${response.status}: ${responseText}`);
  }

  const parsed = JSON.parse(responseText);
  const content = parsed?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error(`empty groq response for model ${model}`);
  }

  return content;
}

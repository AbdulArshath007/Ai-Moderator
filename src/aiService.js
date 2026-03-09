const { Groq } = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

/**
 * Evaluates a message against moderation boundaries.
 * Returns { status: 'pass'|'fail', reason: string, severity: 'low'|'high' }
 * - severity 'high' = hate speech / harassment (counts toward flagging)
 * - severity 'low' = minor rule break (just blocked, no violation count)
 */
async function evaluateMessage(message, genericBoundaries, topicBoundaries) {
    const genericStr = genericBoundaries.map(b => `- ${b}`).join('\n');
    const topicStr = topicBoundaries.length > 0 ? topicBoundaries.map(b => `- ${b}`).join('\n') : "None";

    const systemPrompt = `You are a RELAXED but fair Chat Moderator AI for a learning community.

IMPORTANT GUIDELINES:
- You should be PERMISSIVE. Allow general conversation, greetings, jokes, casual chat, and off-topic messages.
- ONLY block messages that are CLEARLY harmful: hate speech, harassment, bullying, slurs, threats, sexual content, or extreme spam (same message repeated 5+ times).
- General off-topic conversation is FINE. Students should be able to say "hi", "lol", "what's up", "yessaw", etc.
- Do NOT block messages just because they aren't about the topic. Only block if the message is actively harmful.

GENERIC BOUNDARIES (Block only if clearly violated):
${genericStr}

TOPIC CONTEXT (For reference only — do NOT enforce strictly):
${topicStr}

Respond ONLY in strict JSON format:
{
  "status": "pass" | "fail",
  "reason": "If fail, provide a brief, polite 1-sentence explanation. If pass, leave empty.",
  "severity": "low" | "high"
}

SEVERITY RULES:
- "high" = hate speech, slurs, harassment, threats, bullying (counts toward user flagging)
- "low" = minor issues like extreme spam (does NOT count toward flagging)

When in doubt, PASS the message. Only block what is clearly harmful.`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.1,
            response_format: { type: 'json_object' }
        });

        const resultStr = completion.choices[0]?.message?.content;
        const result = JSON.parse(resultStr);

        // Fallback if AI messes up the format
        if (result.status !== 'pass' && result.status !== 'fail') {
            result.status = 'pass'; // Default to pass (permissive)
            result.reason = '';
        }

        if (!result.severity) {
            result.severity = 'low';
        }

        return result;

    } catch (error) {
        console.error("AI Moderation Error:", error);
        return {
            status: "pass", // Fail-open: allow message if AI is down
            reason: "",
            severity: "low"
        };
    }
}

module.exports = {
    evaluateMessage
};

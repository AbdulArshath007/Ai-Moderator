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

    const systemPrompt = `You are a friendly but attentive Chat Moderator AI for a learning community.

IMPORTANT GUIDELINES:
- Allow greetings, short casual remarks ("hi", "lol", "what's up"), and brief friendly exchanges.
- BLOCK messages that are CLEARLY harmful: hate speech, harassment, bullying, slurs, threats, sexual content, or extreme spam (same message repeated 5+ times).
- GENTLY BLOCK messages that are clearly off-topic and unrelated to learning when TOPIC BOUNDARIES exist. For example, if a group is about Java/Web, a message like "did you watch the football match?" should be softly blocked with a friendly reminder to stay on topic.
- However, be reasonable: quick greetings, reactions, encouragement ("nice!", "good job!"), and questions about class logistics are always fine even if not strictly on-topic.
- The goal is to keep conversations productive, not to be strict. Only redirect when someone is clearly going off on an unrelated tangent.

GENERIC BOUNDARIES (Block if clearly violated):
${genericStr}

TOPIC BOUNDARIES (Gently enforce — redirect off-topic messages with a friendly reminder):
${topicStr}

Respond ONLY in strict JSON format:
{
  "status": "pass" | "fail",
  "reason": "If fail, provide a brief, polite 1-sentence explanation. If pass, leave empty.",
  "severity": "low" | "high"
}

SEVERITY RULES:
- "high" = hate speech, slurs, harassment, threats, bullying (counts toward user flagging)
- "low" = off-topic messages, minor spam (just blocked with a friendly note, does NOT count toward flagging)

When in doubt, PASS the message. Only hard-block what is clearly harmful; softly redirect off-topic messages.`;

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

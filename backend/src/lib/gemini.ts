import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface RiskInput {
    domain: string;
    spf: boolean;
    dkim: boolean;
    dmarc: boolean;
    ipScore: number;
    bounceRate?: number;
    sendVolume?: number;
    systemState?: string;
}

export interface RiskOutput {
    risk: 'SAFE' | 'CAUTION' | 'HIGH_RISK';
    score: number;
    recommended_daily_limit: number;
    action: 'PROCEED' | 'SLOW_DOWN' | 'PAUSE';
    reason: string;
    isOverridden?: boolean;
}

export async function analyzeRisk(input: RiskInput): Promise<RiskOutput> {
    // 1. Mandatory Safety Overrides (Non-negotiable)
    if (!input.spf || !input.dkim || !input.dmarc) {
        return {
            risk: 'HIGH_RISK',
            score: 0,
            recommended_daily_limit: 0,
            action: 'PAUSE',
            reason: `CRITICAL: Domain authentication failed (SPF: ${input.spf}, DKIM: ${input.dkim}, DMARC: ${input.dmarc}). Automatic system override applied.`,
            isOverridden: true
        };
    }

    const prompt = `
    SYSTEM ROLE:
    You are a deliverability intelligence engine for email infrastructure. Your job is to evaluate SMTP and domain health data and produce safe sending recommendations. You do not control sending—only evaluate risk.

    INPUT CONTEXT:
    Analyze the following email deliverability data for domain: ${input.domain}
    - SPF: ${input.spf ? 'PASS' : 'FAIL'}
    - DKIM: ${input.dkim ? 'PASS' : 'FAIL'}
    - DMARC: ${input.dmarc ? 'PASS' : 'FAIL'}
    - IP Reputation Score: ${input.ipScore}/100
    - Bounce Rate: ${input.bounceRate || 0}%
    - Daily Send Volume: ${input.sendVolume || 0}
    - System State: ${input.systemState || 'NEW'}

    REQUIRED OUTPUT FORMAT (STRICT JSON ONLY):
    {
      "risk": "SAFE | CAUTION | HIGH_RISK",
      "score": 0-100,
      "recommended_daily_limit": number,
      "action": "PROCEED | SLOW_DOWN | PAUSE",
      "reason": "short explanation of decision"
    }

    Return ONLY valid JSON. Be conservative under uncertainty.
    `;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Find JSON block if AI included markdown
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found in AI response");
        
        const aiDecision: RiskOutput = JSON.parse(jsonMatch[0]);

        // 2. Output Validation Layer
        if (!['SAFE', 'CAUTION', 'HIGH_RISK'].includes(aiDecision.risk)) aiDecision.risk = 'CAUTION';
        if (typeof aiDecision.score !== 'number') aiDecision.score = 50;
        if (typeof aiDecision.recommended_daily_limit !== 'number') aiDecision.recommended_daily_limit = 0;
        if (!['PROCEED', 'SLOW_DOWN', 'PAUSE'].includes(aiDecision.action)) aiDecision.action = 'PAUSE';
        
        // Safety cap for recommended limit
        if (aiDecision.recommended_daily_limit > 1000) aiDecision.recommended_daily_limit = 1000;

        return { ...aiDecision, isOverridden: false };

    } catch (error) {
        console.error("Gemini analysis failed, falling back to rules:", error);
        return {
            risk: 'CAUTION',
            score: 40,
            recommended_daily_limit: 5,
            action: 'SLOW_DOWN',
            reason: "AI engine unavailable. Applied conservative fallback rules.",
            isOverridden: true
        };
    }
}

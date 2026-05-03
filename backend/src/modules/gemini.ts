import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface RiskEvaluation {
    risk: 'SAFE' | 'CAUTION' | 'HIGH_RISK';
    score: number;
    recommended_daily_limit: number;
    action: 'PROCEED' | 'SLOW_DOWN' | 'PAUSE';
    reason: string;
}

export const evaluateRisk = async (data: {
    dnsResults: any;
    ipScore: number;
    bounceRate: number;
    sendingVolume: number;
    historicalPerformance?: any;
}): Promise<RiskEvaluation> => {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
    Evaluate the email deliverability risk for a domain with the following data:
    DNS Results: ${JSON.stringify(data.dnsResults)}
    IP Reputation Score (0-100, lower is better): ${data.ipScore}
    Current Bounce Rate: ${data.bounceRate}%
    Current Sending Volume: ${data.sendingVolume} emails/day
    
    CRITICAL RULES:
    1. If SPF or DKIM is false, risk MUST be HIGH_RISK.
    2. AI cannot override DNS failures.
    3. Maximum daily limit for shared hosting is 20.
    
    Output MUST be in STRICT JSON ONLY:
    {
      "risk": "SAFE | CAUTION | HIGH_RISK",
      "score": 0-100,
      "recommended_daily_limit": number,
      "action": "PROCEED | SLOW_DOWN | PAUSE",
      "reason": "short explanation"
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        // Extract JSON from text (sometimes Gemini wraps it in markdown blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error('Invalid AI response format');
    } catch (error) {
        console.error('Gemini evaluation failed:', error);
        // Fallback safe defaults if AI fails
        return {
            risk: 'CAUTION',
            score: 50,
            recommended_daily_limit: 5,
            action: 'SLOW_DOWN',
            reason: 'AI evaluation failed, reverting to safe defaults.'
        };
    }
};

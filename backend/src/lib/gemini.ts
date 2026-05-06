import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const analyzeRisk = async (data: {
    domain: string;
    spf: boolean;
    dkim: boolean;
    dmarc: boolean;
    history?: any[];
}) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
            Analyze the email deliverability risk for the following domain setup:
            Domain: ${data.domain}
            SPF: ${data.spf ? 'Pass' : 'Fail'}
            DKIM: ${data.dkim ? 'Pass' : 'Fail'}
            DMARC: ${data.dmarc ? 'Pass' : 'Fail'}

            Return a JSON object with:
            - score: 0-100 (100 is best)
            - riskLevel: 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
            - recommendation: short string
            - reason: short string explaining the score
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Extract JSON from markdown if needed
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (error) {
        console.error('AI Analysis failed:', error);
        return {
            score: 50,
            riskLevel: 'MEDIUM',
            recommendation: 'Manual review required',
            reason: 'AI analysis failed'
        };
    }
};

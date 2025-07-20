import { AzureOpenAI } from "openai";
import fs from "fs";

export class GPTService {
    private static instance: GPTService;
    private apiKey: string;
    client: any;
    private constructor() {
        this.apiKey = process.env.GPT_API_KEY ?? "";
        var subscription_key = this.apiKey;
        const endpoint = `https://${process.env.GPT_RESOURCE_NAME}.openai.azure.com/`;
        const apiVersion = "2025-01-01-preview";
        const deployment = process.env.GPT_DEPLOYMENT_NAME;
        this.client = new AzureOpenAI({ endpoint, apiKey: subscription_key, apiVersion, deployment });
        // make sure the .history directory exists
        if (!fs.existsSync('.history')) {
            fs.mkdirSync('.history');
        }
    }

    public static getInstance(): GPTService {
        if (!GPTService.instance) {
            GPTService.instance = new GPTService();
        }
        return GPTService.instance;
    }

    public async chat(prompt: string, historyId?: string): Promise<string> {
        // check if we have any history for this prompt
        const history = historyId ? await this.getHistory(historyId) : [];
        const question = prompt;
        // generate a response using the GPT client
        const response = await this.generateResponse(question, []);
        // save the prompt and response to the history
        if (historyId) {
            await this.saveHistory(historyId, prompt, response);
        }
        return response;
    }

    private async generateResponse(question: string, history: string[]): Promise<string> {
        try {
            const response = await this.client.chat.completions.create({
                model: process.env.GPT_DEPLOYMENT_NAME,
                messages: [...history.map(h => ({ role: "assistant", content: h })), { role: "user", content: question }],
                max_tokens: 1024
            });
            return response.choices[0].message.content;
        } catch (error) {
            console.error("Error generating response:", error);
            throw new Error("Failed to generate response from GPT service.");
        }
    }

    private async getHistory(historyId: string): Promise<string[]> {
        const historyFilePath = `.history/${historyId}.json`;
        if (fs.existsSync(historyFilePath)) {
            const history = JSON.parse(fs.readFileSync(historyFilePath, "utf-8"));
            if (history.length > 20) {
                return history.slice(-20);
            }
            return history;
        } else {
            return [];
        }
    }

    private async saveHistory(historyId: string, prompt: string, response: string): Promise<void> {
        // This method should save the prompt and response to the history
        const historyFilePath = `.history/${historyId}.json`;
        const user = { "role": "user", content: prompt }
        const assistant = { "role": "assistant", content: response };
        if (fs.existsSync(historyFilePath)) {
            // If yes, append the response to the file
            const history = JSON.parse(fs.readFileSync(historyFilePath, "utf-8"));
            history.push(user);
            history.push(assistant);
            fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2));
        } else {
            fs.writeFileSync(historyFilePath, JSON.stringify([user, assistant], null, 2));
        }
    }
}
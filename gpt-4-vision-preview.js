import OpenAI from "openai";
import creds from "./credentials.js";
const openai = new OpenAI({
    apiKey: creds.openAIKey,
});

async function main() {
    const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        max_tokens: 4000,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text", text: "Extract all available amounts and values. "
                    },
                    {
                        type: "image_url",
                        image_url: {
                            "url": "https://lh3.googleusercontent.com/", "detail": "high"
                        },
                    },
                ],
            },
        ],
    });
    console.log(response);
    console.log(response.choices[0]);
}
main();

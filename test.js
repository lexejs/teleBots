import OpenAI from "openai";
import creds from "./credentials.js";

const openai = new OpenAI({
    apiKey: creds.openAIKey,
});

async function main() {
    const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        max_tokens: 300,
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: "describe photo in russian?" },
                    {
                        type: "image_url",
                        image_url: {
                            "url": "https://miro.medium.com/v2/resize:fit:720/format:webp/1*YMJDp-kqus7i-ktWtksNjg.jpeg",
                        },
                    },
                ],
            },
        ],
    });
    console.log(response.choices[0]);
}
main();

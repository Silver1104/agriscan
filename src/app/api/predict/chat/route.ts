// app/api/chat/route.ts
export async function POST(request: Request) {
    // Parse the request body to get the messages
    let messages;
    try {
        const body = await request.json();
        messages = body.messages;
        if (!messages || !Array.isArray(messages)) {
            throw new Error("Invalid messages array");
        }
    } catch (e) {
        return new Response(JSON.stringify({ error: "Invalid request" }), {
            status: 400,
        });
    }

    try {
        // Extract the disease name from the assistant's first message
        const firstAssistantMessage = messages.find(msg => msg.role === 'assistant');
        const diseaseMatch = firstAssistantMessage?.content.match(/affected by: \*\*(.*?)\*\*/);
        const diseaseName = diseaseMatch ? diseaseMatch[1] : 'Unknown';

        // Create a system prompt with plant disease information
        const systemPrompt = `
        You are AgriBot, an expert in plant diseases and their treatments. 
        The user has a plant affected by "${diseaseName}".
        
        Here's some information about ${diseaseName} that you should know:
        ${getPlantDiseaseInfo(diseaseName)}
        
        Provide helpful, practical advice for treating this condition. Keep responses concise and actionable.
        Format your response with markdown for readability when appropriate.
      `;

        // Prepare messages for the API call
        const apiMessages = [
            { role: 'system', content: systemPrompt },
            ...messages.filter(msg => msg.role === 'user' || msg.role === 'assistant')
        ];

        // Call the Groq API
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                messages: apiMessages,
                model: 'llama-3.3-70b-versatile',
                temperature: 0.5,
                max_completion_tokens: 1024,
                top_p: 1,
                stream: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Groq API error:", errorData);
            throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();
        const reply = data.choices[0].message.content;

        // Return the reply to the client
        return new Response(JSON.stringify({ reply }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Chat processing error:", error);
        return new Response(
            JSON.stringify({
                error: "Failed to process request",
                reply: "I'm sorry, I'm having trouble accessing my knowledge base right now. Please try again later."
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" }
            }
        );
    }
}

// Helper function to provide information about common plant diseases
function getPlantDiseaseInfo(diseaseName: string): string {
    const diseaseInfo: Record<string, string> = {
        'Powdery Mildew': 'A fungal disease that appears as white powdery spots on leaves. It thrives in humid conditions with poor air circulation. Treatment includes fungicides, neem oil, and improving air circulation.',

        'Leaf Spot': 'Caused by various fungi and bacteria, appearing as dark spots on leaves. It spreads in wet conditions. Treatment includes removing affected leaves, avoiding overhead watering, and fungicide application.',

        'Blight': 'A rapid and complete chlorosis, browning, then death of plant tissues such as leaves, branches, twigs, or floral organs. Caused by fungi or bacteria. Treatment depends on the specific type of blight.',

        'Rust': 'A fungal disease causing orange, yellow, or brown pustules on the undersides of leaves. Treatment includes fungicides, removing affected plants, and improving air circulation.',

        'Bacterial Wilt': 'A bacterial disease causing rapid wilting. Plants may not show symptoms until the disease is advanced. Treatment is difficult; prevention through resistant varieties and clean tools is best.',

        'Viral Infection': 'Causes mottling, distortion of leaves, and stunted growth. Most plant viruses are transmitted by insects. No chemical cure; affected plants should be removed to prevent spread.',

        'Root Rot': 'Caused by overwatering and fungi in the soil, leading to decaying roots. Treatment includes improved drainage, reduced watering, and fungicides in severe cases.',

        'Nutrient Deficiency': 'Not a disease but causes similar symptoms. Different deficiencies have specific symptoms. Treatment involves applying the appropriate fertilizer or adjusting soil pH.',

        'Aphid Infestation': 'Tiny insects that suck plant sap, causing yellowing and curling of leaves. They also spread viral diseases. Treatment includes insecticidal soap, neem oil, or introducing beneficial insects.',

        'Spider Mite Damage': 'Tiny pests that cause stippling on leaves and fine webbing. They thrive in hot, dry conditions. Treatment includes increasing humidity, insecticidal soap, and miticides.'
    };

    // Return information about the specific disease or a general response if not found
    return diseaseInfo[diseaseName] ||
        'This appears to be a plant health issue. Generally, treatment approaches include cultural practices (like proper watering and spacing), physical removal of affected parts, organic treatments (like neem oil or compost tea), and chemical controls as a last resort.';
}
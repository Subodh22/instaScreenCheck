import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageDataUrl } = body;

    if (!imageDataUrl) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    console.log('Starting AI vision analysis...');

    // Remove the data URL prefix to get just the base64 data
    const base64Data = imageDataUrl.replace(/^data:image\/[a-z]+;base64,/, '');

    const result = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert at analyzing iPhone Screen Time screenshots. Extract the following information in JSON format:

{
  "totalTime": "total screen time (e.g., '5h 14m')",
  "date": "date shown (e.g., 'Wednesday, 30 July')",
  "apps": [
    {"name": "app name", "time": "usage time"}
  ],
  "categories": [
    {"name": "category name", "time": "usage time"}
  ],
  "updatedAt": "when data was last updated (e.g., '11:09 am')"
}

Focus on:
- Total screen time (usually the largest time shown prominently)
- Individual app usage times (e.g., "Chrome: 2h 53m", "vibecode: 28m")
- App categories (e.g., "Utilities: 2h 53m", "Information & Reading: 19m")
- Date and update timestamp
- Only return valid JSON, no additional text`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this iPhone Screen Time screenshot and extract the screen time data in the specified JSON format."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      })
    });

    const responseData = await result.json();
    console.log('OpenAI Response:', responseData);

    if (!result.ok) {
      throw new Error(`OpenAI API error: ${responseData.error?.message || 'Unknown error'}`);
    }

    const aiResponse = responseData.choices[0]?.message?.content;
    console.log('AI Response:', aiResponse);

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Try to extract JSON from the response
    let jsonData;
    try {
      // Look for JSON in the response (AI might wrap it in markdown)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[0]);
      } else {
        jsonData = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse AI response as JSON');
    }

    return NextResponse.json({ 
      success: true, 
      data: jsonData
    });

  } catch (error) {
    console.error('AI Vision API error:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { imageBase64 } = body

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 })
    }

    const prompt = `Analyze this receipt image and extract all items with their prices.

For each item, identify:
1. The item name
2. The price (numeric value only, no currency symbols)
3. Whether tax applies - if the item has "H" marked next to it, set hasTax to true (13% HST)

Return ONLY a valid JSON array with this exact format, no other text, no markdown:
[
  {"name": "Item Name", "price": 10.99, "hasTax": true},
  {"name": "Another Item", "price": 5.50, "hasTax": false}
]

Rules:
- Extract individual item prices, NOT subtotals or grand totals
- If "H" appears next to an item line, set hasTax to true
- Return [] if no items can be extracted
- Numbers only for price, no $ signs`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  // OpenAI accepts the full data URL directly
                  url: imageBase64,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('OpenAI API error:', err)
      return NextResponse.json({ error: 'Failed to process receipt' }, { status: 500 })
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content?.trim() ?? ''

    let items = []
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        items = JSON.parse(jsonMatch[0])
      }
    } catch {
      console.error('Failed to parse OCR response:', text)
    }

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error processing receipt:', error)
    return NextResponse.json({ error: 'Failed to process receipt' }, { status: 500 })
  }
}
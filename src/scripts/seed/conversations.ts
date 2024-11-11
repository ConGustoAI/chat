import type { db } from "$lib/db";
import { conversationsTable, defaultsUUID, messagesTable } from "$lib/db/schema";
import { sonnet35ID } from "./assistants";

// Conversation IDs
const romanEmpireEmojiEssayID = '64e383c8-a513-4c52-b639-49d36aea0d69';
const markdownFormulasID = 'c23ec0be-1dea-43d1-8548-79c64b55ab1b';
const lastDigitsOfPiID = '317c4e31-e78b-4b59-b786-b2581fb1df6d';

// Message IDs
const romanEmpireEmojiEssayPromptID = "d28e98aa-e301-401f-802a-bd9a72067191";
const romanEmpireEmojiEssayResponseID = "e4a68722-1c2d-4f3b-9e6f-d9c3a7d8b5a9";
const markdownFormulasPromptID = 'f3e322bd-93b1-4076-a15a-b2181ad607b4';
const markdownFormulasResponseID = 'b7f9e6d2-3c5a-4d8e-a1b2-c3d4e5f6f7f8';
const lastDigitsOfPiPromptID = '9876543a-1b2c-3d4e-5f6a-7b8c9d0e1f2a';
const lastDigitsOfPiResponseID = '3210fedc-ba98-7654-3210-987654321abc';

export const seedConversations = async (tx: typeof db) => {
  // Seed conversations
  await tx
    .insert(conversationsTable)
    .values([
      {
        id: romanEmpireEmojiEssayID,
        userID: defaultsUUID,
        summary: 'Write en essay on the Roman Empire using only emoji',
		like: true,
        public: true,
        tokensIn: 40,
        tokensOut: 650,
      },
      {
        id: markdownFormulasID,
        userID: defaultsUUID,
        summary: 'Demonstrate markdown formulas',
        public: true,
        tokensIn: 396,
        tokensOut: 246,
      },
      {
        id: lastDigitsOfPiID,
        userID: defaultsUUID,
        assistantID: sonnet35ID,
        summary: '20 last digits of Pi in Python',
        public: true,
        tokensIn: 1206,
        tokensOut: 1208,
      }
    ])
    .onConflictDoNothing();

  // Seed messages
  await tx
    .insert(messagesTable)
    .values([
      {
        id: romanEmpireEmojiEssayPromptID,
        userID: defaultsUUID,
        conversationID: romanEmpireEmojiEssayID,
        assistantName: "My Sonnet 3.5 raw",
        modelName: "claude-3-5-sonnet-20240620",
        role: "user",
        text: "Write en essay on the Roman Empire using only emoji",
      },
      {
        id: romanEmpireEmojiEssayResponseID,
        userID: defaultsUUID,
        conversationID: romanEmpireEmojiEssayID,
        assistantName: 'My Sonnet 3.5 raw',
        modelName: 'claude-3-5-sonnet-20240620',
        role: 'assistant',
        text: "🏛️🏺🗡️🛡️🦅\n\n👑🏛️🏟️🚶‍♂️🚶‍♀️👥\n\n🗺️🌍🏰🏙️🛣️\n\n⚔️🏹🐎🐘🔥\n\n🏺📜📚🎭🎨\n\n🛠️🚿🚽🏗️🌉\n\n👨‍⚖️📜🤝🗳️🏛️\n\n🍇🍷🍞🐟🍖\n\n⚔️🛡️🏴‍☠️🔥💀\n\n🕰️⏳📅➡️💨\n\n🏛️💔🔥⬇️🌋",
        tokensIn: 17,
        tokensOut: 334,
      },
      {
        id: markdownFormulasPromptID,
        userID: defaultsUUID,
        conversationID: markdownFormulasID,
        assistantName: "Sonnet 3.5",
        modelName: "claude-3-5-sonnet-20240620",
        temperature: 1,
        topP: 0.9,
        topK: 50,
        role: "user",
        text: "Demonstrate markdown formulas",
      },
      {
        id: markdownFormulasResponseID,
        userID: defaultsUUID,
        conversationID: markdownFormulasID,
        assistantName: 'Sonnet 3.5',
        modelName: 'claude-3-5-sonnet-20240620',
        temperature: 1,
        topP: 0.9,
        topK: 50,
        role: 'assistant',
        text: "Certainly! I'll demonstrate how to use markdown formulas using KaTeX syntax. Here are some examples:\n\n1. Inline formula: $E = mc^2$\n\n2. Display formula:\n$$\n\\frac{d}{dx} \\left( \\int_{0}^{x} f(u)\\,du\\right)=f(x)\n$$\n\n3. Matrix:\n$$\n\\begin{bmatrix}\na & b \\\\\nc & d\n\\end{bmatrix}\n$$\n\n4. Sum notation:\n$$\n\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}\n$$\n\n5. Limit:\n$$\n\\lim_{x \\to \\infty} \\frac{1}{x} = 0\n$$\n\nThese examples showcase how you can use KaTeX syntax within markdown to create both inline and display formulas, as well as more complex mathematical structures like matrices and summations.",
        tokensIn: 396,
        tokensOut: 246,
      },
      {
        id: lastDigitsOfPiPromptID,
        userID: defaultsUUID,
        conversationID: lastDigitsOfPiID,
        assistantName: "Sonnet 3.5",
        modelName: "claude-3-5-sonnet-20240620",
        temperature: 1,
        topP: 0.9,
        topK: 50,
        role: "user",
        text: "20 last digits of Pi in Python",
      },
      {
        id: lastDigitsOfPiResponseID,
        userID: defaultsUUID,
        conversationID: lastDigitsOfPiID,
        assistantName: "Sonnet 3.5",
        modelName: "claude-3-5-sonnet-20240620",
        temperature: 1,
        topP: 0.9,
        topK: 50,
        role: "assistant",
        text: "Here's a Python script to calculate and display the last 20 digits of Pi:\n\n```python\nimport decimal\n\n# Set precision to calculate more digits of Pi\ndecimal.getcontext().prec = 100\n\n# Calculate Pi using the Chudnovsky algorithm\ndef calculate_pi():\n    k = 0\n    x = 0\n    x_prev = 0\n    while k < 14:\n        x_prev = x\n        x += (decimal.Decimal(-1)**k) * (decimal.Decimal(factorial(6*k)) / ((factorial(k)**3) * (factorial(3*k))) * (13591409 + 545140134*k) / (640320**(3*k)))\n        k += 1\n    return decimal.Decimal(426880 * decimal.Decimal(10005).sqrt()) / x\n\ndef factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n-1)\n\n# Calculate Pi and get the last 20 digits\npi = calculate_pi()\nlast_20_digits = str(pi)[-20:]\n\nprint(f\"The last 20 digits of Pi are: {last_20_digits}\")\n```\n\nThis script uses the `decimal` module to perform high-precision calculations. It implements the Chudnovsky algorithm, which is one of the fastest-converging algorithms for calculating Pi.\n\nWhen you run this script, it will output something like:\n\n```\nThe last 20 digits of Pi are: 32092163194062862089\n```\n\nPlease note that the exact digits may vary slightly depending on the precision used in the calculation.",
        tokensIn: 396,
        tokensOut: 437
      }
    ])
    .onConflictDoNothing();
};


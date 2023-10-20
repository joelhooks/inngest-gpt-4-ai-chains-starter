import OpenAI from 'openai'
import {inngest} from "@/inngest/inngest.server";
import {AI_WRITING_COMPLETED_EVENT, AI_WRITING_REQUESTED_EVENT} from "@/inngest/events";
import {env} from "@/env.mjs";

const openai = new OpenAI()

export const writeAnEmail = inngest.createFunction(
  {id: `gpt-4-writer`, name: 'GPT-4 Writer'},
  {event: AI_WRITING_REQUESTED_EVENT},
  async ({event, step}) => {


    const systemPrompt = `You are a heartfelt story teller.`

    const primarySystemWriterPrompt = `Pause. Take a deep breath and think. Tell me a story about developers.`

    const aiResponse = await step.run(
      'send to writer for first draft',
      async () => {
        return openai.chat.completions.create({
          messages: [
            {role: 'system', content: systemPrompt},
            {role: 'user', content: primarySystemWriterPrompt},
          ],
          model: 'gpt-4',
          max_tokens: 200
        })
      },
    )


    await step.sendEvent('notify that writing is done', {
      name: AI_WRITING_COMPLETED_EVENT,
      data: {
        result: aiResponse?.choices[0]?.message.content,
        fullPrompt: [
          {role: 'system', content: systemPrompt},
          {role: 'user', content: primarySystemWriterPrompt},
        ]
      },
    })
    await step.run('send announcement via socket', async () => {
      const partyUrl = `${env.NEXT_PUBLIC_PARTY_KIT_URL}/party/${env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME}`
      await fetch(partyUrl, {
        method: "POST",
        body: JSON.stringify({
          body: aiResponse?.choices[0]?.message.content,
        }),
      }).catch((e) => {
        console.error(e);
      })
    })


    return 'done'
  },
)

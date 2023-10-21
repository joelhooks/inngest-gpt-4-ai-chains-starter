import {inngest} from "@/inngest/inngest.server";
import {AI_WRITING_COMPLETED_EVENT, AI_WRITING_REQUESTED_EVENT} from "@/inngest/events";
import {env} from "@/env.mjs";
import {Configuration, OpenAIApi} from "openai-edge";
import {ProgressWriter} from "@/types";
import {OpenAIStreamingDataPartykitChunkPublisher, STREAM_COMPLETE} from "@/lib/streaming-chunk-publisher";

const config = new Configuration({apiKey: env.OPENAI_API_KEY})
const openai = new OpenAIApi(config)




export const writeAnEmail = inngest.createFunction(
  {id: `gpt-4-writer`, name: 'GPT-4 Writer'},
  {event: AI_WRITING_REQUESTED_EVENT},
  async ({event, step}) => {


    const systemPrompt = event.data.input.instructions && `You craft thoughtful phrases for customer emails`

    const primarySystemWriterPrompt = `
    # Instructions
    Pause. Take a deep breath and think. 
    Below is an email template. Template items for you to fill in are surrounded by brackets like this {{item}}
    
    ${event.data.input.input}
    
    * generate text for the template items. 
    * Do not include additional template items or 
    * do not include brackets in the response
    * if you are missing information, include generic information
    * if you don't have a name, use phrasing that doesn't require a name but isn't rude and impersonal
    
    Data:
    {
     customer: {
        name: "Mike Oxlong",
        email: "mike@example.com"
     }
    }
    
    Template:
    {{Greeting}},
    
    Congrats on completing the work. We are so excited to have you on board.
    
    {{personalized}}
    
    Cheers,
    Joel
   
    `

    const aiResponse = await step.run(
      'send to writer for first draft',
      async () => {
        const writer: ProgressWriter = new OpenAIStreamingDataPartykitChunkPublisher(event.data.requestId);
        let result
        const response = await openai.createChatCompletion({
          messages: [
            {role: 'system', content: systemPrompt},
            {role: 'user', content: primarySystemWriterPrompt},
          ],
          stream: true,
          model: 'gpt-4'
        })

        if (response.status >= 400) {
          result = await response.json();
          throw new Error(
            result?.error?.message ?  result.error.message as string : "There was an error with openAI",
            {
              cause: result,
            }
          );
        }

        try {
          result = await writer.writeResponseInChunks(response)
        } catch (e) {
          console.warn((e as Error).message, e);
        } finally {
          await writer.publishMessage(STREAM_COMPLETE);
        }

        return result
      },
    )


    // await step.run('send announcement via socket', async () => {
    //   const partyUrl = `${env.NEXT_PUBLIC_PARTY_KIT_URL}/party/${env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME}`
    //   await fetch(partyUrl, {
    //     method: "POST",
    //     body: JSON.stringify({
    //       body: aiResponse?.choices[0]?.message.content,
    //     }),
    //   }).catch((e) => {
    //     console.error(e);
    //   })
    // })


    return 'done'
  },
)

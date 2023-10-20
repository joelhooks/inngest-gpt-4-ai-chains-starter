import {serve} from 'inngest/next'
import {inngest} from '@/inngest/inngest.server'
import {writeAnEmail} from "@/inngest/functions/ai/writer";

export const runtime = 'edge'

export const {GET, POST, PUT} = serve({client: inngest, functions:[writeAnEmail]})

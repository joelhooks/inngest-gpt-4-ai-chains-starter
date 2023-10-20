import Link from "next/link";

import { getServerAuthSession } from "@/server/auth";
import {ChatLog} from "@/app/_components/chatlog";
import {env} from "@/env.mjs";
import {inngest} from "@/inngest/inngest.server";
import {AI_WRITING_REQUESTED_EVENT} from "@/inngest/events";

export default async function Home() {
  const session = await getServerAuthSession();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <form action={async () => {
            'use server'
            await inngest.send({
                name: AI_WRITING_REQUESTED_EVENT,
                data: {}
            })
        }}>
        <button  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            press me
        </button>
        </form>
        <ChatLog />
    </main>
  );
}

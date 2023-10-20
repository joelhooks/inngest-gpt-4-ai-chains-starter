'use client'
import * as React from 'react'
import usePartySocket from "partysocket/react";
import {env} from "@/env.mjs";

export function ChatLog() {
    const [messages, setMessages] = React.useState<any[]>([])
    const socket = usePartySocket({
        room: env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME,
        host: env.NEXT_PUBLIC_PARTY_KIT_URL,
        onMessage: (message) => {
            console.log(message);
            setMessages([...messages, message.data]);
        }
    });
    return (
        <div>{messages}</div>
    )
}
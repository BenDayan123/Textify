import { useEvent, useChannel } from "@harelpls/use-pusher";
import { IMessage } from "@interfaces/message";
import { Events } from "@lib/events";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";

async function fetchMessages(channel_id: string) {
  const res = await axios.get<IMessage[]>(`/api/message`, {
    params: {
      channel_id,
    },
  });
  return res.data;
}
export function useMessages(channel_id: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const channel = useChannel(`presence-room@${channel_id}`);
  const key = ["messages", channel_id, session?.user.id];
  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchMessages(channel_id),
  });

  useEvent<IMessage>(channel, Events.NEW_CHANNEL_MESSAGE, (data) => {
    queryClient.setQueryData(key, (old: any) => {
      return data ? [...old, data] : old;
    });
  });

  useEvent<{ messages: string[] }>(channel, Events.MESSAGE_SEEN, (data) => {
    if (!data) return;
    const { messages } = data;
    queryClient.setQueryData(key, (old: any) => {
      return old.map((message: any) => ({
        ...message,
        seen: messages.includes(message.id) ? true : message.seen,
      }));
    });
  });
  return query;
}
"use client";

import { useEffect } from "react";
import { IMessage } from "@interfaces/message";
import { IConversion } from "@interfaces/conversion";
import { useConversions } from "./useConversions";
import { Events } from "@lib/events";
import { InfiniteData, QueryKey, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { usePusher } from "./usePusher";
import { useRouter } from "next/navigation";

export const GlobalChannelListener = () => {
  const { chatIDs } = useConversions();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const pusher = usePusher();

  useEffect(() => {
    if (!pusher) return;
    const channels = chatIDs.map((id) => {
      const channel = pusher.subscribe(`presence-room@${id}`);
      const key = ["conversion", id, session?.user.id];

      const updateChat = (
        key: QueryKey,
        updater: (old: IConversion) => any,
      ) => {
        queryClient.setQueryData<IConversion>(key, (old) => {
          if (!old) return null;
          return { ...old, ...updater(old) };
        });
      };

      channel.bind(Events.NEW_CHANNEL_MESSAGE, (newMessage: IMessage) => {
        if (!newMessage) return;
        queryClient.setQueryData<InfiniteData<IMessage[]>>(
          ["messages", id, session?.user.id],
          (old) => {
            if (!old) return;
            const firstPage = [...old.pages[0], newMessage];
            return {
              pages: [firstPage, ...old.pages.slice(1)],
              pageParams: old.pageParams,
            };
          },
        );
        if (newMessage.fromID !== session?.user.id) {
          updateChat(key, (old) => ({
            unseenCount: old.unseenCount + 1,
          }));
        }
      });
      channel.bind(Events.MEMBERS_REMOVED, (removedMembers: string[]) => {
        if (removedMembers.includes(session?.user.id as string)) {
          queryClient.removeQueries({
            queryKey: ["conversion", id, session?.user.id],
          });
          channel.unsubscribe();
          router.push("/app/friends");
        } else
          updateChat(key, (old) => ({
            members: old.members.filter(
              (member) => !removedMembers.includes(member.id),
            ),
            admins: old.admins.filter(
              (admin) => !removedMembers.includes(admin.id),
            ),
          }));
      });
      channel.bind(Events.GROUP_EDITED, (data: any) => {
        updateChat(key, () => data);
      });
      channel.bind(Events.MEMBER_ADDED, (newMembers: string[]) => {
        updateChat(key, (old) => ({
          members: [...old.members, ...newMembers],
        }));
      });
      channel.bind(Events.MEMBER_LEAVED, (data: any) => {
        const { member, wasAdmin, newAdmin } = data;
        if (wasAdmin) {
          updateChat(key, (old) => ({
            ...(newAdmin && {
              members: old.members.filter(
                (member) => member.id !== newAdmin.id,
              ),
            }),
            admins: old.admins
              .filter((admin) => admin.id !== member.id)
              .concat([newAdmin]),
          }));
        } else
          updateChat(key, (old) => ({
            members: old.members.filter((curr) => curr.id !== member.id),
          }));
      });
      channel.bind(Events.USER_TYPING, (data: { name: string }) => {
        const { name } = data;
        console.log(data);
        updateChat(key, () => ({ liveAction: { user: name, type: "TYPING" } }));
      });
      channel.bind(Events.USER_STOP_TYPING, () => {
        updateChat(key, () => ({ liveAction: null }));
      });
      channel.bind(Events.USER_RECORDING, (data: { name: string }) => {
        const { name } = data;
        updateChat(key, () => ({
          liveAction: { user: name, type: "RECORDING" },
        }));
      });
      channel.bind(Events.USER_STOP_RECORDING, () => {
        updateChat(key, () => ({ liveAction: null }));
      });
      return channel;
    });

    return () => {
      channels.forEach(
        (channel) => channel && channel.unbind_all().unsubscribe(),
      );
    };
    // eslint-disable-line react-hooks/exhaustive-deps
  }, [pusher, chatIDs]);

  return null;
};

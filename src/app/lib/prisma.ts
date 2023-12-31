import { FriendShipStatus } from "@interfaces/user";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

const prismaClientSingleton = () => {
  return new PrismaClient()
    .$extends({
      query: {
        friendship: {
          async update({ args, query }) {
            const friendship = await query(args);
            const { requestedFromID, requestedToID, status } = friendship;
            if (status !== "ACCEPTED") return friendship;
            await prisma.conversion.create({
              data: {
                members: {
                  connect: [{ id: requestedFromID }, { id: requestedToID }],
                },
              },
            });
            return friendship;
          },
        },
      },
      model: {
        user: {
          async getFriends(id: string, status?: FriendShipStatus) {
            const friendships = await prisma.friendship.findMany({
              where: {
                OR: [
                  { requestedFromID: id },
                  // { ...(status === "ACCEPTED" && { requestedFromID: id }) },
                  { requestedToID: id },
                ],
                status,
              },
              select: {
                status: true,
                requestedFrom: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
                requestedTo: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            });
            return friendships.map((friendship: any) => ({
              ...(friendship.requestedFrom.id === id
                ? friendship.requestedTo
                : friendship.requestedFrom),
              friendship_status: friendship.status,
              type: friendship.requestedFrom.id === id ? "outgoing" : "ingoing",
            }));
          },
        },
        friendship: {
          async findFriendship(myID: string, friendID: string) {
            return await prisma.friendship.findFirst({
              where: {
                OR: [
                  { requestedToID: myID, requestedFromID: friendID },
                  { requestedToID: friendID, requestedFromID: myID },
                ],
              },
            });
          },
        },
      },
    })

    .$extends(withAccelerate());
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export function exclude(data: any, keys: string[]) {
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => !keys.includes(key)),
  );
}

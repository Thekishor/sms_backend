import logger from "../config/logger";

const userSockets = new Map<string, Set<string>>();
const socketUsers = new Map<string, string>();

export class SocketStore {

    public static addUser(userId: string, socketId: string): void {
        let sockets = userSockets.get(userId);

        if (!sockets) {
            sockets = new Set<string>();
            userSockets.set(userId, sockets);
        }

        sockets.add(socketId);
        socketUsers.set(socketId, userId);

        logger.info(`Client information store in memory; UserId: ${userId}: SocketId: ${socketId}`);
    }

    public static getSocketIds(userId: string) {
        return userSockets.get(userId);
    }

    public static removeUser(userId: string) {
        userSockets.delete(userId);

        socketUsers.forEach((value, key) => {
            if (value === userId) {
                socketUsers.delete(key);
            }
        });
    }

    public static getUserId(socketId: string) {
        return socketUsers.get(socketId);
    }
}
const users = new Map<string, string>();

export class SocketStore {

    public static addUser(
        userId: string,
        socketId: string,
    ) {
        users.set(userId, socketId);
    }

    public static getSocketId(
        userId: string
    ) {
        return users.get(userId);
    }

    public static removeUser(
        userId: string
    ) {
        users.delete(userId);
    }

    public static getUserId(
        socketId: string
    ) {
        return users.get(socketId);
    }
}
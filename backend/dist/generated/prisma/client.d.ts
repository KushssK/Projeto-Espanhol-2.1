import * as runtime from "@prisma/client/runtime/client";
import * as $Class from "./internal/class.js";
import * as Prisma from "./internal/prismaNamespace.js";
export * as $Enums from './enums.js';
export * from "./enums.js";
/**
 * ## Prisma Client
 *
 * Type-safe database client for TypeScript
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export declare const PrismaClient: $Class.PrismaClientConstructor;
export type PrismaClient<LogOpts extends Prisma.LogLevel = never, OmitOpts extends Prisma.PrismaClientOptions["omit"] = Prisma.PrismaClientOptions["omit"], ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = $Class.PrismaClient<LogOpts, OmitOpts, ExtArgs>;
export { Prisma };
/**
 * Model User
 *
 */
export type User = Prisma.UserModel;
/**
 * Model Whitelist_CPF
 *
 */
export type Whitelist_CPF = Prisma.Whitelist_CPFModel;
/**
 * Model AppSettings
 *
 */
export type AppSettings = Prisma.AppSettingsModel;
/**
 * Model Module
 *
 */
export type Module = Prisma.ModuleModel;
/**
 * Model Category
 *
 */
export type Category = Prisma.CategoryModel;
/**
 * Model Lesson
 *
 */
export type Lesson = Prisma.LessonModel;
/**
 * Model MediaLibrary
 *
 */
export type MediaLibrary = Prisma.MediaLibraryModel;
/**
 * Model Attachment
 *
 */
export type Attachment = Prisma.AttachmentModel;
/**
 * Model UserProgress
 *
 */
export type UserProgress = Prisma.UserProgressModel;
/**
 * Model ChatRoom
 *
 */
export type ChatRoom = Prisma.ChatRoomModel;
/**
 * Model RoomMember
 *
 */
export type RoomMember = Prisma.RoomMemberModel;
/**
 * Model Message
 *
 */
export type Message = Prisma.MessageModel;
//# sourceMappingURL=client.d.ts.map
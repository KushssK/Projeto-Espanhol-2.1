import * as runtime from "@prisma/client/runtime/index-browser";
export type * from '../models.js';
export type * from './prismaNamespace.js';
export declare const Decimal: typeof runtime.Decimal;
export declare const NullTypes: {
    DbNull: (new (secret: never) => typeof runtime.DbNull);
    JsonNull: (new (secret: never) => typeof runtime.JsonNull);
    AnyNull: (new (secret: never) => typeof runtime.AnyNull);
};
/**
 * Helper for filtering JSON entries that have `null` on the database (empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const DbNull: import("@prisma/client-runtime-utils").DbNullClass;
/**
 * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
/**
 * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const AnyNull: import("@prisma/client-runtime-utils").AnyNullClass;
export declare const ModelName: {
    readonly User: 'User';
    readonly Whitelist_CPF: 'Whitelist_CPF';
    readonly AppSettings: 'AppSettings';
    readonly Module: 'Module';
    readonly Category: 'Category';
    readonly Lesson: 'Lesson';
    readonly MediaLibrary: 'MediaLibrary';
    readonly Attachment: 'Attachment';
    readonly UserProgress: 'UserProgress';
    readonly ChatRoom: 'ChatRoom';
    readonly RoomMember: 'RoomMember';
    readonly Message: 'Message';
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export declare const TransactionIsolationLevel: {
    readonly ReadUncommitted: 'ReadUncommitted';
    readonly ReadCommitted: 'ReadCommitted';
    readonly RepeatableRead: 'RepeatableRead';
    readonly Serializable: 'Serializable';
};
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const UserScalarFieldEnum: {
    readonly id: 'id';
    readonly email: 'email';
    readonly username: 'username';
    readonly passwordHash: 'passwordHash';
    readonly dob: 'dob';
    readonly role: 'role';
    readonly cpfHash: 'cpfHash';
    readonly avatarUrl: 'avatarUrl';
    readonly isBanned: 'isBanned';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum];
export declare const Whitelist_CPFScalarFieldEnum: {
    readonly cpf: 'cpf';
    readonly role: 'role';
};
export type Whitelist_CPFScalarFieldEnum = (typeof Whitelist_CPFScalarFieldEnum)[keyof typeof Whitelist_CPFScalarFieldEnum];
export declare const AppSettingsScalarFieldEnum: {
    readonly id: 'id';
    readonly themeColor: 'themeColor';
    readonly logoUrl: 'logoUrl';
    readonly updatedAt: 'updatedAt';
};
export type AppSettingsScalarFieldEnum = (typeof AppSettingsScalarFieldEnum)[keyof typeof AppSettingsScalarFieldEnum];
export declare const ModuleScalarFieldEnum: {
    readonly id: 'id';
    readonly title: 'title';
    readonly description: 'description';
    readonly orderIndex: 'orderIndex';
};
export type ModuleScalarFieldEnum = (typeof ModuleScalarFieldEnum)[keyof typeof ModuleScalarFieldEnum];
export declare const CategoryScalarFieldEnum: {
    readonly id: 'id';
    readonly moduleId: 'moduleId';
    readonly title: 'title';
    readonly description: 'description';
    readonly orderIndex: 'orderIndex';
};
export type CategoryScalarFieldEnum = (typeof CategoryScalarFieldEnum)[keyof typeof CategoryScalarFieldEnum];
export declare const LessonScalarFieldEnum: {
    readonly id: 'id';
    readonly moduleId: 'moduleId';
    readonly categoryId: 'categoryId';
    readonly title: 'title';
    readonly content: 'content';
    readonly videoUrl: 'videoUrl';
    readonly orderIndex: 'orderIndex';
};
export type LessonScalarFieldEnum = (typeof LessonScalarFieldEnum)[keyof typeof LessonScalarFieldEnum];
export declare const MediaLibraryScalarFieldEnum: {
    readonly id: 'id';
    readonly moduleId: 'moduleId';
    readonly title: 'title';
    readonly description: 'description';
    readonly type: 'type';
    readonly url: 'url';
    readonly videoUrl: 'videoUrl';
    readonly orderIndex: 'orderIndex';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type MediaLibraryScalarFieldEnum = (typeof MediaLibraryScalarFieldEnum)[keyof typeof MediaLibraryScalarFieldEnum];
export declare const AttachmentScalarFieldEnum: {
    readonly id: 'id';
    readonly lessonId: 'lessonId';
    readonly type: 'type';
    readonly url: 'url';
    readonly orderIndex: 'orderIndex';
};
export type AttachmentScalarFieldEnum = (typeof AttachmentScalarFieldEnum)[keyof typeof AttachmentScalarFieldEnum];
export declare const UserProgressScalarFieldEnum: {
    readonly userId: 'userId';
    readonly lessonId: 'lessonId';
    readonly isCompleted: 'isCompleted';
    readonly score: 'score';
    readonly completedAt: 'completedAt';
};
export type UserProgressScalarFieldEnum = (typeof UserProgressScalarFieldEnum)[keyof typeof UserProgressScalarFieldEnum];
export declare const ChatRoomScalarFieldEnum: {
    readonly id: 'id';
    readonly type: 'type';
    readonly name: 'name';
    readonly createdAt: 'createdAt';
};
export type ChatRoomScalarFieldEnum = (typeof ChatRoomScalarFieldEnum)[keyof typeof ChatRoomScalarFieldEnum];
export declare const RoomMemberScalarFieldEnum: {
    readonly userId: 'userId';
    readonly chatRoomId: 'chatRoomId';
    readonly joinedAt: 'joinedAt';
};
export type RoomMemberScalarFieldEnum = (typeof RoomMemberScalarFieldEnum)[keyof typeof RoomMemberScalarFieldEnum];
export declare const MessageScalarFieldEnum: {
    readonly id: 'id';
    readonly chatRoomId: 'chatRoomId';
    readonly senderId: 'senderId';
    readonly content: 'content';
    readonly mediaUrl: 'mediaUrl';
    readonly mediaType: 'mediaType';
    readonly createdAt: 'createdAt';
};
export type MessageScalarFieldEnum = (typeof MessageScalarFieldEnum)[keyof typeof MessageScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: 'asc';
    readonly desc: 'desc';
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const NullsOrder: {
    readonly first: 'first';
    readonly last: 'last';
};
export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];
export declare const UserOrderByRelevanceFieldEnum: {
    readonly id: 'id';
    readonly email: 'email';
    readonly username: 'username';
    readonly passwordHash: 'passwordHash';
    readonly cpfHash: 'cpfHash';
    readonly avatarUrl: 'avatarUrl';
};
export type UserOrderByRelevanceFieldEnum = (typeof UserOrderByRelevanceFieldEnum)[keyof typeof UserOrderByRelevanceFieldEnum];
export declare const Whitelist_CPFOrderByRelevanceFieldEnum: {
    readonly cpf: 'cpf';
};
export type Whitelist_CPFOrderByRelevanceFieldEnum = (typeof Whitelist_CPFOrderByRelevanceFieldEnum)[keyof typeof Whitelist_CPFOrderByRelevanceFieldEnum];
export declare const AppSettingsOrderByRelevanceFieldEnum: {
    readonly themeColor: 'themeColor';
    readonly logoUrl: 'logoUrl';
};
export type AppSettingsOrderByRelevanceFieldEnum = (typeof AppSettingsOrderByRelevanceFieldEnum)[keyof typeof AppSettingsOrderByRelevanceFieldEnum];
export declare const ModuleOrderByRelevanceFieldEnum: {
    readonly id: 'id';
    readonly title: 'title';
    readonly description: 'description';
};
export type ModuleOrderByRelevanceFieldEnum = (typeof ModuleOrderByRelevanceFieldEnum)[keyof typeof ModuleOrderByRelevanceFieldEnum];
export declare const CategoryOrderByRelevanceFieldEnum: {
    readonly id: 'id';
    readonly moduleId: 'moduleId';
    readonly title: 'title';
    readonly description: 'description';
};
export type CategoryOrderByRelevanceFieldEnum = (typeof CategoryOrderByRelevanceFieldEnum)[keyof typeof CategoryOrderByRelevanceFieldEnum];
export declare const LessonOrderByRelevanceFieldEnum: {
    readonly id: 'id';
    readonly moduleId: 'moduleId';
    readonly categoryId: 'categoryId';
    readonly title: 'title';
    readonly content: 'content';
    readonly videoUrl: 'videoUrl';
};
export type LessonOrderByRelevanceFieldEnum = (typeof LessonOrderByRelevanceFieldEnum)[keyof typeof LessonOrderByRelevanceFieldEnum];
export declare const MediaLibraryOrderByRelevanceFieldEnum: {
    readonly id: 'id';
    readonly moduleId: 'moduleId';
    readonly title: 'title';
    readonly description: 'description';
    readonly url: 'url';
    readonly videoUrl: 'videoUrl';
};
export type MediaLibraryOrderByRelevanceFieldEnum = (typeof MediaLibraryOrderByRelevanceFieldEnum)[keyof typeof MediaLibraryOrderByRelevanceFieldEnum];
export declare const AttachmentOrderByRelevanceFieldEnum: {
    readonly id: 'id';
    readonly lessonId: 'lessonId';
    readonly url: 'url';
};
export type AttachmentOrderByRelevanceFieldEnum = (typeof AttachmentOrderByRelevanceFieldEnum)[keyof typeof AttachmentOrderByRelevanceFieldEnum];
export declare const UserProgressOrderByRelevanceFieldEnum: {
    readonly userId: 'userId';
    readonly lessonId: 'lessonId';
};
export type UserProgressOrderByRelevanceFieldEnum = (typeof UserProgressOrderByRelevanceFieldEnum)[keyof typeof UserProgressOrderByRelevanceFieldEnum];
export declare const ChatRoomOrderByRelevanceFieldEnum: {
    readonly id: 'id';
    readonly name: 'name';
};
export type ChatRoomOrderByRelevanceFieldEnum = (typeof ChatRoomOrderByRelevanceFieldEnum)[keyof typeof ChatRoomOrderByRelevanceFieldEnum];
export declare const RoomMemberOrderByRelevanceFieldEnum: {
    readonly userId: 'userId';
    readonly chatRoomId: 'chatRoomId';
};
export type RoomMemberOrderByRelevanceFieldEnum = (typeof RoomMemberOrderByRelevanceFieldEnum)[keyof typeof RoomMemberOrderByRelevanceFieldEnum];
export declare const MessageOrderByRelevanceFieldEnum: {
    readonly id: 'id';
    readonly chatRoomId: 'chatRoomId';
    readonly senderId: 'senderId';
    readonly content: 'content';
    readonly mediaUrl: 'mediaUrl';
};
export type MessageOrderByRelevanceFieldEnum = (typeof MessageOrderByRelevanceFieldEnum)[keyof typeof MessageOrderByRelevanceFieldEnum];
//# sourceMappingURL=prismaNamespaceBrowser.d.ts.map
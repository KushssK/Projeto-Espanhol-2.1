import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    dob: z.ZodString;
    username: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>;
}, z.core.$strip>;
export declare const registerStaffSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    dob: z.ZodString;
    username: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>;
    cpf: z.ZodString;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const bootstrapAdminSchema: z.ZodObject<{
    secret: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    dob: z.ZodString;
    username: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>;
}, z.core.$strip>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterStaffInput = z.infer<typeof registerStaffSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type BootstrapAdminInput = z.infer<typeof bootstrapAdminSchema>;
//# sourceMappingURL=auth.validators.d.ts.map
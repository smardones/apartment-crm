import { z } from 'zod';
export declare const CreateUnitSchema: z.ZodObject<{
    number: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<[string, ...string[]]>>;
    rent: z.ZodNumber;
    bedrooms: z.ZodNumber;
    bathrooms: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    number: string;
    status: string;
    rent: number;
    bedrooms: number;
    bathrooms: number;
}, {
    number: string;
    rent: number;
    bedrooms: number;
    bathrooms: number;
    status?: string | undefined;
}>;
export declare const UpdateUnitSchema: z.ZodObject<{
    number: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<[string, ...string[]]>>>;
    rent: z.ZodOptional<z.ZodNumber>;
    bedrooms: z.ZodOptional<z.ZodNumber>;
    bathrooms: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    number?: string | undefined;
    status?: string | undefined;
    rent?: number | undefined;
    bedrooms?: number | undefined;
    bathrooms?: number | undefined;
}, {
    number?: string | undefined;
    status?: string | undefined;
    rent?: number | undefined;
    bedrooms?: number | undefined;
    bathrooms?: number | undefined;
}>;
export declare const CreateProspectSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<[string, ...string[]]>>;
    notes: z.ZodDefault<z.ZodString>;
    assignedUnitId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status: string;
    name: string;
    email: string;
    phone: string;
    notes: string;
    assignedUnitId?: string | null | undefined;
}, {
    name: string;
    email: string;
    phone: string;
    status?: string | undefined;
    notes?: string | undefined;
    assignedUnitId?: string | null | undefined;
}>;
export declare const UpdateProspectSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<[string, ...string[]]>>>;
    notes: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    assignedUnitId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
}, "strip", z.ZodTypeAny, {
    status?: string | undefined;
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    notes?: string | undefined;
    assignedUnitId?: string | null | undefined;
}, {
    status?: string | undefined;
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    notes?: string | undefined;
    assignedUnitId?: string | null | undefined;
}>;
export type CreateUnitInput = z.infer<typeof CreateUnitSchema>;
export type UpdateUnitInput = z.infer<typeof UpdateUnitSchema>;
export type CreateProspectInput = z.infer<typeof CreateProspectSchema>;
export type UpdateProspectInput = z.infer<typeof UpdateProspectSchema>;

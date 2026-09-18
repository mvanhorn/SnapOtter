import { Arbitrary } from "fast-check";
import { input, output, ZodSchema, ZodTypeDef } from "zod";
declare type UnknownZodSchema = ZodSchema<unknown, ZodTypeDef, unknown>;
declare type OverrideArbitrary<Input = unknown> = Arbitrary<Input> | ((zfc: ZodFastCheck) => Arbitrary<Input>);
declare class _ZodFastCheck {
    private overrides;
    private clone;
    /**
     * Creates an arbitrary which will generate valid inputs to the schema.
     */
    inputOf<Schema extends UnknownZodSchema>(schema: Schema): Arbitrary<input<Schema>>;
    private inputWithPath;
    /**
     * Creates an arbitrary which will generate valid parsed outputs of
     * the schema.
     */
    outputOf<Schema extends UnknownZodSchema>(schema: Schema): Arbitrary<output<Schema>>;
    private findOverride;
    /**
     * Returns a new `ZodFastCheck` instance which will use the provided
     * arbitrary when generating inputs for the given schema.
     */
    override<Schema extends UnknownZodSchema>(schema: Schema, arbitrary: OverrideArbitrary<input<Schema>>): ZodFastCheck;
}
export declare type ZodFastCheck = _ZodFastCheck;
export declare function ZodFastCheck(): ZodFastCheck;
export declare namespace ZodFastCheck {
    var prototype: _ZodFastCheck;
}
export declare class ZodFastCheckError extends Error {
}
export declare class ZodFastCheckUnsupportedSchemaError extends ZodFastCheckError {
}
export declare class ZodFastCheckGenerationError extends ZodFastCheckError {
}
export {};

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZodFastCheckGenerationError = exports.ZodFastCheckUnsupportedSchemaError = exports.ZodFastCheckError = exports.ZodFastCheck = void 0;
const fast_check_1 = __importDefault(require("fast-check"));
const zod_1 = require("zod");
const MIN_SUCCESS_RATE = 0.01;
const SCALAR_TYPES = new Set([
    "ZodString",
    "ZodNumber",
    "ZodBigInt",
    "ZodBoolean",
    "ZodDate",
    "ZodUndefined",
    "ZodNull",
    "ZodLiteral",
    "ZodEnum",
    "ZodNativeEnum",
    "ZodAny",
    "ZodUnknown",
    "ZodVoid",
]);
class _ZodFastCheck {
    constructor() {
        this.overrides = new Map();
    }
    clone() {
        const cloned = new _ZodFastCheck();
        this.overrides.forEach((arbitrary, schema) => {
            cloned.overrides.set(schema, arbitrary);
        });
        return cloned;
    }
    /**
     * Creates an arbitrary which will generate valid inputs to the schema.
     */
    inputOf(schema) {
        return this.inputWithPath(schema, "");
    }
    inputWithPath(schema, path) {
        var _a;
        const override = this.findOverride(schema);
        if (override) {
            return override;
        }
        // This is an appalling hack which is required to support
        // the ZodNonEmptyArray type in Zod 3.5 and 3.6. The type was
        // removed in Zod 3.7.
        if (schema.constructor.name === "ZodNonEmptyArray") {
            const def = schema._def;
            schema = new zod_1.ZodArray(Object.assign(Object.assign({}, def), { minLength: (_a = def.minLength) !== null && _a !== void 0 ? _a : { value: 1 } }));
        }
        if (isFirstPartyType(schema)) {
            const builder = arbitraryBuilders[schema._def.typeName];
            return builder(schema, path, this.inputWithPath.bind(this));
        }
        unsupported(`'${schema.constructor.name}'`, path);
    }
    /**
     * Creates an arbitrary which will generate valid parsed outputs of
     * the schema.
     */
    outputOf(schema) {
        let inputArbitrary = this.inputOf(schema);
        // For scalar types, the input is always the same as the output,
        // so we can just use the input arbitrary unchanged.
        if (isFirstPartyType(schema) &&
            SCALAR_TYPES.has(`${schema._def.typeName}`)) {
            return inputArbitrary;
        }
        return inputArbitrary
            .map((value) => schema.safeParse(value))
            .filter(throwIfSuccessRateBelow(MIN_SUCCESS_RATE, isUnionMember({ success: true }), ""))
            .map((parsed) => parsed.data);
    }
    findOverride(schema) {
        const override = this.overrides.get(schema);
        if (override) {
            return (typeof override === "function" ? override(this) : override);
        }
        return null;
    }
    /**
     * Returns a new `ZodFastCheck` instance which will use the provided
     * arbitrary when generating inputs for the given schema.
     */
    override(schema, arbitrary) {
        const withOverride = this.clone();
        withOverride.overrides.set(schema, arbitrary);
        return withOverride;
    }
}
// Wrapper function to allow instantiation without "new"
function ZodFastCheck() {
    return new _ZodFastCheck();
}
exports.ZodFastCheck = ZodFastCheck;
// Reassign the wrapper function's prototype to ensure
// "instanceof" works as expected.
ZodFastCheck.prototype = _ZodFastCheck.prototype;
function isFirstPartyType(schema) {
    const typeName = schema._def.typeName;
    return (!!typeName &&
        Object.prototype.hasOwnProperty.call(arbitraryBuilders, typeName));
}
const arbitraryBuilders = {
    ZodString(schema, path) {
        let minLength = 0;
        let maxLength = null;
        let hasUnsupportedCheck = false;
        const mappings = [];
        for (const check of schema._def.checks) {
            switch (check.kind) {
                case "min":
                    minLength = Math.max(minLength, check.value);
                    break;
                case "max":
                    maxLength = Math.min(maxLength !== null && maxLength !== void 0 ? maxLength : Infinity, check.value);
                    break;
                case "length":
                    minLength = check.value;
                    maxLength = check.value;
                    break;
                case "startsWith":
                    mappings.push((s) => check.value + s);
                    break;
                case "endsWith":
                    mappings.push((s) => s + check.value);
                    break;
                case "trim":
                    // No special handling needed for inputs.
                    break;
                case "cuid":
                    return createCuidArb();
                case "uuid":
                    return fast_check_1.default.uuid();
                case "email":
                    return fast_check_1.default.emailAddress();
                case "url":
                    return fast_check_1.default.webUrl();
                case "datetime":
                    return createDatetimeStringArb(schema, check);
                default:
                    hasUnsupportedCheck = true;
            }
        }
        if (maxLength === null)
            maxLength = 2 * minLength + 10;
        let unfiltered = fast_check_1.default.string({
            minLength,
            maxLength,
        });
        for (let mapping of mappings) {
            unfiltered = unfiltered.map(mapping);
        }
        if (hasUnsupportedCheck) {
            return filterArbitraryBySchema(unfiltered, schema, path);
        }
        else {
            return unfiltered;
        }
    },
    ZodNumber(schema) {
        let min = Number.MIN_SAFE_INTEGER;
        let max = Number.MAX_SAFE_INTEGER;
        let isFinite = false;
        let multipleOf = null;
        for (const check of schema._def.checks) {
            switch (check.kind) {
                case "min":
                    min = Math.max(min, check.inclusive ? check.value : check.value + 0.001);
                    break;
                case "max":
                    isFinite = true;
                    max = Math.min(max, check.inclusive ? check.value : check.value - 0.001);
                    break;
                case "int":
                    multipleOf !== null && multipleOf !== void 0 ? multipleOf : (multipleOf = 1);
                    break;
                case "finite":
                    isFinite = true;
                    break;
                case "multipleOf":
                    multipleOf = (multipleOf !== null && multipleOf !== void 0 ? multipleOf : 1) * check.value;
                    break;
            }
        }
        if (multipleOf !== null) {
            const factor = multipleOf;
            return fast_check_1.default
                .integer({
                min: Math.ceil(min / factor),
                max: Math.floor(max / factor),
            })
                .map((x) => x * factor);
        }
        else {
            const finiteArb = fast_check_1.default.double({
                min,
                max,
                // fast-check 3 considers NaN to be a Number by default,
                // but Zod does not consider NaN to be a Number
                // see https://github.com/dubzzz/fast-check/blob/main/packages/fast-check/MIGRATION_2.X_TO_3.X.md#new-floating-point-arbitraries-
                noNaN: true,
            });
            if (isFinite) {
                return finiteArb;
            }
            else {
                return fast_check_1.default.oneof(finiteArb, fast_check_1.default.constant(Infinity));
            }
        }
    },
    ZodBigInt() {
        return fast_check_1.default.bigInt();
    },
    ZodBoolean() {
        return fast_check_1.default.boolean();
    },
    ZodDate() {
        return fast_check_1.default.date();
    },
    ZodUndefined() {
        return fast_check_1.default.constant(undefined);
    },
    ZodNull() {
        return fast_check_1.default.constant(null);
    },
    ZodArray(schema, path, recurse) {
        var _a, _b, _c, _d;
        const minLength = (_b = (_a = schema._def.minLength) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : 0;
        const maxLength = Math.min((_d = (_c = schema._def.maxLength) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : 10, 10);
        return fast_check_1.default.array(recurse(schema._def.type, path + "[*]"), {
            minLength,
            maxLength,
        });
    },
    ZodObject(schema, path, recurse) {
        const propertyArbitraries = objectFromEntries(Object.entries(schema._def.shape()).map(([property, propSchema]) => [
            property,
            recurse(propSchema, path + "." + property),
        ]));
        return fast_check_1.default.record(propertyArbitraries);
    },
    ZodUnion(schema, path, recurse) {
        return fast_check_1.default.oneof(...schema._def.options.map((option) => recurse(option, path)));
    },
    ZodIntersection(_, path) {
        unsupported(`Intersection`, path);
    },
    ZodTuple(schema, path, recurse) {
        return fast_check_1.default.tuple(...schema._def.items.map((item, index) => recurse(item, `${path}[${index}]`)));
    },
    ZodRecord(schema, path, recurse) {
        return fast_check_1.default.dictionary(recurse(schema._def.keyType, path), recurse(schema._def.valueType, path + "[*]"));
    },
    ZodMap(schema, path, recurse) {
        const key = recurse(schema._def.keyType, path + ".(key)");
        const value = recurse(schema._def.valueType, path + ".(value)");
        return fast_check_1.default.array(fast_check_1.default.tuple(key, value)).map((entries) => new Map(entries));
    },
    ZodSet(schema, path, recurse) {
        var _a, _b, _c, _d;
        const minLength = (_b = (_a = schema._def.minSize) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : 0;
        const maxLength = Math.min((_d = (_c = schema._def.maxSize) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : 10, 10);
        return fast_check_1.default
            .uniqueArray(recurse(schema._def.valueType, path + ".(value)"), {
            minLength,
            maxLength,
        })
            .map((members) => new Set(members));
    },
    ZodFunction(schema, path, recurse) {
        return recurse(schema._def.returns, path + ".(return type)").map((returnValue) => () => returnValue);
    },
    ZodLazy(_, path) {
        unsupported(`Lazy`, path);
    },
    ZodLiteral(schema) {
        return fast_check_1.default.constant(schema._def.value);
    },
    ZodEnum(schema) {
        return fast_check_1.default.oneof(...schema._def.values.map(fast_check_1.default.constant));
    },
    ZodNativeEnum(schema) {
        const enumValues = getValidEnumValues(schema._def.values);
        return fast_check_1.default.oneof(...enumValues.map(fast_check_1.default.constant));
    },
    ZodPromise(schema, path, recurse) {
        return recurse(schema._def.type, path + ".(resolved type)").map((value) => Promise.resolve(value));
    },
    ZodAny() {
        return fast_check_1.default.anything();
    },
    ZodUnknown() {
        return fast_check_1.default.anything();
    },
    ZodNever(_, path) {
        unsupported(`Never`, path);
    },
    ZodVoid() {
        return fast_check_1.default.constant(undefined);
    },
    ZodOptional(schema, path, recurse) {
        const nil = undefined;
        return fast_check_1.default.option(recurse(schema._def.innerType, path), {
            nil,
            freq: 2,
        });
    },
    ZodNullable(schema, path, recurse) {
        const nil = null;
        return fast_check_1.default.option(recurse(schema._def.innerType, path), {
            nil,
            freq: 2,
        });
    },
    ZodDefault(schema, path, recurse) {
        return fast_check_1.default.oneof(fast_check_1.default.constant(undefined), recurse(schema._def.innerType, path));
    },
    ZodEffects(schema, path, recurse) {
        const preEffectsArbitrary = recurse(schema._def.schema, path);
        return filterArbitraryBySchema(preEffectsArbitrary, schema, path);
    },
    ZodDiscriminatedUnion(schema, path, recurse) {
        var _a;
        // In Zod 3.18 & 3.19, the property is called "options". In later
        // versions it was renamed "optionsMap". Here we use a fallback to
        // support whichever version of Zod the user has installed.
        const optionsMap = (_a = schema._def.optionsMap) !== null && _a !== void 0 ? _a : schema._def.options;
        const keys = [...optionsMap.keys()].sort();
        return fast_check_1.default.oneof(...keys.map((discriminator) => {
            const option = optionsMap.get(discriminator);
            if (option === undefined) {
                throw new Error(`${String(discriminator)} should correspond to a variant discriminator, but it does not`);
            }
            return recurse(option, path);
        }));
    },
    ZodNaN() {
        // This should really be doing some thing like
        // Arbitrary IEEE754 NaN -> DataView -> Number (NaN)
        return fast_check_1.default.constant(Number.NaN);
    },
    ZodBranded(schema, path, recurse) {
        return recurse(schema.unwrap(), path);
    },
    ZodCatch(schema, path, recurse) {
        return fast_check_1.default.oneof(recurse(schema._def.innerType, path), fast_check_1.default.anything());
    },
    ZodPipeline(schema, path, recurse) {
        return recurse(schema._def.in, path).filter(throwIfSuccessRateBelow(MIN_SUCCESS_RATE, (value) => schema.safeParse(value).success, path));
    },
    ZodSymbol() {
        return fast_check_1.default.string().map((s) => Symbol(s));
    },
};
class ZodFastCheckError extends Error {
}
exports.ZodFastCheckError = ZodFastCheckError;
class ZodFastCheckUnsupportedSchemaError extends ZodFastCheckError {
}
exports.ZodFastCheckUnsupportedSchemaError = ZodFastCheckUnsupportedSchemaError;
class ZodFastCheckGenerationError extends ZodFastCheckError {
}
exports.ZodFastCheckGenerationError = ZodFastCheckGenerationError;
function unsupported(schemaTypeName, path) {
    throw new ZodFastCheckUnsupportedSchemaError(`Unable to generate valid values for Zod schema. ` +
        `${schemaTypeName} schemas are not supported (at path '${path || "."}').`);
}
// based on the rough spec provided here: https://github.com/paralleldrive/cuid
function createCuidArb() {
    return fast_check_1.default
        .tuple(fast_check_1.default.hexaString({ minLength: 8, maxLength: 8 }), fast_check_1.default
        .integer({ min: 0, max: 9999 })
        .map((n) => n.toString().padStart(4, "0")), fast_check_1.default.hexaString({ minLength: 4, maxLength: 4 }), fast_check_1.default.hexaString({ minLength: 8, maxLength: 8 }))
        .map(([timestamp, counter, fingerprint, random]) => "c" + timestamp + counter + fingerprint + random);
}
function createDatetimeStringArb(schema, check) {
    let arb = fast_check_1.default
        .date({
        min: new Date("0000-01-01T00:00:00Z"),
        max: new Date("9999-12-31T23:59:59Z"),
    })
        .map((date) => date.toISOString());
    if (check.precision === 0) {
        arb = arb.map((utcIsoDatetime) => utcIsoDatetime.replace(/\.\d+Z$/, `Z`));
    }
    else if (check.precision !== null) {
        const precision = check.precision;
        arb = arb.chain((utcIsoDatetime) => fast_check_1.default
            .integer({ min: 0, max: Math.pow(10, precision) - 1 })
            .map((x) => x.toString().padStart(precision, "0"))
            .map((fractionalDigits) => utcIsoDatetime.replace(/\.\d+Z$/, `.${fractionalDigits}Z`)));
    }
    if (check.offset) {
        // Add an arbitrary timezone offset on, if the schema supports it.
        // UTC−12:00 is the furthest behind UTC, UTC+14:00 is the furthest ahead.
        // This does not generate offsets for half-hour and 15 minute timezones.
        arb = arb.chain((utcIsoDatetime) => fast_check_1.default.integer({ min: -12, max: +14 }).map((offsetHours) => {
            if (offsetHours === 0) {
                return utcIsoDatetime;
            }
            else {
                const sign = offsetHours > 0 ? "+" : "-";
                const paddedHours = Math.abs(offsetHours).toString().padStart(2, "0");
                return utcIsoDatetime.replace(/Z$/, `${sign}${paddedHours}:00`);
            }
        }));
    }
    return arb;
}
/**
 * Returns a type guard which filters one member from a union type.
 */
const isUnionMember = (filter) => (value) => {
    return Object.entries(filter).every(([key, expected]) => value[key] === expected);
};
function filterArbitraryBySchema(arbitrary, schema, path) {
    return arbitrary.filter(throwIfSuccessRateBelow(MIN_SUCCESS_RATE, (value) => schema.safeParse(value).success, path));
}
function throwIfSuccessRateBelow(rate, predicate, path) {
    const MIN_RUNS = 1000;
    let successful = 0;
    let total = 0;
    return (value) => {
        const isSuccess = predicate(value);
        total += 1;
        if (isSuccess)
            successful += 1;
        if (total > MIN_RUNS && successful / total < rate) {
            throw new ZodFastCheckGenerationError("Unable to generate valid values for Zod schema. " +
                `An override is must be provided for the schema at path '${path || "."}'.`);
        }
        return isSuccess;
    };
}
function objectFromEntries(entries) {
    const object = {};
    for (let i = 0; i < entries.length; i++) {
        const [key, value] = entries[i];
        object[key] = value;
    }
    return object;
}
const getValidEnumValues = (obj) => {
    const validKeys = Object.keys(obj).filter((key) => typeof obj[obj[key]] !== "number");
    const filtered = {};
    for (const key of validKeys) {
        filtered[key] = obj[key];
    }
    return Object.values(filtered);
};

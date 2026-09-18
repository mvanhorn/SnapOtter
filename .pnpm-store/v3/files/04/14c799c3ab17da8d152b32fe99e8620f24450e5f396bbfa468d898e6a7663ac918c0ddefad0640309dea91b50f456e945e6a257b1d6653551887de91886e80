import { isObject } from '@scalar/helpers/object/is-object';
import { evaluate, intersection, object, optional, string, union } from '@scalar/validation';
import { referenceExtensions } from '../../general/bundler-extensions.js';
/**
 * AsyncAPI Reference Object (JSON Reference). Only `$ref` is defined; additional
 * properties SHALL be ignored per the specification.
 */
export const asyncApiReferenceObject = object({
    '$ref': string({ typeComment: 'REQUIRED. The reference string.' }),
}, { typeName: 'AsyncApiReferenceObject', typeComment: 'JSON Reference for AsyncAPI components.' });
const e = (value) => {
    if (isObject(value) && '$ref' in value) {
        return e(value['$ref-value']);
    }
    return value;
};
/**
 * Reference Object with resolved `$ref-value` and bundle extensions.
 *
 * Use when the specification allows only a Reference Object (not an inline object), for example
 * `operation.channel` or `channel.servers`.
 *
 * `$ref-value` is a resolved-document extension populated by the bundler/proxy at access time, so it
 * is optional here. If coercion required it, an unresolved `{ $ref }` would be filled with a default
 * instance of `schema` (for a security scheme, the first `type` literal — `userPassword`). Because the
 * magic proxy shares one target object between a `$ref-value` and the component it points at, that
 * synthetic default then leaks back over the real definition, clobbering its `type`.
 */
export const asyncApiResolvedReference = (schema) => intersection([asyncApiReferenceObject, object({ '$ref-value': optional(evaluate(e, schema)) }), referenceExtensions]);
/** Inline object or Reference Object with resolved `$ref-value`. */
export const recursiveRef = (schema) => union([schema, asyncApiResolvedReference(schema)]);

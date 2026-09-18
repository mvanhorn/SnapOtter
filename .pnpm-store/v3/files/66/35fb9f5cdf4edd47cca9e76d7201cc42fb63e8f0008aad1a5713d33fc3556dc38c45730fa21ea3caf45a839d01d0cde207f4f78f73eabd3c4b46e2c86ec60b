import { intersection, object, optional, string } from '@scalar/validation';
import { XInternal, XScalarIgnore } from '../../extensions/document/index.js';
import { XScalarOrder } from '../../extensions/general/index.js';
import { XDisplayName } from '../../extensions/tag/index.js';
import { externalDocs } from '../../openapi/3.1/external-docs.js';
export const tag = intersection([
    object({
        name: string({ typeComment: 'REQUIRED. The name of the tag.' }),
        description: optional(string({
            typeComment: 'A description for the tag. CommonMark syntax MAY be used for rich text representation.',
        })),
        externalDocs: optional(externalDocs),
    }),
    XDisplayName,
    XInternal,
    XScalarIgnore,
    XScalarOrder,
], { typeName: 'TagObject' });

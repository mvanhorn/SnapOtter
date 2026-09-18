import { NET_PEER_PORT, NET_PEER_NAME, DB_USER, DB_NAME } from '@sentry/conventions/attributes';
import { SPAN_STATUS_ERROR } from '@sentry/core';
import { ATTR_DB_MONGODB_COLLECTION } from './semconv.js';

function getAttributesFromCollection(collection) {
  return {
    // oxlint-disable-next-line typescript/no-deprecated
    [ATTR_DB_MONGODB_COLLECTION]: collection.name,
    // oxlint-disable-next-line typescript/no-deprecated
    [DB_NAME]: collection.conn.name,
    [DB_USER]: collection.conn.user,
    // oxlint-disable-next-line typescript/no-deprecated
    [NET_PEER_NAME]: collection.conn.host,
    // oxlint-disable-next-line typescript/no-deprecated
    [NET_PEER_PORT]: collection.conn.port
  };
}
function setErrorStatus(span, error) {
  span.setStatus({
    code: SPAN_STATUS_ERROR,
    message: `${error.message} ${error.code ? `
Mongoose Error Code: ${error.code}` : ""}`
  });
}
function handlePromiseResponse(execResponse, span) {
  if (!(execResponse instanceof Promise)) {
    span.end();
    return execResponse;
  }
  return execResponse.catch((err) => {
    setErrorStatus(span, err);
    throw err;
  }).finally(() => span.end());
}
function handleCallbackResponse(callback, exec, originalThis, span, args) {
  let callbackArgumentIndex = 0;
  if (args.length === 2) {
    callbackArgumentIndex = 1;
  } else if (args.length === 3) {
    callbackArgumentIndex = 2;
  }
  args[callbackArgumentIndex] = (err, response) => {
    if (err) {
      setErrorStatus(span, err);
    }
    span.end();
    return callback(err, response);
  };
  return exec.apply(originalThis, args);
}

export { getAttributesFromCollection, handleCallbackResponse, handlePromiseResponse };
//# sourceMappingURL=utils.js.map

(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/store-builder/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var _global_process, _global_process1;
module.exports = ((_global_process = /*TURBOPACK member replacement*/ __turbopack_context__.g.process) == null ? void 0 : _global_process.env) && typeof ((_global_process1 = /*TURBOPACK member replacement*/ __turbopack_context__.g.process) == null ? void 0 : _global_process1.env) === 'object' ? /*TURBOPACK member replacement*/ __turbopack_context__.g.process : __turbopack_context__.r("[project]/node_modules/next/dist/compiled/process/browser.js [app-client] (ecmascript)");
}),
"[project]/store-builder/node_modules/next/dist/build/polyfills/polyfill-module.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

"trimStart" in String.prototype || (String.prototype.trimStart = String.prototype.trimLeft), "trimEnd" in String.prototype || (String.prototype.trimEnd = String.prototype.trimRight), "description" in Symbol.prototype || Object.defineProperty(Symbol.prototype, "description", {
    configurable: !0,
    get: function() {
        var t = /\((.*)\)/.exec(this.toString());
        return t ? t[1] : void 0;
    }
}), Array.prototype.flat || (Array.prototype.flat = function(t, r) {
    return r = this.concat.apply([], this), t > 1 && r.some(Array.isArray) ? r.flat(t - 1) : r;
}, Array.prototype.flatMap = function(t, r) {
    return this.map(t, r).flat();
}), Promise.prototype.finally || (Promise.prototype.finally = function(t) {
    if ("function" != typeof t) return this.then(t, t);
    var r = this.constructor || Promise;
    return this.then(function(n) {
        return r.resolve(t()).then(function() {
            return n;
        });
    }, function(n) {
        return r.resolve(t()).then(function() {
            throw n;
        });
    });
}), Object.fromEntries || (Object.fromEntries = function(t) {
    return Array.from(t).reduce(function(t, r) {
        return t[r[0]] = r[1], t;
    }, {});
}), Array.prototype.at || (Array.prototype.at = function(t) {
    var r = Math.trunc(t) || 0;
    if (r < 0 && (r += this.length), !(r < 0 || r >= this.length)) return this[r];
}), Object.hasOwn || (Object.hasOwn = function(t, r) {
    if (null == t) throw new TypeError("Cannot convert undefined or null to object");
    return Object.prototype.hasOwnProperty.call(Object(t), r);
}), "canParse" in URL || (URL.canParse = function(t, r) {
    try {
        return !!new URL(t, r);
    } catch (t) {
        return !1;
    }
});
}),
"[project]/store-builder/node_modules/next/dist/shared/lib/invariant-error.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "InvariantError", {
    enumerable: true,
    get: function() {
        return InvariantError;
    }
});
class InvariantError extends Error {
    constructor(message, options){
        super(`Invariant: ${message.endsWith('.') ? message : message + '.'} This is a bug in Next.js.`, options);
        this.name = 'InvariantError';
    }
}
}),
"[project]/store-builder/node_modules/next/dist/shared/lib/lazy-dynamic/bailout-to-csr.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

// This has to be a shared module which is shared between client component error boundary and dynamic component
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    BailoutToCSRError: null,
    isBailoutToCSRError: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    BailoutToCSRError: function() {
        return BailoutToCSRError;
    },
    isBailoutToCSRError: function() {
        return isBailoutToCSRError;
    }
});
const BAILOUT_TO_CSR = 'BAILOUT_TO_CLIENT_SIDE_RENDERING';
class BailoutToCSRError extends Error {
    constructor(reason){
        super(`Bail out to client-side rendering: ${reason}`), this.reason = reason, this.digest = BAILOUT_TO_CSR;
    }
}
function isBailoutToCSRError(err) {
    if (typeof err !== 'object' || err === null || !('digest' in err)) {
        return false;
    }
    return err.digest === BAILOUT_TO_CSR;
}
}),
"[project]/store-builder/node_modules/next/dist/shared/lib/is-plain-object.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    getObjectClassLabel: null,
    isPlainObject: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    getObjectClassLabel: function() {
        return getObjectClassLabel;
    },
    isPlainObject: function() {
        return isPlainObject;
    }
});
function getObjectClassLabel(value) {
    return Object.prototype.toString.call(value);
}
function isPlainObject(value) {
    if (getObjectClassLabel(value) !== '[object Object]') {
        return false;
    }
    const prototype = Object.getPrototypeOf(value);
    /**
   * this used to be previously:
   *
   * `return prototype === null || prototype === Object.prototype`
   *
   * but Edge Runtime expose Object from vm, being that kind of type-checking wrongly fail.
   *
   * It was changed to the current implementation since it's resilient to serialization.
   */ return prototype === null || prototype.hasOwnProperty('isPrototypeOf');
}
}),
"[project]/store-builder/node_modules/next/dist/shared/lib/error-source.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    decorateServerError: null,
    getErrorSource: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    decorateServerError: function() {
        return decorateServerError;
    },
    getErrorSource: function() {
        return getErrorSource;
    }
});
const symbolError = Symbol.for('NextjsError');
function getErrorSource(error) {
    return error[symbolError] || null;
}
function decorateServerError(error, type) {
    Object.defineProperty(error, symbolError, {
        writable: false,
        enumerable: false,
        configurable: false,
        value: type
    });
}
}),
"[project]/store-builder/node_modules/next/dist/shared/lib/head-manager-context.shared-runtime.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$store$2d$builder$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/store-builder/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HeadManagerContext", {
    enumerable: true,
    get: function() {
        return HeadManagerContext;
    }
});
const _interop_require_default = __turbopack_context__.r("[project]/node_modules/next/node_modules/@swc/helpers/cjs/_interop_require_default.cjs [app-client] (ecmascript)");
const _react = /*#__PURE__*/ _interop_require_default._(__turbopack_context__.r("[project]/store-builder/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"));
const HeadManagerContext = _react.default.createContext({});
if ("TURBOPACK compile-time truthy", 1) {
    HeadManagerContext.displayName = 'HeadManagerContext';
}
}),
"[project]/store-builder/node_modules/next/dist/shared/lib/hooks-client-context.shared-runtime.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$store$2d$builder$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/store-builder/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    NavigationPromisesContext: null,
    PathParamsContext: null,
    PathnameContext: null,
    ReadonlyURLSearchParams: null,
    SearchParamsContext: null,
    createDevToolsInstrumentedPromise: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    NavigationPromisesContext: function() {
        return NavigationPromisesContext;
    },
    PathParamsContext: function() {
        return PathParamsContext;
    },
    PathnameContext: function() {
        return PathnameContext;
    },
    ReadonlyURLSearchParams: function() {
        return _readonlyurlsearchparams.ReadonlyURLSearchParams;
    },
    SearchParamsContext: function() {
        return SearchParamsContext;
    },
    createDevToolsInstrumentedPromise: function() {
        return createDevToolsInstrumentedPromise;
    }
});
const _react = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
const _readonlyurlsearchparams = (()=>{
    const e = new Error("Cannot find module '../../client/components/readonly-url-search-params'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const SearchParamsContext = (0, _react.createContext)(null);
const PathnameContext = (0, _react.createContext)(null);
const PathParamsContext = (0, _react.createContext)(null);
const NavigationPromisesContext = (0, _react.createContext)(null);
function createDevToolsInstrumentedPromise(displayName, value) {
    const promise = Promise.resolve(value);
    promise.status = 'fulfilled';
    promise.value = value;
    promise.displayName = `${displayName} (SSR)`;
    return promise;
}
if ("TURBOPACK compile-time truthy", 1) {
    SearchParamsContext.displayName = 'SearchParamsContext';
    PathnameContext.displayName = 'PathnameContext';
    PathParamsContext.displayName = 'PathParamsContext';
    NavigationPromisesContext.displayName = 'NavigationPromisesContext';
}
}),
"[project]/store-builder/node_modules/next/dist/shared/lib/router/utils/html-bots.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

// This regex contains the bots that we need to do a blocking render for and can't safely stream the response
// due to how they parse the DOM. For example, they might explicitly check for metadata in the `head` tag, so we can't stream metadata tags after the `head` was sent.
// Note: The pattern [\w-]+-Google captures all Google crawlers with "-Google" suffix (e.g., Mediapartners-Google, AdsBot-Google, Storebot-Google)
// as well as crawlers starting with "Google-" (e.g., Google-PageRenderer, Google-InspectionTool)
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HTML_LIMITED_BOT_UA_RE", {
    enumerable: true,
    get: function() {
        return HTML_LIMITED_BOT_UA_RE;
    }
});
const HTML_LIMITED_BOT_UA_RE = /[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight/i;
}),
"[project]/store-builder/node_modules/next/dist/shared/lib/router/utils/is-bot.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    HTML_LIMITED_BOT_UA_RE: null,
    HTML_LIMITED_BOT_UA_RE_STRING: null,
    getBotType: null,
    isBot: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    HTML_LIMITED_BOT_UA_RE: function() {
        return _htmlbots.HTML_LIMITED_BOT_UA_RE;
    },
    HTML_LIMITED_BOT_UA_RE_STRING: function() {
        return HTML_LIMITED_BOT_UA_RE_STRING;
    },
    getBotType: function() {
        return getBotType;
    },
    isBot: function() {
        return isBot;
    }
});
const _htmlbots = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/shared/lib/router/utils/html-bots.js [app-client] (ecmascript)");
// Bot crawler that will spin up a headless browser and execute JS.
// Only the main Googlebot search crawler executes JavaScript, not other Google crawlers.
// x-ref: https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers
// This regex specifically matches "Googlebot" but NOT "Mediapartners-Google", "AdsBot-Google", etc.
const HEADLESS_BROWSER_BOT_UA_RE = /Googlebot(?!-)|Googlebot$/i;
const HTML_LIMITED_BOT_UA_RE_STRING = _htmlbots.HTML_LIMITED_BOT_UA_RE.source;
function isDomBotUA(userAgent) {
    return HEADLESS_BROWSER_BOT_UA_RE.test(userAgent);
}
function isHtmlLimitedBotUA(userAgent) {
    return _htmlbots.HTML_LIMITED_BOT_UA_RE.test(userAgent);
}
function isBot(userAgent) {
    return isDomBotUA(userAgent) || isHtmlLimitedBotUA(userAgent);
}
function getBotType(userAgent) {
    if (isDomBotUA(userAgent)) {
        return 'dom';
    }
    if (isHtmlLimitedBotUA(userAgent)) {
        return 'html';
    }
    return undefined;
}
}),
"[project]/store-builder/node_modules/next/dist/shared/lib/app-router-context.shared-runtime.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$store$2d$builder$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/store-builder/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    AppRouterContext: null,
    GlobalLayoutRouterContext: null,
    LayoutRouterContext: null,
    MissingSlotContext: null,
    TemplateContext: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    AppRouterContext: function() {
        return AppRouterContext;
    },
    GlobalLayoutRouterContext: function() {
        return GlobalLayoutRouterContext;
    },
    LayoutRouterContext: function() {
        return LayoutRouterContext;
    },
    MissingSlotContext: function() {
        return MissingSlotContext;
    },
    TemplateContext: function() {
        return TemplateContext;
    }
});
const _interop_require_default = __turbopack_context__.r("[project]/node_modules/next/node_modules/@swc/helpers/cjs/_interop_require_default.cjs [app-client] (ecmascript)");
const _react = /*#__PURE__*/ _interop_require_default._(__turbopack_context__.r("[project]/store-builder/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"));
const AppRouterContext = _react.default.createContext(null);
const LayoutRouterContext = _react.default.createContext(null);
const GlobalLayoutRouterContext = _react.default.createContext(null);
const TemplateContext = _react.default.createContext(null);
if ("TURBOPACK compile-time truthy", 1) {
    AppRouterContext.displayName = 'AppRouterContext';
    LayoutRouterContext.displayName = 'LayoutRouterContext';
    GlobalLayoutRouterContext.displayName = 'GlobalLayoutRouterContext';
    TemplateContext.displayName = 'TemplateContext';
}
const MissingSlotContext = _react.default.createContext(new Set());
}),
"[project]/store-builder/node_modules/next/dist/shared/lib/is-thenable.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/**
 * Check to see if a value is Thenable.
 *
 * @param promise the maybe-thenable value
 * @returns true if the value is thenable
 */ Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "isThenable", {
    enumerable: true,
    get: function() {
        return isThenable;
    }
});
function isThenable(promise) {
    return promise !== null && typeof promise === 'object' && 'then' in promise && typeof promise.then === 'function';
}
}),
"[project]/store-builder/node_modules/next/dist/shared/lib/router/utils/parse-path.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/**
 * Given a path this function will find the pathname, query and hash and return
 * them. This is useful to parse full paths on the client side.
 * @param path A path to parse e.g. /foo/bar?id=1#hash
 */ Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "parsePath", {
    enumerable: true,
    get: function() {
        return parsePath;
    }
});
function parsePath(path) {
    const hashIndex = path.indexOf('#');
    const queryIndex = path.indexOf('?');
    const hasQuery = queryIndex > -1 && (hashIndex < 0 || queryIndex < hashIndex);
    if (hasQuery || hashIndex > -1) {
        return {
            pathname: path.substring(0, hasQuery ? queryIndex : hashIndex),
            query: hasQuery ? path.substring(queryIndex, hashIndex > -1 ? hashIndex : undefined) : '',
            hash: hashIndex > -1 ? path.slice(hashIndex) : ''
        };
    }
    return {
        pathname: path,
        query: '',
        hash: ''
    };
}
}),
"[project]/store-builder/node_modules/next/dist/shared/lib/router/utils/add-path-prefix.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "addPathPrefix", {
    enumerable: true,
    get: function() {
        return addPathPrefix;
    }
});
const _parsepath = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/shared/lib/router/utils/parse-path.js [app-client] (ecmascript)");
function addPathPrefix(path, prefix) {
    if (!path.startsWith('/') || !prefix) {
        return path;
    }
    const { pathname, query, hash } = (0, _parsepath.parsePath)(path);
    return `${prefix}${pathname}${query}${hash}`;
}
}),
"[project]/store-builder/node_modules/next/dist/shared/lib/deployment-id.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$store$2d$builder$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/store-builder/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    getAssetToken: null,
    getAssetTokenQuery: null,
    getDeploymentId: null,
    getDeploymentIdQuery: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    getAssetToken: function() {
        return getAssetToken;
    },
    getAssetTokenQuery: function() {
        return getAssetTokenQuery;
    },
    getDeploymentId: function() {
        return getDeploymentId;
    },
    getDeploymentIdQuery: function() {
        return getDeploymentIdQuery;
    }
});
let deploymentId;
if (typeof window !== 'undefined') {
    deploymentId = document.documentElement.dataset.dplId;
    // Immediately remove the attribute to prevent hydration errors (the dplId was inserted into the
    // HTML only), React isn't aware of it at all.
    delete document.documentElement.dataset.dplId;
} else {
    // Client side: replaced with globalThis.NEXT_DEPLOYMENT_ID
    // Server side: left as is or replaced with a string or replaced with false
    deploymentId = ("TURBOPACK compile-time value", false) || undefined;
}
function getDeploymentId() {
    return deploymentId;
}
function getDeploymentIdQuery(ampersand = false) {
    let id = getDeploymentId();
    if (id) {
        return `${ampersand ? '&' : '?'}dpl=${id}`;
    }
    return '';
}
function getAssetToken() {
    return ("TURBOPACK compile-time value", "") || ("TURBOPACK compile-time value", false);
}
function getAssetTokenQuery(ampersand = false) {
    let id = getAssetToken();
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return '';
}
}),
"[project]/store-builder/node_modules/next/dist/shared/lib/app-router-types.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/**
 * App Router types - Client-safe types for the Next.js App Router
 *
 * This file contains type definitions that can be safely imported
 * by both client-side and server-side code without circular dependencies.
 */ Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PrefetchHint", {
    enumerable: true,
    get: function() {
        return PrefetchHint;
    }
});
var PrefetchHint = /*#__PURE__*/ function(PrefetchHint) {
    // This segment has a runtime prefetch enabled (via unstable_instant with
    // prefetch: 'runtime'). Per-segment only, does not propagate to ancestors.
    PrefetchHint[PrefetchHint["HasRuntimePrefetch"] = 1] = "HasRuntimePrefetch";
    // This segment or one of its descendants has an instant config defined
    // (any truthy unstable_instant, regardless of prefetch mode). Propagates
    // upward so the root segment reflects the entire subtree.
    PrefetchHint[PrefetchHint["SubtreeHasInstant"] = 2] = "SubtreeHasInstant";
    // This segment itself has a loading.tsx boundary.
    PrefetchHint[PrefetchHint["SegmentHasLoadingBoundary"] = 4] = "SegmentHasLoadingBoundary";
    // A descendant segment (but not this one) has a loading.tsx boundary.
    // Propagates upward so the root reflects the entire subtree.
    PrefetchHint[PrefetchHint["SubtreeHasLoadingBoundary"] = 8] = "SubtreeHasLoadingBoundary";
    // This segment is the root layout of the application.
    PrefetchHint[PrefetchHint["IsRootLayout"] = 16] = "IsRootLayout";
    // This segment's response includes its parent's data inlined into it.
    // Set at build time by the segment size measurement pass.
    PrefetchHint[PrefetchHint["ParentInlinedIntoSelf"] = 32] = "ParentInlinedIntoSelf";
    // This segment's data is inlined into one of its children — don't fetch
    // it separately. Set at build time by the segment size measurement pass.
    PrefetchHint[PrefetchHint["InlinedIntoChild"] = 64] = "InlinedIntoChild";
    // On a __PAGE__: this page's response includes the head (metadata/viewport)
    // at the end of its SegmentPrefetch[] array.
    PrefetchHint[PrefetchHint["HeadInlinedIntoSelf"] = 128] = "HeadInlinedIntoSelf";
    // On the root hint node: the head was NOT inlined into any page — fetch
    // it separately. Absence of this bit means the head is bundled into a page.
    PrefetchHint[PrefetchHint["HeadOutlined"] = 256] = "HeadOutlined";
    return PrefetchHint;
}({});
}),
"[project]/store-builder/node_modules/next/dist/shared/lib/promise-with-resolvers.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createPromiseWithResolvers", {
    enumerable: true,
    get: function() {
        return createPromiseWithResolvers;
    }
});
function createPromiseWithResolvers() {
    // Shim of Stage 4 Promise.withResolvers proposal
    let resolve;
    let reject;
    const promise = new Promise((res, rej)=>{
        resolve = res;
        reject = rej;
    });
    return {
        resolve: resolve,
        reject: reject,
        promise
    };
}
}),
"[project]/store-builder/node_modules/next/dist/shared/lib/page-path/ensure-leading-slash.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/**
 * For a given page path, this function ensures that there is a leading slash.
 * If there is not a leading slash, one is added, otherwise it is noop.
 */ Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ensureLeadingSlash", {
    enumerable: true,
    get: function() {
        return ensureLeadingSlash;
    }
});
function ensureLeadingSlash(path) {
    return path.startsWith('/') ? path : `/${path}`;
}
}),
"[project]/store-builder/node_modules/next/dist/shared/lib/router/utils/app-paths.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    compareAppPaths: null,
    normalizeAppPath: null,
    normalizeRscURL: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    compareAppPaths: function() {
        return compareAppPaths;
    },
    normalizeAppPath: function() {
        return normalizeAppPath;
    },
    normalizeRscURL: function() {
        return normalizeRscURL;
    }
});
const _ensureleadingslash = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/shared/lib/page-path/ensure-leading-slash.js [app-client] (ecmascript)");
const _segment = (()=>{
    const e = new Error("Cannot find module '../../segment'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
function normalizeAppPath(route) {
    return (0, _ensureleadingslash.ensureLeadingSlash)(route.split('/').reduce((pathname, segment, index, segments)=>{
        // Empty segments are ignored.
        if (!segment) {
            return pathname;
        }
        // Groups are ignored.
        if ((0, _segment.isGroupSegment)(segment)) {
            return pathname;
        }
        // Parallel segments are ignored.
        if (segment[0] === '@') {
            return pathname;
        }
        // The last segment (if it's a leaf) should be ignored.
        if ((segment === 'page' || segment === 'route') && index === segments.length - 1) {
            return pathname;
        }
        return `${pathname}/${segment}`;
    }, ''));
}
function compareAppPaths(a, b) {
    const aHasSlot = a.includes('/@');
    const bHasSlot = b.includes('/@');
    if (aHasSlot && !bHasSlot) return -1;
    if (!aHasSlot && bHasSlot) return 1;
    return a.localeCompare(b);
}
function normalizeRscURL(url) {
    return url.replace(/\.rsc($|\?)/, '$1');
}
}),
"[project]/store-builder/node_modules/next/dist/shared/lib/router/utils/interception-routes.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    INTERCEPTION_ROUTE_MARKERS: null,
    extractInterceptionRouteInformation: null,
    isInterceptionRouteAppPath: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    INTERCEPTION_ROUTE_MARKERS: function() {
        return INTERCEPTION_ROUTE_MARKERS;
    },
    extractInterceptionRouteInformation: function() {
        return extractInterceptionRouteInformation;
    },
    isInterceptionRouteAppPath: function() {
        return isInterceptionRouteAppPath;
    }
});
const _apppaths = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/shared/lib/router/utils/app-paths.js [app-client] (ecmascript)");
const INTERCEPTION_ROUTE_MARKERS = [
    '(..)(..)',
    '(.)',
    '(..)',
    '(...)'
];
function isInterceptionRouteAppPath(path) {
    // TODO-APP: add more serious validation
    return path.split('/').find((segment)=>INTERCEPTION_ROUTE_MARKERS.find((m)=>segment.startsWith(m))) !== undefined;
}
function extractInterceptionRouteInformation(path) {
    let interceptingRoute;
    let marker;
    let interceptedRoute;
    for (const segment of path.split('/')){
        marker = INTERCEPTION_ROUTE_MARKERS.find((m)=>segment.startsWith(m));
        if (marker) {
            ;
            [interceptingRoute, interceptedRoute] = path.split(marker, 2);
            break;
        }
    }
    if (!interceptingRoute || !marker || !interceptedRoute) {
        throw Object.defineProperty(new Error(`Invalid interception route: ${path}. Must be in the format /<intercepting route>/(..|...|..)(..)/<intercepted route>`), "__NEXT_ERROR_CODE", {
            value: "E269",
            enumerable: false,
            configurable: true
        });
    }
    interceptingRoute = (0, _apppaths.normalizeAppPath)(interceptingRoute) // normalize the path, e.g. /(blog)/feed -> /feed
    ;
    switch(marker){
        case '(.)':
            // (.) indicates that we should match with sibling routes, so we just need to append the intercepted route to the intercepting route
            if (interceptingRoute === '/') {
                interceptedRoute = `/${interceptedRoute}`;
            } else {
                interceptedRoute = interceptingRoute + '/' + interceptedRoute;
            }
            break;
        case '(..)':
            // (..) indicates that we should match at one level up, so we need to remove the last segment of the intercepting route
            if (interceptingRoute === '/') {
                throw Object.defineProperty(new Error(`Invalid interception route: ${path}. Cannot use (..) marker at the root level, use (.) instead.`), "__NEXT_ERROR_CODE", {
                    value: "E207",
                    enumerable: false,
                    configurable: true
                });
            }
            interceptedRoute = interceptingRoute.split('/').slice(0, -1).concat(interceptedRoute).join('/');
            break;
        case '(...)':
            // (...) will match the route segment in the root directory, so we need to use the root directory to prepend the intercepted route
            interceptedRoute = '/' + interceptedRoute;
            break;
        case '(..)(..)':
            // (..)(..) indicates that we should match at two levels up, so we need to remove the last two segments of the intercepting route
            const splitInterceptingRoute = interceptingRoute.split('/');
            if (splitInterceptingRoute.length <= 2) {
                throw Object.defineProperty(new Error(`Invalid interception route: ${path}. Cannot use (..)(..) marker at the root level or one level up.`), "__NEXT_ERROR_CODE", {
                    value: "E486",
                    enumerable: false,
                    configurable: true
                });
            }
            interceptedRoute = splitInterceptingRoute.slice(0, -2).concat(interceptedRoute).join('/');
            break;
        default:
            throw Object.defineProperty(new Error('Invariant: unexpected marker'), "__NEXT_ERROR_CODE", {
                value: "E112",
                enumerable: false,
                configurable: true
            });
    }
    return {
        interceptingRoute,
        interceptedRoute
    };
}
}),
"[project]/store-builder/node_modules/next/dist/shared/lib/router/utils/path-has-prefix.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "pathHasPrefix", {
    enumerable: true,
    get: function() {
        return pathHasPrefix;
    }
});
const _parsepath = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/shared/lib/router/utils/parse-path.js [app-client] (ecmascript)");
function pathHasPrefix(path, prefix) {
    if (typeof path !== 'string') {
        return false;
    }
    const { pathname } = (0, _parsepath.parsePath)(path);
    return pathname === prefix || pathname.startsWith(prefix + '/');
}
}),
"[project]/store-builder/node_modules/next/dist/shared/lib/format-webpack-messages.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$store$2d$builder$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/store-builder/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
/**
MIT License

Copyright (c) 2015-present, Facebook, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return formatWebpackMessages;
    }
});
const _interop_require_default = __turbopack_context__.r("[project]/node_modules/next/node_modules/@swc/helpers/cjs/_interop_require_default.cjs [app-client] (ecmascript)");
const _stripansi = /*#__PURE__*/ _interop_require_default._(__turbopack_context__.r("[project]/store-builder/node_modules/next/dist/compiled/strip-ansi/index.js [app-client] (ecmascript)"));
// This file is based on https://github.com/facebook/create-react-app/blob/7b1a32be6ec9f99a6c9a3c66813f3ac09c4736b9/packages/react-dev-utils/formatWebpackMessages.js
// It's been edited to remove chalk and CRA-specific logic
const friendlySyntaxErrorLabel = 'Syntax error:';
const WEBPACK_BREAKING_CHANGE_POLYFILLS = '\n\nBREAKING CHANGE: webpack < 5 used to include polyfills for node.js core modules by default.';
function isLikelyASyntaxError(message) {
    return (0, _stripansi.default)(message).includes(friendlySyntaxErrorLabel);
}
let hadMissingSassError = false;
// Cleans up webpack error messages.
function formatMessage(message, verbose, importTraceNote) {
    // TODO: Replace this once webpack 5 is stable
    if (typeof message === 'object' && message.message) {
        const filteredModuleTrace = message.moduleTrace && message.moduleTrace.filter((trace)=>!/next-(middleware|client-pages|route|edge-function)-loader\.js/.test(trace.originName));
        let body = message.message;
        const breakingChangeIndex = body.indexOf(WEBPACK_BREAKING_CHANGE_POLYFILLS);
        if (breakingChangeIndex >= 0) {
            body = body.slice(0, breakingChangeIndex);
        }
        // TODO: Rspack currently doesn't populate moduleName correctly in some cases,
        // fall back to moduleIdentifier as a workaround
        if (__TURBOPACK__imported__module__$5b$project$5d2f$store$2d$builder$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_RSPACK && !message.moduleName && !message.file && message.moduleIdentifier) {
            const parts = message.moduleIdentifier.split('!');
            message.moduleName = parts[parts.length - 1];
        }
        message = (message.moduleName ? (0, _stripansi.default)(message.moduleName) + '\n' : '') + (message.file ? (0, _stripansi.default)(message.file) + '\n' : '') + body + (message.details && verbose ? '\n' + message.details : '') + (filteredModuleTrace && filteredModuleTrace.length ? (importTraceNote || '\n\nImport trace for requested module:') + filteredModuleTrace.map((trace)=>`\n${trace.moduleName}`).join('') : '') + (message.stack && verbose ? '\n' + message.stack : '');
    }
    let lines = message.split('\n');
    // Extract loader paths from Webpack-added headers and move them to end.
    // Original format: "Module build failed (from ./loaders/foo-loader.js):"
    // The header line is removed and the path is appended at the end as:
    //   "  (from ./loaders/foo-loader.js)"
    // https://github.com/webpack/webpack/blob/master/lib/ModuleError.js
    const loaderPaths = [];
    lines = lines.filter((line)=>{
        const match = /Module [A-z ]+\(from (.+)\):?\s*$/.exec(line);
        if (match) {
            loaderPaths.push(match[1]);
            return false;
        }
        return true;
    });
    // Transform parsing error into syntax error
    // TODO: move this to our ESLint formatter?
    lines = lines.map((line)=>{
        const parsingError = /Line (\d+):(?:(\d+):)?\s*Parsing error: (.+)$/.exec(line);
        if (!parsingError) {
            return line;
        }
        const [, errorLine, errorColumn, errorMessage] = parsingError;
        return `${friendlySyntaxErrorLabel} ${errorMessage} (${errorLine}:${errorColumn})`;
    });
    message = lines.join('\n');
    // Smoosh syntax errors (commonly found in CSS)
    message = message.replace(/SyntaxError\s+\((\d+):(\d+)\)\s*(.+?)\n/g, `${friendlySyntaxErrorLabel} $3 ($1:$2)\n`);
    // Clean up export errors
    message = message.replace(/^.*export '(.+?)' was not found in '(.+?)'.*$/gm, `Attempted import error: '$1' is not exported from '$2'.`);
    message = message.replace(/^.*export 'default' \(imported as '(.+?)'\) was not found in '(.+?)'.*$/gm, `Attempted import error: '$2' does not contain a default export (imported as '$1').`);
    message = message.replace(/^.*export '(.+?)' \(imported as '(.+?)'\) was not found in '(.+?)'.*$/gm, `Attempted import error: '$1' is not exported from '$3' (imported as '$2').`);
    lines = message.split('\n');
    // Remove leading newline
    if (lines.length > 2 && lines[1].trim() === '') {
        lines.splice(1, 1);
    }
    // Cleans up verbose "module not found" messages for files and packages.
    if (lines[1] && lines[1].startsWith('Module not found: ')) {
        lines = [
            lines[0],
            lines[1].replace('Error: ', '').replace('Module not found: Cannot find file:', 'Cannot find file:'),
            ...lines.slice(2)
        ];
    }
    // Add helpful message for users trying to use Sass for the first time
    if (lines[1] && lines[1].match(/Cannot find module.+sass/)) {
        // ./file.module.scss (<<loader info>>) => ./file.module.scss
        const firstLine = lines[0].split('!');
        lines[0] = firstLine[firstLine.length - 1];
        lines[1] = "To use Next.js' built-in Sass support, you first need to install `sass`.\n";
        lines[1] += 'Run `npm i sass` or `yarn add sass` inside your workspace.\n';
        lines[1] += '\nLearn more: https://nextjs.org/docs/messages/install-sass';
        // dispose of unhelpful stack trace
        lines = lines.slice(0, 2);
        hadMissingSassError = true;
    } else if (hadMissingSassError && message.match(/(sass-loader|resolve-url-loader: CSS error)/)) {
        // dispose of unhelpful stack trace following missing sass module
        lines = [];
    }
    if (!verbose) {
        message = lines.join('\n');
        // Internal stacks are generally useless so we strip them... with the
        // exception of stacks containing `webpack:` because they're normally
        // from user code generated by Webpack. For more information see
        // https://github.com/facebook/create-react-app/pull/1050
        message = message.replace(/^\s*at\s((?!webpack:).)*:\d+:\d+[\s)]*(\n|$)/gm, '') // at ... ...:x:y
        ;
        message = message.replace(/^\s*at\s<anonymous>(\n|$)/gm, '') // at <anonymous>
        ;
        message = message.replace(/File was processed with these loaders:\n(.+[\\/](next[\\/]dist[\\/].+|@next[\\/]react-refresh-utils[\\/]loader)\.js\n)*You may need an additional loader to handle the result of these loaders.\n/g, '');
        lines = message.split('\n');
    }
    // Append loader paths at the end (before any remaining stack trace)
    if (loaderPaths.length > 0) {
        for (const loaderPath of loaderPaths){
            // Don't show internal Next.js loader paths — they're noise for users
            if (!/[/\\]next[/\\]dist[/\\]/.test(loaderPath)) {
                lines.push(`  (from ${loaderPath})`);
            }
        }
    }
    // Remove duplicated newlines
    lines = lines.filter((line, index, arr)=>index === 0 || line.trim() !== '' || line.trim() !== arr[index - 1].trim());
    // Reassemble the message
    message = lines.join('\n');
    return message.trim();
}
function formatWebpackMessages(json, verbose) {
    const formattedErrors = json.errors.map((message)=>{
        const isUnknownNextFontError = message.message.includes('An error occurred in `next/font`.');
        return formatMessage(message, isUnknownNextFontError || verbose);
    });
    const formattedWarnings = json.warnings.map((message)=>{
        return formatMessage(message, verbose);
    });
    // Reorder errors to put the most relevant ones first.
    let reactServerComponentsError = -1;
    for(let i = 0; i < formattedErrors.length; i++){
        const error = formattedErrors[i];
        if (error.includes('ReactServerComponentsError')) {
            reactServerComponentsError = i;
            break;
        }
    }
    // Move the reactServerComponentsError to the top if it exists
    if (reactServerComponentsError !== -1) {
        const error = formattedErrors.splice(reactServerComponentsError, 1);
        formattedErrors.unshift(error[0]);
    }
    const result = {
        ...json,
        errors: formattedErrors,
        warnings: formattedWarnings
    };
    if (!verbose && result.errors.some(isLikelyASyntaxError)) {
        // If there are any syntax errors, show just them.
        result.errors = result.errors.filter(isLikelyASyntaxError);
        result.warnings = [];
    }
    return result;
}
}),
"[project]/store-builder/node_modules/next/dist/lib/is-error.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$store$2d$builder$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/store-builder/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    default: null,
    getProperError: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    /**
 * Checks whether the given value is a NextError.
 * This can be used to print a more detailed error message with properties like `code` & `digest`.
 */ default: function() {
        return isError;
    },
    getProperError: function() {
        return getProperError;
    }
});
const _isplainobject = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/shared/lib/is-plain-object.js [app-client] (ecmascript)");
/**
 * This is a safe stringify function that handles circular references.
 * We're using a simpler version here to avoid introducing
 * the dependency `safe-stable-stringify` into production bundle.
 *
 * This helper is used both in development and production.
 */ function safeStringifyLite(obj) {
    const seen = new WeakSet();
    return JSON.stringify(obj, (_key, value)=>{
        // If value is an object and already seen, replace with "[Circular]"
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return '[Circular]';
            }
            seen.add(value);
        }
        return value;
    });
}
function isError(err) {
    return typeof err === 'object' && err !== null && 'name' in err && 'message' in err;
}
function getProperError(err) {
    if (isError(err)) {
        return err;
    }
    if ("TURBOPACK compile-time truthy", 1) {
        // provide better error for case where `throw undefined`
        // is called in development
        if (typeof err === 'undefined') {
            return Object.defineProperty(new Error('An undefined error was thrown, ' + 'see here for more info: https://nextjs.org/docs/messages/threw-undefined'), "__NEXT_ERROR_CODE", {
                value: "E98",
                enumerable: false,
                configurable: true
            });
        }
        if (err === null) {
            return Object.defineProperty(new Error('A null error was thrown, ' + 'see here for more info: https://nextjs.org/docs/messages/threw-undefined'), "__NEXT_ERROR_CODE", {
                value: "E336",
                enumerable: false,
                configurable: true
            });
        }
    }
    return Object.defineProperty(new Error((0, _isplainobject.isPlainObject)(err) ? safeStringifyLite(err) : err + ''), "__NEXT_ERROR_CODE", {
        value: "E394",
        enumerable: false,
        configurable: true
    });
}
}),
"[project]/store-builder/node_modules/next/dist/lib/constants.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    ACTION_SUFFIX: null,
    APP_DIR_ALIAS: null,
    CACHE_ONE_YEAR_SECONDS: null,
    DOT_NEXT_ALIAS: null,
    ESLINT_DEFAULT_DIRS: null,
    GSP_NO_RETURNED_VALUE: null,
    GSSP_COMPONENT_MEMBER_ERROR: null,
    GSSP_NO_RETURNED_VALUE: null,
    HTML_CONTENT_TYPE_HEADER: null,
    INFINITE_CACHE: null,
    INSTRUMENTATION_HOOK_FILENAME: null,
    JSON_CONTENT_TYPE_HEADER: null,
    MATCHED_PATH_HEADER: null,
    MIDDLEWARE_FILENAME: null,
    MIDDLEWARE_LOCATION_REGEXP: null,
    NEXT_BODY_SUFFIX: null,
    NEXT_CACHE_IMPLICIT_TAG_ID: null,
    NEXT_CACHE_REVALIDATED_TAGS_HEADER: null,
    NEXT_CACHE_REVALIDATE_TAG_TOKEN_HEADER: null,
    NEXT_CACHE_ROOT_PARAM_TAG_ID: null,
    NEXT_CACHE_SOFT_TAG_MAX_LENGTH: null,
    NEXT_CACHE_TAGS_HEADER: null,
    NEXT_CACHE_TAG_MAX_ITEMS: null,
    NEXT_CACHE_TAG_MAX_LENGTH: null,
    NEXT_DATA_SUFFIX: null,
    NEXT_INTERCEPTION_MARKER_PREFIX: null,
    NEXT_META_SUFFIX: null,
    NEXT_NAV_DEPLOYMENT_ID_HEADER: null,
    NEXT_QUERY_PARAM_PREFIX: null,
    NEXT_RESUME_HEADER: null,
    NEXT_RESUME_STATE_LENGTH_HEADER: null,
    NON_STANDARD_NODE_ENV: null,
    PAGES_DIR_ALIAS: null,
    PRERENDER_REVALIDATE_HEADER: null,
    PRERENDER_REVALIDATE_ONLY_GENERATED_HEADER: null,
    PROXY_FILENAME: null,
    PROXY_LOCATION_REGEXP: null,
    PUBLIC_DIR_MIDDLEWARE_CONFLICT: null,
    ROOT_DIR_ALIAS: null,
    RSC_ACTION_CLIENT_WRAPPER_ALIAS: null,
    RSC_ACTION_ENCRYPTION_ALIAS: null,
    RSC_ACTION_PROXY_ALIAS: null,
    RSC_ACTION_VALIDATE_ALIAS: null,
    RSC_CACHE_WRAPPER_ALIAS: null,
    RSC_DYNAMIC_IMPORT_WRAPPER_ALIAS: null,
    RSC_MOD_REF_PROXY_ALIAS: null,
    RSC_SEGMENTS_DIR_SUFFIX: null,
    RSC_SEGMENT_SUFFIX: null,
    RSC_SUFFIX: null,
    SERVER_PROPS_EXPORT_ERROR: null,
    SERVER_PROPS_GET_INIT_PROPS_CONFLICT: null,
    SERVER_PROPS_SSG_CONFLICT: null,
    SERVER_RUNTIME: null,
    SSG_FALLBACK_EXPORT_ERROR: null,
    SSG_GET_INITIAL_PROPS_CONFLICT: null,
    STATIC_STATUS_PAGE_GET_INITIAL_PROPS_ERROR: null,
    TEXT_PLAIN_CONTENT_TYPE_HEADER: null,
    UNSTABLE_REVALIDATE_RENAME_ERROR: null,
    WEBPACK_LAYERS: null,
    WEBPACK_RESOURCE_QUERIES: null,
    WEB_SOCKET_MAX_RECONNECTIONS: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    ACTION_SUFFIX: function() {
        return ACTION_SUFFIX;
    },
    APP_DIR_ALIAS: function() {
        return APP_DIR_ALIAS;
    },
    CACHE_ONE_YEAR_SECONDS: function() {
        return CACHE_ONE_YEAR_SECONDS;
    },
    DOT_NEXT_ALIAS: function() {
        return DOT_NEXT_ALIAS;
    },
    ESLINT_DEFAULT_DIRS: function() {
        return ESLINT_DEFAULT_DIRS;
    },
    GSP_NO_RETURNED_VALUE: function() {
        return GSP_NO_RETURNED_VALUE;
    },
    GSSP_COMPONENT_MEMBER_ERROR: function() {
        return GSSP_COMPONENT_MEMBER_ERROR;
    },
    GSSP_NO_RETURNED_VALUE: function() {
        return GSSP_NO_RETURNED_VALUE;
    },
    HTML_CONTENT_TYPE_HEADER: function() {
        return HTML_CONTENT_TYPE_HEADER;
    },
    INFINITE_CACHE: function() {
        return INFINITE_CACHE;
    },
    INSTRUMENTATION_HOOK_FILENAME: function() {
        return INSTRUMENTATION_HOOK_FILENAME;
    },
    JSON_CONTENT_TYPE_HEADER: function() {
        return JSON_CONTENT_TYPE_HEADER;
    },
    MATCHED_PATH_HEADER: function() {
        return MATCHED_PATH_HEADER;
    },
    MIDDLEWARE_FILENAME: function() {
        return MIDDLEWARE_FILENAME;
    },
    MIDDLEWARE_LOCATION_REGEXP: function() {
        return MIDDLEWARE_LOCATION_REGEXP;
    },
    NEXT_BODY_SUFFIX: function() {
        return NEXT_BODY_SUFFIX;
    },
    NEXT_CACHE_IMPLICIT_TAG_ID: function() {
        return NEXT_CACHE_IMPLICIT_TAG_ID;
    },
    NEXT_CACHE_REVALIDATED_TAGS_HEADER: function() {
        return NEXT_CACHE_REVALIDATED_TAGS_HEADER;
    },
    NEXT_CACHE_REVALIDATE_TAG_TOKEN_HEADER: function() {
        return NEXT_CACHE_REVALIDATE_TAG_TOKEN_HEADER;
    },
    NEXT_CACHE_ROOT_PARAM_TAG_ID: function() {
        return NEXT_CACHE_ROOT_PARAM_TAG_ID;
    },
    NEXT_CACHE_SOFT_TAG_MAX_LENGTH: function() {
        return NEXT_CACHE_SOFT_TAG_MAX_LENGTH;
    },
    NEXT_CACHE_TAGS_HEADER: function() {
        return NEXT_CACHE_TAGS_HEADER;
    },
    NEXT_CACHE_TAG_MAX_ITEMS: function() {
        return NEXT_CACHE_TAG_MAX_ITEMS;
    },
    NEXT_CACHE_TAG_MAX_LENGTH: function() {
        return NEXT_CACHE_TAG_MAX_LENGTH;
    },
    NEXT_DATA_SUFFIX: function() {
        return NEXT_DATA_SUFFIX;
    },
    NEXT_INTERCEPTION_MARKER_PREFIX: function() {
        return NEXT_INTERCEPTION_MARKER_PREFIX;
    },
    NEXT_META_SUFFIX: function() {
        return NEXT_META_SUFFIX;
    },
    NEXT_NAV_DEPLOYMENT_ID_HEADER: function() {
        return NEXT_NAV_DEPLOYMENT_ID_HEADER;
    },
    NEXT_QUERY_PARAM_PREFIX: function() {
        return NEXT_QUERY_PARAM_PREFIX;
    },
    NEXT_RESUME_HEADER: function() {
        return NEXT_RESUME_HEADER;
    },
    NEXT_RESUME_STATE_LENGTH_HEADER: function() {
        return NEXT_RESUME_STATE_LENGTH_HEADER;
    },
    NON_STANDARD_NODE_ENV: function() {
        return NON_STANDARD_NODE_ENV;
    },
    PAGES_DIR_ALIAS: function() {
        return PAGES_DIR_ALIAS;
    },
    PRERENDER_REVALIDATE_HEADER: function() {
        return PRERENDER_REVALIDATE_HEADER;
    },
    PRERENDER_REVALIDATE_ONLY_GENERATED_HEADER: function() {
        return PRERENDER_REVALIDATE_ONLY_GENERATED_HEADER;
    },
    PROXY_FILENAME: function() {
        return PROXY_FILENAME;
    },
    PROXY_LOCATION_REGEXP: function() {
        return PROXY_LOCATION_REGEXP;
    },
    PUBLIC_DIR_MIDDLEWARE_CONFLICT: function() {
        return PUBLIC_DIR_MIDDLEWARE_CONFLICT;
    },
    ROOT_DIR_ALIAS: function() {
        return ROOT_DIR_ALIAS;
    },
    RSC_ACTION_CLIENT_WRAPPER_ALIAS: function() {
        return RSC_ACTION_CLIENT_WRAPPER_ALIAS;
    },
    RSC_ACTION_ENCRYPTION_ALIAS: function() {
        return RSC_ACTION_ENCRYPTION_ALIAS;
    },
    RSC_ACTION_PROXY_ALIAS: function() {
        return RSC_ACTION_PROXY_ALIAS;
    },
    RSC_ACTION_VALIDATE_ALIAS: function() {
        return RSC_ACTION_VALIDATE_ALIAS;
    },
    RSC_CACHE_WRAPPER_ALIAS: function() {
        return RSC_CACHE_WRAPPER_ALIAS;
    },
    RSC_DYNAMIC_IMPORT_WRAPPER_ALIAS: function() {
        return RSC_DYNAMIC_IMPORT_WRAPPER_ALIAS;
    },
    RSC_MOD_REF_PROXY_ALIAS: function() {
        return RSC_MOD_REF_PROXY_ALIAS;
    },
    RSC_SEGMENTS_DIR_SUFFIX: function() {
        return RSC_SEGMENTS_DIR_SUFFIX;
    },
    RSC_SEGMENT_SUFFIX: function() {
        return RSC_SEGMENT_SUFFIX;
    },
    RSC_SUFFIX: function() {
        return RSC_SUFFIX;
    },
    SERVER_PROPS_EXPORT_ERROR: function() {
        return SERVER_PROPS_EXPORT_ERROR;
    },
    SERVER_PROPS_GET_INIT_PROPS_CONFLICT: function() {
        return SERVER_PROPS_GET_INIT_PROPS_CONFLICT;
    },
    SERVER_PROPS_SSG_CONFLICT: function() {
        return SERVER_PROPS_SSG_CONFLICT;
    },
    SERVER_RUNTIME: function() {
        return SERVER_RUNTIME;
    },
    SSG_FALLBACK_EXPORT_ERROR: function() {
        return SSG_FALLBACK_EXPORT_ERROR;
    },
    SSG_GET_INITIAL_PROPS_CONFLICT: function() {
        return SSG_GET_INITIAL_PROPS_CONFLICT;
    },
    STATIC_STATUS_PAGE_GET_INITIAL_PROPS_ERROR: function() {
        return STATIC_STATUS_PAGE_GET_INITIAL_PROPS_ERROR;
    },
    TEXT_PLAIN_CONTENT_TYPE_HEADER: function() {
        return TEXT_PLAIN_CONTENT_TYPE_HEADER;
    },
    UNSTABLE_REVALIDATE_RENAME_ERROR: function() {
        return UNSTABLE_REVALIDATE_RENAME_ERROR;
    },
    WEBPACK_LAYERS: function() {
        return WEBPACK_LAYERS;
    },
    WEBPACK_RESOURCE_QUERIES: function() {
        return WEBPACK_RESOURCE_QUERIES;
    },
    WEB_SOCKET_MAX_RECONNECTIONS: function() {
        return WEB_SOCKET_MAX_RECONNECTIONS;
    }
});
const TEXT_PLAIN_CONTENT_TYPE_HEADER = 'text/plain';
const HTML_CONTENT_TYPE_HEADER = 'text/html; charset=utf-8';
const JSON_CONTENT_TYPE_HEADER = 'application/json; charset=utf-8';
const NEXT_QUERY_PARAM_PREFIX = 'nxtP';
const NEXT_INTERCEPTION_MARKER_PREFIX = 'nxtI';
const MATCHED_PATH_HEADER = 'x-matched-path';
const PRERENDER_REVALIDATE_HEADER = 'x-prerender-revalidate';
const PRERENDER_REVALIDATE_ONLY_GENERATED_HEADER = 'x-prerender-revalidate-if-generated';
const RSC_SEGMENTS_DIR_SUFFIX = '.segments';
const RSC_SEGMENT_SUFFIX = '.segment.rsc';
const RSC_SUFFIX = '.rsc';
const ACTION_SUFFIX = '.action';
const NEXT_DATA_SUFFIX = '.json';
const NEXT_META_SUFFIX = '.meta';
const NEXT_BODY_SUFFIX = '.body';
const NEXT_NAV_DEPLOYMENT_ID_HEADER = 'x-nextjs-deployment-id';
const NEXT_CACHE_TAGS_HEADER = 'x-next-cache-tags';
const NEXT_CACHE_REVALIDATED_TAGS_HEADER = 'x-next-revalidated-tags';
const NEXT_CACHE_REVALIDATE_TAG_TOKEN_HEADER = 'x-next-revalidate-tag-token';
const NEXT_RESUME_HEADER = 'next-resume';
const NEXT_RESUME_STATE_LENGTH_HEADER = 'x-next-resume-state-length';
const NEXT_CACHE_TAG_MAX_ITEMS = 128;
const NEXT_CACHE_TAG_MAX_LENGTH = 256;
const NEXT_CACHE_SOFT_TAG_MAX_LENGTH = 1024;
const NEXT_CACHE_IMPLICIT_TAG_ID = '_N_T_';
const NEXT_CACHE_ROOT_PARAM_TAG_ID = '_N_RP_';
const CACHE_ONE_YEAR_SECONDS = 31536000;
const INFINITE_CACHE = 0xfffffffe;
const MIDDLEWARE_FILENAME = 'middleware';
const MIDDLEWARE_LOCATION_REGEXP = `(?:src/)?${MIDDLEWARE_FILENAME}`;
const PROXY_FILENAME = 'proxy';
const PROXY_LOCATION_REGEXP = `(?:src/)?${PROXY_FILENAME}`;
const INSTRUMENTATION_HOOK_FILENAME = 'instrumentation';
const PAGES_DIR_ALIAS = 'private-next-pages';
const DOT_NEXT_ALIAS = 'private-dot-next';
const ROOT_DIR_ALIAS = 'private-next-root-dir';
const APP_DIR_ALIAS = 'private-next-app-dir';
const RSC_MOD_REF_PROXY_ALIAS = 'private-next-rsc-mod-ref-proxy';
const RSC_ACTION_VALIDATE_ALIAS = 'private-next-rsc-action-validate';
const RSC_ACTION_PROXY_ALIAS = 'private-next-rsc-server-reference';
const RSC_CACHE_WRAPPER_ALIAS = 'private-next-rsc-cache-wrapper';
const RSC_DYNAMIC_IMPORT_WRAPPER_ALIAS = 'private-next-rsc-track-dynamic-import';
const RSC_ACTION_ENCRYPTION_ALIAS = 'private-next-rsc-action-encryption';
const RSC_ACTION_CLIENT_WRAPPER_ALIAS = 'private-next-rsc-action-client-wrapper';
const PUBLIC_DIR_MIDDLEWARE_CONFLICT = `You can not have a '_next' folder inside of your public folder. This conflicts with the internal '/_next' route. https://nextjs.org/docs/messages/public-next-folder-conflict`;
const SSG_GET_INITIAL_PROPS_CONFLICT = `You can not use getInitialProps with getStaticProps. To use SSG, please remove your getInitialProps`;
const SERVER_PROPS_GET_INIT_PROPS_CONFLICT = `You can not use getInitialProps with getServerSideProps. Please remove getInitialProps.`;
const SERVER_PROPS_SSG_CONFLICT = `You can not use getStaticProps or getStaticPaths with getServerSideProps. To use SSG, please remove getServerSideProps`;
const STATIC_STATUS_PAGE_GET_INITIAL_PROPS_ERROR = `can not have getInitialProps/getServerSideProps, https://nextjs.org/docs/messages/404-get-initial-props`;
const SERVER_PROPS_EXPORT_ERROR = `pages with \`getServerSideProps\` can not be exported. See more info here: https://nextjs.org/docs/messages/gssp-export`;
const GSP_NO_RETURNED_VALUE = 'Your `getStaticProps` function did not return an object. Did you forget to add a `return`?';
const GSSP_NO_RETURNED_VALUE = 'Your `getServerSideProps` function did not return an object. Did you forget to add a `return`?';
const UNSTABLE_REVALIDATE_RENAME_ERROR = 'The `unstable_revalidate` property is available for general use.\n' + 'Please use `revalidate` instead.';
const GSSP_COMPONENT_MEMBER_ERROR = `can not be attached to a page's component and must be exported from the page. See more info here: https://nextjs.org/docs/messages/gssp-component-member`;
const NON_STANDARD_NODE_ENV = `You are using a non-standard "NODE_ENV" value in your environment. This creates inconsistencies in the project and is strongly advised against. Read more: https://nextjs.org/docs/messages/non-standard-node-env`;
const SSG_FALLBACK_EXPORT_ERROR = `Pages with \`fallback\` enabled in \`getStaticPaths\` can not be exported. See more info here: https://nextjs.org/docs/messages/ssg-fallback-true-export`;
const ESLINT_DEFAULT_DIRS = [
    'app',
    'pages',
    'components',
    'lib',
    'src'
];
const SERVER_RUNTIME = {
    edge: 'edge',
    experimentalEdge: 'experimental-edge',
    nodejs: 'nodejs'
};
const WEB_SOCKET_MAX_RECONNECTIONS = 12;
/**
 * The names of the webpack layers. These layers are the primitives for the
 * webpack chunks.
 */ const WEBPACK_LAYERS_NAMES = {
    /**
   * The layer for the shared code between the client and server bundles.
   */ shared: 'shared',
    /**
   * The layer for server-only runtime and picking up `react-server` export conditions.
   * Including app router RSC pages and app router custom routes and metadata routes.
   */ reactServerComponents: 'rsc',
    /**
   * Server Side Rendering layer for app (ssr).
   */ serverSideRendering: 'ssr',
    /**
   * The browser client bundle layer for actions.
   */ actionBrowser: 'action-browser',
    /**
   * The Node.js bundle layer for the API routes.
   */ apiNode: 'api-node',
    /**
   * The Edge Lite bundle layer for the API routes.
   */ apiEdge: 'api-edge',
    /**
   * The layer for the middleware code.
   */ middleware: 'middleware',
    /**
   * The layer for the instrumentation hooks.
   */ instrument: 'instrument',
    /**
   * The layer for assets on the edge.
   */ edgeAsset: 'edge-asset',
    /**
   * The browser client bundle layer for App directory.
   */ appPagesBrowser: 'app-pages-browser',
    /**
   * The browser client bundle layer for Pages directory.
   */ pagesDirBrowser: 'pages-dir-browser',
    /**
   * The Edge Lite bundle layer for Pages directory.
   */ pagesDirEdge: 'pages-dir-edge',
    /**
   * The Node.js bundle layer for Pages directory.
   */ pagesDirNode: 'pages-dir-node'
};
const WEBPACK_LAYERS = {
    ...WEBPACK_LAYERS_NAMES,
    GROUP: {
        builtinReact: [
            WEBPACK_LAYERS_NAMES.reactServerComponents,
            WEBPACK_LAYERS_NAMES.actionBrowser
        ],
        serverOnly: [
            WEBPACK_LAYERS_NAMES.reactServerComponents,
            WEBPACK_LAYERS_NAMES.actionBrowser,
            WEBPACK_LAYERS_NAMES.instrument,
            WEBPACK_LAYERS_NAMES.middleware
        ],
        neutralTarget: [
            // pages api
            WEBPACK_LAYERS_NAMES.apiNode,
            WEBPACK_LAYERS_NAMES.apiEdge
        ],
        clientOnly: [
            WEBPACK_LAYERS_NAMES.serverSideRendering,
            WEBPACK_LAYERS_NAMES.appPagesBrowser
        ],
        bundled: [
            WEBPACK_LAYERS_NAMES.reactServerComponents,
            WEBPACK_LAYERS_NAMES.actionBrowser,
            WEBPACK_LAYERS_NAMES.serverSideRendering,
            WEBPACK_LAYERS_NAMES.appPagesBrowser,
            WEBPACK_LAYERS_NAMES.shared,
            WEBPACK_LAYERS_NAMES.instrument,
            WEBPACK_LAYERS_NAMES.middleware
        ],
        appPages: [
            // app router pages and layouts
            WEBPACK_LAYERS_NAMES.reactServerComponents,
            WEBPACK_LAYERS_NAMES.serverSideRendering,
            WEBPACK_LAYERS_NAMES.appPagesBrowser,
            WEBPACK_LAYERS_NAMES.actionBrowser
        ]
    }
};
const WEBPACK_RESOURCE_QUERIES = {
    edgeSSREntry: '__next_edge_ssr_entry__',
    metadata: '__next_metadata__',
    metadataRoute: '__next_metadata_route__',
    metadataImageMeta: '__next_metadata_image_meta__'
};
}),
"[project]/store-builder/node_modules/next/dist/lib/framework/boundary-constants.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    METADATA_BOUNDARY_NAME: null,
    OUTLET_BOUNDARY_NAME: null,
    ROOT_LAYOUT_BOUNDARY_NAME: null,
    VIEWPORT_BOUNDARY_NAME: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    METADATA_BOUNDARY_NAME: function() {
        return METADATA_BOUNDARY_NAME;
    },
    OUTLET_BOUNDARY_NAME: function() {
        return OUTLET_BOUNDARY_NAME;
    },
    ROOT_LAYOUT_BOUNDARY_NAME: function() {
        return ROOT_LAYOUT_BOUNDARY_NAME;
    },
    VIEWPORT_BOUNDARY_NAME: function() {
        return VIEWPORT_BOUNDARY_NAME;
    }
});
const METADATA_BOUNDARY_NAME = '__next_metadata_boundary__';
const VIEWPORT_BOUNDARY_NAME = '__next_viewport_boundary__';
const OUTLET_BOUNDARY_NAME = '__next_outlet_boundary__';
const ROOT_LAYOUT_BOUNDARY_NAME = '__next_root_layout_boundary__';
}),
"[project]/store-builder/node_modules/next/dist/lib/framework/boundary-components.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    MetadataBoundary: null,
    OutletBoundary: null,
    RootLayoutBoundary: null,
    ViewportBoundary: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    MetadataBoundary: function() {
        return MetadataBoundary;
    },
    OutletBoundary: function() {
        return OutletBoundary;
    },
    RootLayoutBoundary: function() {
        return RootLayoutBoundary;
    },
    ViewportBoundary: function() {
        return ViewportBoundary;
    }
});
const _boundaryconstants = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/lib/framework/boundary-constants.js [app-client] (ecmascript)");
// We use a namespace object to allow us to recover the name of the function
// at runtime even when production bundling/minification is used.
const NameSpace = {
    [_boundaryconstants.METADATA_BOUNDARY_NAME]: function({ children }) {
        return children;
    },
    [_boundaryconstants.VIEWPORT_BOUNDARY_NAME]: function({ children }) {
        return children;
    },
    [_boundaryconstants.OUTLET_BOUNDARY_NAME]: function({ children }) {
        return children;
    },
    [_boundaryconstants.ROOT_LAYOUT_BOUNDARY_NAME]: function({ children }) {
        return children;
    }
};
const MetadataBoundary = // so it retains the name inferred from the namespace object
NameSpace[_boundaryconstants.METADATA_BOUNDARY_NAME.slice(0)];
const ViewportBoundary = // so it retains the name inferred from the namespace object
NameSpace[_boundaryconstants.VIEWPORT_BOUNDARY_NAME.slice(0)];
const OutletBoundary = // so it retains the name inferred from the namespace object
NameSpace[_boundaryconstants.OUTLET_BOUNDARY_NAME.slice(0)];
const RootLayoutBoundary = // so it retains the name inferred from the namespace object
NameSpace[_boundaryconstants.ROOT_LAYOUT_BOUNDARY_NAME.slice(0)];
}),
"[project]/store-builder/node_modules/next/dist/next-devtools/shared/forward-logs-shared.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    UNDEFINED_MARKER: null,
    patchConsoleMethod: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    UNDEFINED_MARKER: function() {
        return UNDEFINED_MARKER;
    },
    patchConsoleMethod: function() {
        return patchConsoleMethod;
    }
});
const UNDEFINED_MARKER = '__next_tagged_undefined';
function patchConsoleMethod(methodName, wrapper) {
    const descriptor = Object.getOwnPropertyDescriptor(console, methodName);
    if (descriptor && (descriptor.configurable || descriptor.writable) && typeof descriptor.value === 'function') {
        const originalMethod = descriptor.value;
        const originalName = Object.getOwnPropertyDescriptor(originalMethod, 'name');
        const wrapperMethod = function(...args) {
            wrapper(methodName, ...args);
            originalMethod.apply(this, args);
        };
        if (originalName) {
            Object.defineProperty(wrapperMethod, 'name', originalName);
        }
        Object.defineProperty(console, methodName, {
            value: wrapperMethod
        });
        return ()=>{
            Object.defineProperty(console, methodName, {
                value: originalMethod,
                writable: descriptor.writable,
                configurable: descriptor.configurable
            });
        };
    }
    return ()=>{};
}
if ((typeof exports.default === 'function' || typeof exports.default === 'object' && exports.default !== null) && typeof exports.default.__esModule === 'undefined') {
    Object.defineProperty(exports.default, '__esModule', {
        value: true
    });
    Object.assign(exports.default, exports);
    module.exports = exports.default;
}
}),
"[project]/store-builder/node_modules/next/dist/next-devtools/userspace/app/forward-logs-utils.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    logStringify: null,
    preLogSerializationClone: null,
    safeStringifyWithDepth: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    logStringify: function() {
        return logStringify;
    },
    preLogSerializationClone: function() {
        return preLogSerializationClone;
    },
    safeStringifyWithDepth: function() {
        return safeStringifyWithDepth;
    }
});
const _safestablestringify = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/compiled/safe-stable-stringify/index.js [app-client] (ecmascript)");
const _terminalloggingconfig = (()=>{
    const e = new Error("Cannot find module './terminal-logging-config'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const _forwardlogsshared = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/next-devtools/shared/forward-logs-shared.js [app-client] (ecmascript)");
const terminalLoggingConfig = (0, _terminalloggingconfig.getTerminalLoggingConfig)();
const PROMISE_MARKER = 'Promise {}';
const UNAVAILABLE_MARKER = '[Unable to view]';
const maximumDepth = typeof terminalLoggingConfig === 'object' && terminalLoggingConfig.depthLimit ? terminalLoggingConfig.depthLimit : 5;
const maximumBreadth = typeof terminalLoggingConfig === 'object' && terminalLoggingConfig.edgeLimit ? terminalLoggingConfig.edgeLimit : 100;
const safeStringifyWithDepth = (0, _safestablestringify.configure)({
    maximumDepth,
    maximumBreadth
});
function preLogSerializationClone(value, seen = new WeakMap()) {
    if (value === undefined) return _forwardlogsshared.UNDEFINED_MARKER;
    if (value === null || typeof value !== 'object') return value;
    if (seen.has(value)) return seen.get(value);
    try {
        Object.keys(value);
    } catch  {
        return UNAVAILABLE_MARKER;
    }
    try {
        if (typeof value.then === 'function') return PROMISE_MARKER;
    } catch  {
        return UNAVAILABLE_MARKER;
    }
    if (Array.isArray(value)) {
        const out = [];
        seen.set(value, out);
        for (const item of value){
            try {
                out.push(preLogSerializationClone(item, seen));
            } catch  {
                out.push(UNAVAILABLE_MARKER);
            }
        }
        return out;
    }
    const proto = Object.getPrototypeOf(value);
    if (proto === Object.prototype || proto === null) {
        const out = {};
        seen.set(value, out);
        for (const key of Object.keys(value)){
            try {
                out[key] = preLogSerializationClone(value[key], seen);
            } catch  {
                out[key] = UNAVAILABLE_MARKER;
            }
        }
        return out;
    }
    return Object.prototype.toString.call(value);
}
const logStringify = (data)=>{
    try {
        const result = safeStringifyWithDepth(data);
        return result ?? `"${UNAVAILABLE_MARKER}"`;
    } catch  {
        return `"${UNAVAILABLE_MARKER}"`;
    }
};
if ((typeof exports.default === 'function' || typeof exports.default === 'object' && exports.default !== null) && typeof exports.default.__esModule === 'undefined') {
    Object.defineProperty(exports.default, '__esModule', {
        value: true
    });
    Object.assign(exports.default, exports);
    module.exports = exports.default;
}
}),
"[project]/store-builder/node_modules/next/dist/next-devtools/userspace/app/forward-logs.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$store$2d$builder$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/store-builder/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    forwardErrorLog: null,
    forwardUnhandledError: null,
    initializeDebugLogForwarding: null,
    logQueue: null,
    logUnhandledRejection: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    forwardErrorLog: function() {
        return forwardErrorLog;
    },
    forwardUnhandledError: function() {
        return forwardUnhandledError;
    },
    initializeDebugLogForwarding: function() {
        return initializeDebugLogForwarding;
    },
    logQueue: function() {
        return logQueue;
    },
    logUnhandledRejection: function() {
        return logUnhandledRejection;
    }
});
const _errorsource = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/shared/lib/error-source.js [app-client] (ecmascript)");
const _terminalloggingconfig = (()=>{
    const e = new Error("Cannot find module './terminal-logging-config'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const _forwardlogsshared = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/next-devtools/shared/forward-logs-shared.js [app-client] (ecmascript)");
const _forwardlogsutils = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/next-devtools/userspace/app/forward-logs-utils.js [app-client] (ecmascript)");
const _stitchederror = (()=>{
    const e = new Error("Cannot find module './errors/stitched-error'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
// Client-side file logger for browser logs
class ClientFileLogger {
    formatTimestamp() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
        return `${hours}:${minutes}:${seconds}.${milliseconds}`;
    }
    log(level, args) {
        if (isReactServerReplayedLog(args)) {
            return;
        }
        // Format the args into a message string
        const message = args.map((arg)=>{
            if (typeof arg === 'string') return arg;
            if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
            if (arg === null) return 'null';
            if (arg === undefined) return 'undefined';
            // Handle DOM nodes - only log the tag name to avoid React proxied elements
            if (arg instanceof Element) {
                return `<${arg.tagName.toLowerCase()}>`;
            }
            return (0, _forwardlogsutils.safeStringifyWithDepth)(arg);
        }).join(' ');
        const logEntry = {
            timestamp: this.formatTimestamp(),
            level: level.toUpperCase(),
            message
        };
        this.logEntries.push(logEntry);
        // Schedule flush when new log is added
        scheduleLogFlush();
    }
    getLogs() {
        return [
            ...this.logEntries
        ];
    }
    clear() {
        this.logEntries = [];
    }
    constructor(){
        this.logEntries = [];
    }
}
const clientFileLogger = new ClientFileLogger();
// Set up flush-based sending of client file logs
let logFlushTimeout = null;
let heartbeatInterval = null;
const scheduleLogFlush = ()=>{
    if (logFlushTimeout) {
        clearTimeout(logFlushTimeout);
    }
    logFlushTimeout = setTimeout(()=>{
        sendClientFileLogs();
        logFlushTimeout = null;
    }, 100) // Send after 100ms (much faster with debouncing)
    ;
};
const cancelLogFlush = ()=>{
    if (logFlushTimeout) {
        clearTimeout(logFlushTimeout);
        logFlushTimeout = null;
    }
};
const startHeartbeat = ()=>{
    if (heartbeatInterval) return;
    heartbeatInterval = setInterval(()=>{
        if (logQueue.socket && logQueue.socket.readyState === WebSocket.OPEN) {
            try {
                // Send a ping to keep the connection alive
                logQueue.socket.send(JSON.stringify({
                    event: 'ping'
                }));
            } catch (error) {
                // Connection might be closed, stop heartbeat
                stopHeartbeat();
            }
        } else {
            stopHeartbeat();
        }
    }, 5000) // Send ping every 5 seconds
    ;
};
const stopHeartbeat = ()=>{
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
};
const isTerminalLoggingEnabled = (0, _terminalloggingconfig.getIsTerminalLoggingEnabled)();
const methods = [
    'log',
    'info',
    'warn',
    'debug',
    'table',
    'assert',
    'dir',
    'dirxml',
    'group',
    'groupCollapsed',
    'groupEnd',
    'trace'
];
const afterThisFrame = (cb)=>{
    let timeout;
    const rafId = requestAnimationFrame(()=>{
        timeout = setTimeout(()=>{
            cb();
        });
    });
    return ()=>{
        cancelAnimationFrame(rafId);
        clearTimeout(timeout);
    };
};
let isPatched = false;
const serializeEntries = (entries)=>entries.map((clientEntry)=>{
        switch(clientEntry.kind){
            case 'any-logged-error':
            case 'console':
                {
                    return {
                        ...clientEntry,
                        args: clientEntry.args.map(stringifyUserArg)
                    };
                }
            case 'formatted-error':
                {
                    return clientEntry;
                }
            default:
                {
                    return null;
                }
        }
    });
// Function to send client file logs to server
const sendClientFileLogs = ()=>{
    if (!logQueue.socket || logQueue.socket.readyState !== WebSocket.OPEN) {
        return;
    }
    const logs = clientFileLogger.getLogs();
    if (logs.length === 0) {
        return;
    }
    try {
        const payload = JSON.stringify({
            event: 'client-file-logs',
            logs: logs
        });
        logQueue.socket.send(payload);
    } catch (error) {
        console.error(error);
    } finally{
        // Clear logs regardless of send success to prevent memory leaks
        clientFileLogger.clear();
    }
};
const logQueue = {
    entries: [],
    flushScheduled: false,
    cancelFlush: null,
    socket: null,
    sourceType: undefined,
    router: null,
    scheduleLogSend: (entry)=>{
        logQueue.entries.push(entry);
        if (logQueue.flushScheduled) {
            return;
        }
        // safe to deref and use in setTimeout closure since we cancel on new socket
        const socket = logQueue.socket;
        if (!socket) {
            return;
        }
        // we probably dont need this
        logQueue.flushScheduled = true;
        // non blocking log flush, runs at most once per frame
        logQueue.cancelFlush = afterThisFrame(()=>{
            logQueue.flushScheduled = false;
            // just incase
            try {
                const payload = JSON.stringify({
                    event: 'browser-logs',
                    entries: serializeEntries(logQueue.entries),
                    router: logQueue.router,
                    // needed for source mapping, we just assign the sourceType from the last error for the whole batch
                    sourceType: logQueue.sourceType
                });
                socket.send(payload);
                logQueue.entries = [];
                logQueue.sourceType = undefined;
                // Also send client file logs
                sendClientFileLogs();
            } catch  {
            // error (make sure u don't infinite loop)
            /* noop */ }
        });
    },
    onSocketReady: (socket)=>{
        // When MCP or terminal logging is enabled, we enable the socket connection,
        // otherwise it will not proceed.
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        if (socket.readyState !== WebSocket.OPEN) {
            // invariant
            return;
        }
        // incase an existing timeout was going to run with a stale socket
        logQueue.cancelFlush?.();
        logQueue.socket = socket;
        // Add socket event listeners to track connection state
        socket.addEventListener('close', ()=>{
            cancelLogFlush();
            stopHeartbeat();
        });
        // Only send terminal logs if enabled
        if (isTerminalLoggingEnabled) {
            try {
                const payload = JSON.stringify({
                    event: 'browser-logs',
                    entries: serializeEntries(logQueue.entries),
                    router: logQueue.router,
                    sourceType: logQueue.sourceType
                });
                socket.send(payload);
                logQueue.entries = [];
                logQueue.sourceType = undefined;
            } catch  {
            /** noop just incase */ }
        }
        // Always send client file logs when socket is ready
        sendClientFileLogs();
        // Start heartbeat to keep connection alive
        startHeartbeat();
    }
};
const stringifyUserArg = (arg)=>{
    if (arg.kind !== 'arg') {
        return arg;
    }
    return {
        ...arg,
        data: (0, _forwardlogsutils.logStringify)(arg.data)
    };
};
const createErrorArg = (error)=>{
    return {
        kind: 'formatted-error-arg',
        prefix: error.message ? `${error.name}: ${error.message}` : `${error.name}`,
        stack: getErrorStackWithOwnerStack(error)
    };
};
const createLogEntry = (level, args)=>{
    // Always log to client file logger with args (formatting done inside log method)
    clientFileLogger.log(level, args);
    // Only forward to terminal if enabled
    if (!isTerminalLoggingEnabled) {
        return;
    }
    // do not abstract this, it implicitly relies on which functions call it. forcing the inlined implementation makes you think about callers
    // error capture stack trace maybe
    const stack = getErrorStack(new Error());
    const stackLines = stack?.split('\n');
    const cleanStack = stackLines?.slice(3).join('\n') // this is probably ignored anyways
    ;
    const entry = {
        kind: 'console',
        consoleMethodStack: cleanStack ?? null,
        method: level,
        args: args.map((arg)=>{
            if (arg instanceof Error) {
                return createErrorArg(arg);
            }
            return {
                kind: 'arg',
                data: (0, _forwardlogsutils.preLogSerializationClone)(arg)
            };
        })
    };
    logQueue.scheduleLogSend(entry);
};
const forwardErrorLog = (args)=>{
    // Skip React server replayed logs - they were already logged on the server
    if (isReactServerReplayedLog(args)) {
        return;
    }
    // Always log to client file logger with args (formatting done inside log method)
    clientFileLogger.log('error', args);
    // Only forward to terminal if enabled
    if (!isTerminalLoggingEnabled) {
        return;
    }
    const errorObjects = args.filter((arg)=>arg instanceof Error);
    const first = errorObjects.at(0);
    if (first) {
        const source = (0, _errorsource.getErrorSource)(first);
        if (source) {
            logQueue.sourceType = source;
        }
    }
    /**
   * browser shows stack regardless of type of data passed to console.error, so we should do the same
   *
   * do not abstract this, it implicitly relies on which functions call it. forcing the inlined implementation makes you think about callers
   */ const stack = getErrorStack(new Error());
    const stackLines = stack?.split('\n');
    const cleanStack = stackLines?.slice(3).join('\n');
    const entry = {
        kind: 'any-logged-error',
        method: 'error',
        consoleErrorStack: cleanStack ?? '',
        args: args.map((arg)=>{
            if (arg instanceof Error) {
                return createErrorArg(arg);
            }
            return {
                kind: 'arg',
                data: (0, _forwardlogsutils.preLogSerializationClone)(arg)
            };
        })
    };
    logQueue.scheduleLogSend(entry);
};
const createUncaughtErrorEntry = (errorName, errorMessage, fullStack)=>{
    const entry = {
        kind: 'formatted-error',
        prefix: `Uncaught ${errorName}: ${errorMessage}`,
        stack: fullStack,
        method: 'error'
    };
    logQueue.scheduleLogSend(entry);
};
const getErrorStack = (error)=>{
    return error.stack || '';
};
// Get error stack with owner stack appended for source mapping on the server
const getErrorStackWithOwnerStack = (error)=>{
    const errorStack = getErrorStack(error);
    const ownerStack = (0, _stitchederror.getOwnerStack)(error);
    return ownerStack ? `${errorStack}\n${ownerStack}` : errorStack;
};
function logUnhandledRejection(reason) {
    // Always log to client file logger
    const message = reason instanceof Error ? `${reason.name}: ${reason.message}` : JSON.stringify(reason);
    clientFileLogger.log('error', [
        `unhandledRejection: ${message}`
    ]);
    // Only forward to terminal if enabled
    if (!isTerminalLoggingEnabled) {
        return;
    }
    if (reason instanceof Error) {
        createUnhandledRejectionErrorEntry(reason, getErrorStackWithOwnerStack(reason));
        return;
    }
    createUnhandledRejectionNonErrorEntry(reason);
}
const createUnhandledRejectionErrorEntry = (error, fullStack)=>{
    const source = (0, _errorsource.getErrorSource)(error);
    if (source) {
        logQueue.sourceType = source;
    }
    const entry = {
        kind: 'formatted-error',
        prefix: `⨯ unhandledRejection: ${error.name}: ${error.message}`,
        stack: fullStack,
        method: 'error'
    };
    logQueue.scheduleLogSend(entry);
};
const createUnhandledRejectionNonErrorEntry = (reason)=>{
    const entry = {
        kind: 'any-logged-error',
        // we can't access the stack since the event is dispatched async and creating an inline error would be meaningless
        consoleErrorStack: '',
        method: 'error',
        args: [
            {
                kind: 'arg',
                data: `⨯ unhandledRejection:`,
                isRejectionMessage: true
            },
            {
                kind: 'arg',
                data: (0, _forwardlogsutils.preLogSerializationClone)(reason)
            }
        ]
    };
    logQueue.scheduleLogSend(entry);
};
const isHMR = (args)=>{
    const firstArg = args[0];
    if (typeof firstArg !== 'string') {
        return false;
    }
    if (firstArg.startsWith('[Fast Refresh]')) {
        return true;
    }
    if (firstArg.startsWith('[HMR]')) {
        return true;
    }
    return false;
};
/**
 * Matches the format of logs arguments React replayed from the RSC.
 */ const isReactServerReplayedLog = (args)=>{
    if (args.length < 3) {
        return false;
    }
    const [format, styles, label] = args;
    if (typeof format !== 'string' || typeof styles !== 'string' || typeof label !== 'string') {
        return false;
    }
    return format.startsWith('%c%s%c') && styles.includes('background:');
};
function forwardUnhandledError(error) {
    // Always log to client file logger
    clientFileLogger.log('error', [
        `uncaughtError: ${error.name}: ${error.message}`
    ]);
    // Only forward to terminal if enabled
    if (!isTerminalLoggingEnabled) {
        return;
    }
    createUncaughtErrorEntry(error.name, error.message, getErrorStackWithOwnerStack(error));
}
const initializeDebugLogForwarding = (router)=>{
    // probably don't need this
    if (isPatched) {
        return;
    }
    // TODO(rob): why does this break rendering on server, important to know incase the same bug appears in browser
    if (typeof window === 'undefined') {
        return;
    }
    // better to be safe than sorry
    try {
        methods.forEach((method)=>(0, _forwardlogsshared.patchConsoleMethod)(method, (_, ...args)=>{
                if (isHMR(args)) {
                    return;
                }
                if (isReactServerReplayedLog(args)) {
                    return;
                }
                createLogEntry(method, args);
            }));
    } catch  {}
    logQueue.router = router;
    isPatched = true;
    // Cleanup on page unload
    window.addEventListener('beforeunload', ()=>{
        cancelLogFlush();
        stopHeartbeat();
        // Send any remaining logs before page unloads
        sendClientFileLogs();
    });
};
if ((typeof exports.default === 'function' || typeof exports.default === 'object' && exports.default !== null) && typeof exports.default.__esModule === 'undefined') {
    Object.defineProperty(exports.default, '__esModule', {
        value: true
    });
    Object.assign(exports.default, exports);
    module.exports = exports.default;
}
}),
"[project]/store-builder/node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$store$2d$builder$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/store-builder/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    originConsoleError: null,
    patchConsoleError: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    originConsoleError: function() {
        return originConsoleError;
    },
    patchConsoleError: function() {
        return patchConsoleError;
    }
});
const _interop_require_default = __turbopack_context__.r("[project]/node_modules/next/node_modules/@swc/helpers/cjs/_interop_require_default.cjs [app-client] (ecmascript)");
const _iserror = /*#__PURE__*/ _interop_require_default._(__turbopack_context__.r("[project]/store-builder/node_modules/next/dist/lib/is-error.js [app-client] (ecmascript)"));
const _isnextroutererror = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/client/components/is-next-router-error.js [app-client] (ecmascript)");
const _useerrorhandler = (()=>{
    const e = new Error("Cannot find module './use-error-handler'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const _console = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/client/lib/console.js [app-client] (ecmascript)");
const _forwardlogs = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/next-devtools/userspace/app/forward-logs.js [app-client] (ecmascript)");
const originConsoleError = globalThis.console.error;
function patchConsoleError() {
    // Ensure it's only patched once
    if (typeof window === 'undefined') {
        return;
    }
    window.console.error = function error(...args) {
        let maybeError;
        let isReplayedLog = false;
        if ("TURBOPACK compile-time truthy", 1) {
            const { error: replayedError, environmentName } = (0, _console.parseConsoleArgs)(args);
            // If environmentName is set, this is a server log replayed by React in the browser
            isReplayedLog = !!environmentName;
            if (replayedError) {
                maybeError = replayedError;
            } else if ((0, _iserror.default)(args[0])) {
                maybeError = args[0];
            } else {
                // See https://github.com/facebook/react/blob/d50323eb845c5fde0d720cae888bf35dedd05506/packages/react-reconciler/src/ReactFiberErrorLogger.js#L78
                maybeError = args[1];
            }
        } else //TURBOPACK unreachable
        ;
        if (!(0, _isnextroutererror.isNextRouterError)(maybeError)) {
            if ("TURBOPACK compile-time truthy", 1) {
                (0, _useerrorhandler.handleConsoleError)(// but if we pass the error directly, `handleClientError` will ignore it
                maybeError, args);
            }
            // Don't forward replayed server logs to terminal - they were already logged on the server
            if (!isReplayedLog) {
                (0, _forwardlogs.forwardErrorLog)(args);
            }
            originConsoleError.apply(window.console, args);
        }
    };
}
if ((typeof exports.default === 'function' || typeof exports.default === 'object' && exports.default !== null) && typeof exports.default.__esModule === 'undefined') {
    Object.defineProperty(exports.default, '__esModule', {
        value: true
    });
    Object.assign(exports.default, exports);
    module.exports = exports.default;
}
}),
"[project]/store-builder/node_modules/next/dist/next-devtools/userspace/app/app-dev-overlay-setup.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
const _interceptconsoleerror = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js [app-client] (ecmascript)");
const _useerrorhandler = (()=>{
    const e = new Error("Cannot find module './errors/use-error-handler'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const _forwardlogs = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/next-devtools/userspace/app/forward-logs.js [app-client] (ecmascript)");
(0, _useerrorhandler.handleGlobalErrors)();
(0, _interceptconsoleerror.patchConsoleError)();
(0, _forwardlogs.initializeDebugLogForwarding)('app');
if ((typeof exports.default === 'function' || typeof exports.default === 'object' && exports.default !== null) && typeof exports.default.__esModule === 'undefined') {
    Object.defineProperty(exports.default, '__esModule', {
        value: true
    });
    Object.assign(exports.default, exports);
    module.exports = exports.default;
}
}),
"[project]/store-builder/node_modules/next/dist/next-devtools/userspace/app/errors/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    decorateDevError: null,
    handleClientError: null,
    originConsoleError: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    decorateDevError: function() {
        return _stitchederror.decorateDevError;
    },
    handleClientError: function() {
        return _useerrorhandler.handleClientError;
    },
    originConsoleError: function() {
        return _interceptconsoleerror.originConsoleError;
    }
});
const _interceptconsoleerror = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/next-devtools/userspace/app/errors/intercept-console-error.js [app-client] (ecmascript)");
const _useerrorhandler = (()=>{
    const e = new Error("Cannot find module './use-error-handler'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const _stitchederror = (()=>{
    const e = new Error("Cannot find module './stitched-error'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
if ((typeof exports.default === 'function' || typeof exports.default === 'object' && exports.default !== null) && typeof exports.default.__esModule === 'undefined') {
    Object.defineProperty(exports.default, '__esModule', {
        value: true
    });
    Object.assign(exports.default, exports);
    module.exports = exports.default;
}
}),
"[project]/store-builder/node_modules/next/dist/next-devtools/userspace/app/app-dev-overlay-error-boundary.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$store$2d$builder$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/store-builder/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppDevOverlayErrorBoundary", {
    enumerable: true,
    get: function() {
        return AppDevOverlayErrorBoundary;
    }
});
const _interop_require_default = __turbopack_context__.r("[project]/node_modules/next/node_modules/@swc/helpers/cjs/_interop_require_default.cjs [app-client] (ecmascript)");
const _interop_require_wildcard = __turbopack_context__.r("[project]/node_modules/next/node_modules/@swc/helpers/cjs/_interop_require_wildcard.cjs [app-client] (ecmascript)");
const _jsxruntime = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)");
const _react = /*#__PURE__*/ _interop_require_wildcard._(__turbopack_context__.r("[project]/store-builder/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"));
const _nextdevtools = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/compiled/next-devtools/index.js (raw)");
const _runtimeerrorhandler = (()=>{
    const e = new Error("Cannot find module '../../../client/dev/runtime-error-handler'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const _errorboundary = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/client/components/error-boundary.js [app-client] (ecmascript)");
const _globalerror = /*#__PURE__*/ _interop_require_default._(__turbopack_context__.r("[project]/store-builder/node_modules/next/dist/client/components/builtin/global-error.js [app-client] (ecmascript)"));
const _segmentexplorernode = (()=>{
    const e = new Error("Cannot find module './segment-explorer-node'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const _approutercontextsharedruntime = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/shared/lib/app-router-context.shared-runtime.js [app-client] (ecmascript)");
function ErroredHtml({ globalError: [GlobalError, globalErrorStyles], error, reset, unstable_retry }) {
    if (!error) {
        return /*#__PURE__*/ (0, _jsxruntime.jsxs)("html", {
            children: [
                /*#__PURE__*/ (0, _jsxruntime.jsx)("head", {}),
                /*#__PURE__*/ (0, _jsxruntime.jsx)("body", {})
            ]
        });
    }
    return /*#__PURE__*/ (0, _jsxruntime.jsxs)(_errorboundary.ErrorBoundary, {
        errorComponent: _globalerror.default,
        children: [
            globalErrorStyles,
            /*#__PURE__*/ (0, _jsxruntime.jsx)(GlobalError, {
                error: error,
                reset: reset,
                unstable_retry: unstable_retry
            })
        ]
    });
}
class AppDevOverlayErrorBoundary extends _react.PureComponent {
    static{
        this.contextType = _approutercontextsharedruntime.AppRouterContext;
    }
    static getDerivedStateFromError(error) {
        _runtimeerrorhandler.RuntimeErrorHandler.hadRuntimeError = true;
        return {
            reactError: error
        };
    }
    componentDidCatch(err) {
        if (("TURBOPACK compile-time value", "development") === 'development' && err.message === _segmentexplorernode.SEGMENT_EXPLORER_SIMULATED_ERROR_MESSAGE) {
            return;
        }
        _nextdevtools.dispatcher.openErrorOverlay();
    }
    render() {
        const { children, globalError } = this.props;
        const { reactError } = this.state;
        const fallback = /*#__PURE__*/ (0, _jsxruntime.jsx)(ErroredHtml, {
            globalError: globalError,
            error: reactError,
            reset: this.reset,
            unstable_retry: this.unstable_retry
        });
        return reactError !== null ? fallback : children;
    }
    constructor(...args){
        super(...args), this.state = {
            reactError: null
        }, this.unstable_retry = ()=>{
            (0, _react.startTransition)(()=>{
                this.context?.refresh();
                this.reset();
            });
        }, this.reset = ()=>{
            this.setState({
                reactError: null
            });
        };
    }
}
if ((typeof exports.default === 'function' || typeof exports.default === 'object' && exports.default !== null) && typeof exports.default.__esModule === 'undefined') {
    Object.defineProperty(exports.default, '__esModule', {
        value: true
    });
    Object.assign(exports.default, exports);
    module.exports = exports.default;
}
}),
"[project]/store-builder/node_modules/next/dist/next-devtools/userspace/app/client-entry.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RootLevelDevOverlayElement", {
    enumerable: true,
    get: function() {
        return RootLevelDevOverlayElement;
    }
});
const _interop_require_default = __turbopack_context__.r("[project]/node_modules/next/node_modules/@swc/helpers/cjs/_interop_require_default.cjs [app-client] (ecmascript)");
const _jsxruntime = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)");
const _react = /*#__PURE__*/ _interop_require_default._(__turbopack_context__.r("[project]/store-builder/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"));
const _globalerror = /*#__PURE__*/ _interop_require_default._(__turbopack_context__.r("[project]/store-builder/node_modules/next/dist/client/components/builtin/global-error.js [app-client] (ecmascript)"));
const _appdevoverlayerrorboundary = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/next-devtools/userspace/app/app-dev-overlay-error-boundary.js [app-client] (ecmascript)");
function RootLevelDevOverlayElement({ children }) {
    return /*#__PURE__*/ (0, _jsxruntime.jsx)(_appdevoverlayerrorboundary.AppDevOverlayErrorBoundary, {
        globalError: [
            _globalerror.default,
            null
        ],
        children: children
    });
}
if ((typeof exports.default === 'function' || typeof exports.default === 'object' && exports.default !== null) && typeof exports.default.__esModule === 'undefined') {
    Object.defineProperty(exports.default, '__esModule', {
        value: true
    });
    Object.assign(exports.default, exports);
    module.exports = exports.default;
}
}),
"[project]/store-builder/node_modules/next/dist/server/dev/hot-reloader-types.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    HMR_MESSAGE_SENT_TO_BROWSER: null,
    HMR_MESSAGE_SENT_TO_SERVER: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    HMR_MESSAGE_SENT_TO_BROWSER: function() {
        return HMR_MESSAGE_SENT_TO_BROWSER;
    },
    HMR_MESSAGE_SENT_TO_SERVER: function() {
        return HMR_MESSAGE_SENT_TO_SERVER;
    }
});
var HMR_MESSAGE_SENT_TO_BROWSER = /*#__PURE__*/ function(HMR_MESSAGE_SENT_TO_BROWSER) {
    // JSON messages:
    HMR_MESSAGE_SENT_TO_BROWSER["ADDED_PAGE"] = "addedPage";
    HMR_MESSAGE_SENT_TO_BROWSER["REMOVED_PAGE"] = "removedPage";
    HMR_MESSAGE_SENT_TO_BROWSER["RELOAD_PAGE"] = "reloadPage";
    HMR_MESSAGE_SENT_TO_BROWSER["SERVER_COMPONENT_CHANGES"] = "serverComponentChanges";
    HMR_MESSAGE_SENT_TO_BROWSER["MIDDLEWARE_CHANGES"] = "middlewareChanges";
    HMR_MESSAGE_SENT_TO_BROWSER["CLIENT_CHANGES"] = "clientChanges";
    HMR_MESSAGE_SENT_TO_BROWSER["SERVER_ONLY_CHANGES"] = "serverOnlyChanges";
    HMR_MESSAGE_SENT_TO_BROWSER["SYNC"] = "sync";
    HMR_MESSAGE_SENT_TO_BROWSER["BUILT"] = "built";
    HMR_MESSAGE_SENT_TO_BROWSER["BUILDING"] = "building";
    HMR_MESSAGE_SENT_TO_BROWSER["DEV_PAGES_MANIFEST_UPDATE"] = "devPagesManifestUpdate";
    HMR_MESSAGE_SENT_TO_BROWSER["TURBOPACK_MESSAGE"] = "turbopack-message";
    HMR_MESSAGE_SENT_TO_BROWSER["SERVER_ERROR"] = "serverError";
    HMR_MESSAGE_SENT_TO_BROWSER["TURBOPACK_CONNECTED"] = "turbopack-connected";
    HMR_MESSAGE_SENT_TO_BROWSER["ISR_MANIFEST"] = "isrManifest";
    HMR_MESSAGE_SENT_TO_BROWSER["CACHE_INDICATOR"] = "cacheIndicator";
    HMR_MESSAGE_SENT_TO_BROWSER["DEV_INDICATOR"] = "devIndicator";
    HMR_MESSAGE_SENT_TO_BROWSER["DEVTOOLS_CONFIG"] = "devtoolsConfig";
    HMR_MESSAGE_SENT_TO_BROWSER["REQUEST_CURRENT_ERROR_STATE"] = "requestCurrentErrorState";
    HMR_MESSAGE_SENT_TO_BROWSER["REQUEST_PAGE_METADATA"] = "requestPageMetadata";
    // Binary messages:
    HMR_MESSAGE_SENT_TO_BROWSER[HMR_MESSAGE_SENT_TO_BROWSER["REACT_DEBUG_CHUNK"] = 0] = "REACT_DEBUG_CHUNK";
    HMR_MESSAGE_SENT_TO_BROWSER[HMR_MESSAGE_SENT_TO_BROWSER["ERRORS_TO_SHOW_IN_BROWSER"] = 1] = "ERRORS_TO_SHOW_IN_BROWSER";
    return HMR_MESSAGE_SENT_TO_BROWSER;
}({});
var HMR_MESSAGE_SENT_TO_SERVER = /*#__PURE__*/ function(HMR_MESSAGE_SENT_TO_SERVER) {
    // JSON messages:
    HMR_MESSAGE_SENT_TO_SERVER["MCP_ERROR_STATE_RESPONSE"] = "mcp-error-state-response";
    HMR_MESSAGE_SENT_TO_SERVER["MCP_PAGE_METADATA_RESPONSE"] = "mcp-page-metadata-response";
    HMR_MESSAGE_SENT_TO_SERVER["PING"] = "ping";
    return HMR_MESSAGE_SENT_TO_SERVER;
}({});
}),
]);

//# sourceMappingURL=1k36_next_dist_1-nraqb._.js.map
(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/store-builder/node_modules/next/dist/client/app-bootstrap.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
/**
 * Before starting the Next.js runtime and requiring any module, we need to make
 * sure the following scripts are executed in the correct order:
 * - Polyfills
 * - next/script with `beforeInteractive` strategy
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "appBootstrap", {
    enumerable: true,
    get: function() {
        return appBootstrap;
    }
});
const _assetprefix = (()=>{
    const e = new Error("Cannot find module './asset-prefix'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const _setattributesfromprops = (()=>{
    const e = new Error("Cannot find module './set-attributes-from-props'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const version = "16.2.12";
window.next = {
    version,
    appDir: true
};
function loadScriptsInSequence(scripts, hydrate) {
    if (!scripts || !scripts.length) {
        return hydrate();
    }
    return scripts.reduce((promise, [src, props])=>{
        return promise.then(()=>{
            return new Promise((resolve, reject)=>{
                const el = document.createElement('script');
                if (props) {
                    (0, _setattributesfromprops.setAttributesFromProps)(el, props);
                }
                if (src) {
                    el.src = src;
                    el.onload = ()=>resolve();
                    el.onerror = reject;
                } else if (props) {
                    el.innerHTML = props.children;
                    setTimeout(resolve);
                }
                document.head.appendChild(el);
            });
        });
    }, Promise.resolve()).catch((err)=>{
        console.error(err);
    // Still try to hydrate even if there's an error.
    }).then(()=>{
        hydrate();
    });
}
function appBootstrap(hydrate) {
    const assetPrefix = (0, _assetprefix.getAssetPrefix)();
    loadScriptsInSequence(self.__next_s, ()=>{
        // If the static shell is being debugged, skip hydration if the
        // `__nextppronly` query is present. This is only enabled when the
        // environment variable `__NEXT_EXPERIMENTAL_STATIC_SHELL_DEBUGGING` is
        // set to `1`. Otherwise the following is optimized out.
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        hydrate(assetPrefix);
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
"[project]/store-builder/node_modules/next/dist/next-devtools/userspace/app/app-dev-overlay-setup.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
const _interceptconsoleerror = (()=>{
    const e = new Error("Cannot find module './errors/intercept-console-error'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const _useerrorhandler = (()=>{
    const e = new Error("Cannot find module './errors/use-error-handler'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const _forwardlogs = (()=>{
    const e = new Error("Cannot find module './forward-logs'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
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
"[project]/store-builder/node_modules/next/dist/client/app-globals.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
// imports polyfill from `@next/polyfill-module` after build.
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
(()=>{
    const e = new Error("Cannot find module '../build/polyfills/polyfill-module'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
// Only set up devtools for the dev server.
if ("TURBOPACK compile-time truthy", 1) {
    __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/next-devtools/userspace/app/app-dev-overlay-setup.js [app-client] (ecmascript)");
}
// Start listening for the instant navigation test cookie. The test framework
// (e.g. Playwright) sets/clears this cookie to control the navigation lock.
// Browser-only.
if (("TURBOPACK compile-time value", true) && typeof window !== 'undefined') {
    const { startListeningForInstantNavigationCookie } = (()=>{
        const e = new Error("Cannot find module './components/segment-cache/navigation-testing-lock'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })();
    startListeningForInstantNavigationCookie();
}
if ((typeof exports.default === 'function' || typeof exports.default === 'object' && exports.default !== null) && typeof exports.default.__esModule === 'undefined') {
    Object.defineProperty(exports.default, '__esModule', {
        value: true
    });
    Object.assign(exports.default, exports);
    module.exports = exports.default;
}
}),
"[project]/store-builder/node_modules/next/dist/client/app-call-server.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "callServer", {
    enumerable: true,
    get: function() {
        return callServer;
    }
});
const _react = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
const _routerreducertypes = (()=>{
    const e = new Error("Cannot find module './components/router-reducer/router-reducer-types'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const _useactionqueue = (()=>{
    const e = new Error("Cannot find module './components/use-action-queue'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
async function callServer(actionId, actionArgs) {
    return new Promise((resolve, reject)=>{
        (0, _react.startTransition)(()=>{
            (0, _useactionqueue.dispatchAppRouterAction)({
                type: _routerreducertypes.ACTION_SERVER_ACTION,
                actionId,
                actionArgs,
                resolve,
                reject
            });
        });
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
"[project]/store-builder/node_modules/next/dist/client/app-find-source-map-url.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "findSourceMapURL", {
    enumerable: true,
    get: function() {
        return findSourceMapURL;
    }
});
const basePath = ("TURBOPACK compile-time value", "") || '';
const pathname = `${basePath}/__nextjs_source-map`;
const findSourceMapURL = ("TURBOPACK compile-time truthy", 1) ? function findSourceMapURL(filename) {
    if (filename === '') {
        return null;
    }
    if (filename.startsWith(document.location.origin) && filename.includes('/_next/static')) {
        // This is a request for a client chunk. This can only happen when
        // using Turbopack. In this case, since we control how those source
        // maps are generated, we can safely assume that the sourceMappingURL
        // is relative to the filename, with an added `.map` extension. The
        // browser can just request this file, and it gets served through the
        // normal dev server, without the need to route this through
        // the `/__nextjs_source-map` dev middleware.
        return `${filename}.map`;
    }
    const url = new URL(pathname, document.location.origin);
    url.searchParams.set('filename', filename);
    return url.href;
} : "TURBOPACK unreachable";
if ((typeof exports.default === 'function' || typeof exports.default === 'object' && exports.default !== null) && typeof exports.default.__esModule === 'undefined') {
    Object.defineProperty(exports.default, '__esModule', {
        value: true
    });
    Object.assign(exports.default, exports);
    module.exports = exports.default;
}
}),
"[project]/store-builder/node_modules/next/dist/client/app-link-gc.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "linkGc", {
    enumerable: true,
    get: function() {
        return linkGc;
    }
});
function linkGc() {
    // TODO-APP: Remove this logic when Float has GC built-in in development.
    if ("TURBOPACK compile-time truthy", 1) {
        const callback = (mutationList)=>{
            for (const mutation of mutationList){
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes){
                        if ('tagName' in node && node.tagName === 'LINK') {
                            const link = node;
                            if (link.dataset.precedence?.startsWith('next')) {
                                const href = link.getAttribute('href');
                                if (href) {
                                    const [resource, version] = href.split('?v=', 2);
                                    if (version) {
                                        const currentOrigin = window.location.origin;
                                        const allLinks = [
                                            ...document.querySelectorAll('link[href^="' + resource + '"]'),
                                            // It's possible that the resource is a full URL or only pathname,
                                            // so we need to remove the alternative href as well.
                                            ...document.querySelectorAll('link[href^="' + (resource.startsWith(currentOrigin) ? resource.slice(currentOrigin.length) : currentOrigin + resource) + '"]')
                                        ];
                                        for (const otherLink of allLinks){
                                            if (otherLink.dataset.precedence?.startsWith('next')) {
                                                const otherHref = otherLink.getAttribute('href');
                                                if (otherHref) {
                                                    const [, otherVersion] = otherHref.split('?v=', 2);
                                                    if (!otherVersion || +otherVersion < +version) {
                                                        // Delay the removal of the stylesheet to avoid FOUC
                                                        // caused by `@font-face` rules, as they seem to be
                                                        // a couple of ticks delayed between the old and new
                                                        // styles being swapped even if the font is cached.
                                                        setTimeout(()=>{
                                                            otherLink.remove();
                                                        }, 5);
                                                        const preloadLink = document.querySelector(`link[rel="preload"][as="style"][href="${otherHref}"]`);
                                                        if (preloadLink) {
                                                            preloadLink.remove();
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        // Create an observer instance linked to the callback function
        const observer = new MutationObserver(callback);
        observer.observe(document.head, {
            childList: true
        });
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
"[project]/store-builder/node_modules/next/dist/client/app-index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "hydrate", {
    enumerable: true,
    get: function() {
        return hydrate;
    }
});
const _interop_require_default = __turbopack_context__.r("[project]/node_modules/next/node_modules/@swc/helpers/cjs/_interop_require_default.cjs [app-client] (ecmascript)");
const _jsxruntime = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)");
__turbopack_context__.r("[project]/store-builder/node_modules/next/dist/client/app-globals.js [app-client] (ecmascript)");
const _client = /*#__PURE__*/ _interop_require_default._(__turbopack_context__.r("[project]/node_modules/next/dist/compiled/react-dom/client.js [app-client] (ecmascript)"));
const _react = /*#__PURE__*/ _interop_require_default._(__turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"));
const _client1 = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react-server-dom-turbopack/client.js [app-client] (ecmascript)");
const _headmanagercontextsharedruntime = (()=>{
    const e = new Error("Cannot find module '../shared/lib/head-manager-context.shared-runtime'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const _onrecoverableerror = (()=>{
    const e = new Error("Cannot find module './react-client-callbacks/on-recoverable-error'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const _errorboundarycallbacks = (()=>{
    const e = new Error("Cannot find module './react-client-callbacks/error-boundary-callbacks'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const _appcallserver = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/client/app-call-server.js [app-client] (ecmascript)");
const _appfindsourcemapurl = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/client/app-find-source-map-url.js [app-client] (ecmascript)");
const _approuterinstance = (()=>{
    const e = new Error("Cannot find module './components/app-router-instance'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const _approuter = /*#__PURE__*/ _interop_require_default._((()=>{
    const e = new Error("Cannot find module './components/app-router'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})());
const _createinitialrouterstate = (()=>{
    const e = new Error("Cannot find module './components/router-reducer/create-initial-router-state'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const _approutercontextsharedruntime = (()=>{
    const e = new Error("Cannot find module '../shared/lib/app-router-context.shared-runtime'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const _flightdatahelpers = (()=>{
    const e = new Error("Cannot find module './flight-data-helpers'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const _deploymentid = (()=>{
    const e = new Error("Cannot find module '../shared/lib/deployment-id'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const _navigationbuildid = (()=>{
    const e = new Error("Cannot find module './navigation-build-id'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
/// <reference types="react-dom/experimental" />
const createFromReadableStream = _client1.createFromReadableStream;
const createFromFetch = _client1.createFromFetch;
const appElement = document;
// Instant Navigation Testing API: captured once at module init. When truthy,
// this is the fetch promise for the static RSC payload (set by an injected
// <script> tag in the static shell HTML).
const instantTestStaticFetch = self.__next_instant_test ? self.__next_instant_test : undefined;
const encoder = new TextEncoder();
let initialServerDataBuffer = undefined;
let initialServerDataWriter = undefined;
let initialServerDataLoaded = false;
let initialServerDataFlushed = false;
let initialFormStateData = null;
function nextServerDataCallback(seg) {
    if (seg[0] === 0) {
        initialServerDataBuffer = [];
    } else if (seg[0] === 1) {
        if (!initialServerDataBuffer) throw Object.defineProperty(new Error('Unexpected server data: missing bootstrap script.'), "__NEXT_ERROR_CODE", {
            value: "E18",
            enumerable: false,
            configurable: true
        });
        if (initialServerDataWriter) {
            initialServerDataWriter.enqueue(encoder.encode(seg[1]));
        } else {
            initialServerDataBuffer.push(seg[1]);
        }
    } else if (seg[0] === 2) {
        initialFormStateData = seg[1];
    } else if (seg[0] === 3) {
        if (!initialServerDataBuffer) throw Object.defineProperty(new Error('Unexpected server data: missing bootstrap script.'), "__NEXT_ERROR_CODE", {
            value: "E18",
            enumerable: false,
            configurable: true
        });
        // Decode the base64 string back to binary data.
        const binaryString = atob(seg[1]);
        const decodedChunk = new Uint8Array(binaryString.length);
        for(var i = 0; i < binaryString.length; i++){
            decodedChunk[i] = binaryString.charCodeAt(i);
        }
        if (initialServerDataWriter) {
            initialServerDataWriter.enqueue(decodedChunk);
        } else {
            initialServerDataBuffer.push(decodedChunk);
        }
    }
}
function isStreamErrorOrUnfinished(ctr) {
    // If `desiredSize` is null, it means the stream is closed or errored. If it is lower than 0, the stream is still unfinished.
    return ctr.desiredSize === null || ctr.desiredSize < 0;
}
// There might be race conditions between `nextServerDataRegisterWriter` and
// `DOMContentLoaded`. The former will be called when React starts to hydrate
// the root, the latter will be called when the DOM is fully loaded.
// For streaming, the former is called first due to partial hydration.
// For non-streaming, the latter can be called first.
// Hence, we use two variables `initialServerDataLoaded` and
// `initialServerDataFlushed` to make sure the writer will be closed and
// `initialServerDataBuffer` will be cleared in the right time.
function nextServerDataRegisterWriter(ctr) {
    if (initialServerDataBuffer) {
        initialServerDataBuffer.forEach((val)=>{
            ctr.enqueue(typeof val === 'string' ? encoder.encode(val) : val);
        });
        if (initialServerDataLoaded && !initialServerDataFlushed) {
            // Instant Navigation Testing API: don't close or error the inline
            // Flight stream. The static shell has no inline Flight data, so the
            // stream is empty. Closing it would cause React to log an error about
            // missing data. Leaving it open lets React treat any holes as
            // "still suspended." Hydration uses the separately fetched RSC payload
            // (self.__next_instant_test), not this stream.
            if (isStreamErrorOrUnfinished(ctr)) {
                if (!instantTestStaticFetch) {
                    ctr.error(Object.defineProperty(new Error('The connection to the page was unexpectedly closed, possibly due to the stop button being clicked, loss of Wi-Fi, or an unstable internet connection.'), "__NEXT_ERROR_CODE", {
                        value: "E117",
                        enumerable: false,
                        configurable: true
                    }));
                }
            } else {
                ctr.close();
            }
            initialServerDataFlushed = true;
            initialServerDataBuffer = undefined;
        }
    }
    initialServerDataWriter = ctr;
}
// When `DOMContentLoaded`, we can close all pending writers to finish hydration.
const DOMContentLoaded = function() {
    if (initialServerDataWriter && !initialServerDataFlushed) {
        initialServerDataWriter.close();
        initialServerDataFlushed = true;
        initialServerDataBuffer = undefined;
    }
    initialServerDataLoaded = true;
};
// It's possible that the DOM is already loaded.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', DOMContentLoaded, false);
} else {
    // Delayed in marco task to ensure it's executed later than hydration
    setTimeout(DOMContentLoaded);
}
const nextServerDataLoadingGlobal = self.__next_f = self.__next_f || [];
// Consume all buffered chunks and clear the global data array right after to release memory.
// Otherwise it will be retained indefinitely.
nextServerDataLoadingGlobal.forEach(nextServerDataCallback);
nextServerDataLoadingGlobal.length = 0;
// Patch its push method so subsequent chunks are handled (but not actually pushed to the array).
nextServerDataLoadingGlobal.push = nextServerDataCallback;
let readable = new ReadableStream({
    start (controller) {
        nextServerDataRegisterWriter(controller);
    }
});
if ("TURBOPACK compile-time truthy", 1) {
    // @ts-expect-error
    readable.name = 'hydration';
}
// When Cache Components is enabled, tee the inlined Flight stream so we can
// truncate a clone at the static stage byte boundary and cache it. We don't
// know if `l` is present until React decodes the payload, so always tee and
// cancel the clone if not needed.
let initialFlightStreamForCache = null;
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
let debugChannel;
if (("TURBOPACK compile-time value", "1") && ("TURBOPACK compile-time value", true) && typeof window !== 'undefined') {
    const { createDebugChannel } = (()=>{
        const e = new Error("Cannot find module './dev/debug-channel'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })();
    debugChannel = createDebugChannel(undefined);
}
let initialServerResponse;
if (instantTestStaticFetch) {
    // Instant Navigation Testing API: hydrate from the static RSC payload
    // fetch kicked off by an injected <script> tag, instead of the inline
    // Flight data (which is not present in the static shell).
    initialServerResponse = Promise.resolve(createFromFetch(instantTestStaticFetch, {
        callServer: _appcallserver.callServer,
        findSourceMapURL: _appfindsourcemapurl.findSourceMapURL,
        debugChannel,
        // The static fetch response is a partial stream (static-only Flight
        // data with no dynamic content). Allow it to close without error so
        // React treats dynamic holes as still-suspended rather than
        // triggering error recovery.
        unstable_allowPartialStream: true
    })).then(async (initialRSCPayload)=>{
        return (0, _flightdatahelpers.createInitialRSCPayloadFromFallbackPrerender)(await instantTestStaticFetch, initialRSCPayload);
    });
} else if (window.__NEXT_CLIENT_RESUME) {
    const clientResumeFetch = window.__NEXT_CLIENT_RESUME;
    initialServerResponse = Promise.resolve(createFromFetch(clientResumeFetch, {
        callServer: _appcallserver.callServer,
        findSourceMapURL: _appfindsourcemapurl.findSourceMapURL,
        debugChannel
    })).then(async (fallbackInitialRSCPayload)=>(0, _flightdatahelpers.createInitialRSCPayloadFromFallbackPrerender)(await clientResumeFetch, fallbackInitialRSCPayload));
} else {
    initialServerResponse = createFromReadableStream(readable, {
        callServer: _appcallserver.callServer,
        findSourceMapURL: _appfindsourcemapurl.findSourceMapURL,
        debugChannel,
        startTime: 0
    });
}
function ServerRoot({ initialRSCPayload, actionQueue, webSocket, staticIndicatorState }) {
    const router = /*#__PURE__*/ (0, _jsxruntime.jsx)(_approuter.default, {
        actionQueue: actionQueue,
        globalErrorState: initialRSCPayload.G,
        webSocket: webSocket,
        staticIndicatorState: staticIndicatorState
    });
    if (("TURBOPACK compile-time value", "development") === 'development' && initialRSCPayload.m) {
        // We provide missing slot information in a context provider only during development
        // as we log some additional information about the missing slots in the console.
        return /*#__PURE__*/ (0, _jsxruntime.jsx)(_approutercontextsharedruntime.MissingSlotContext, {
            value: initialRSCPayload.m,
            children: router
        });
    }
    return router;
}
const StrictModeIfEnabled = ("TURBOPACK compile-time truthy", 1) ? _react.default.StrictMode : "TURBOPACK unreachable";
function Root({ children }) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return children;
}
const enableTransitionIndicator = ("TURBOPACK compile-time value", false);
function noDefaultTransitionIndicator() {
    return ()=>{};
}
const reactRootOptions = {
    onDefaultTransitionIndicator: ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : noDefaultTransitionIndicator,
    onRecoverableError: _onrecoverableerror.onRecoverableError,
    onCaughtError: _errorboundarycallbacks.onCaughtError,
    onUncaughtError: _errorboundarycallbacks.onUncaughtError
};
async function hydrate(instrumentationHooks, assetPrefix) {
    let staticIndicatorState;
    let webSocket;
    if ("TURBOPACK compile-time truthy", 1) {
        const { createWebSocket } = (()=>{
            const e = new Error("Cannot find module './dev/hot-reloader/app/web-socket'");
            e.code = 'MODULE_NOT_FOUND';
            throw e;
        })();
        staticIndicatorState = {
            pathname: null,
            appIsrManifest: null
        };
        webSocket = createWebSocket(assetPrefix, staticIndicatorState);
    }
    const initialRSCPayload = await initialServerResponse;
    // setNavigationBuildId should be called only once, during JS initialization
    // and before any components have hydrated.
    if (initialRSCPayload.b) {
        (0, _navigationbuildid.setNavigationBuildId)(initialRSCPayload.b);
    } else {
        (0, _navigationbuildid.setNavigationBuildId)((0, _deploymentid.getDeploymentId)());
    }
    const initialTimestamp = Date.now();
    const actionQueue = (0, _approuterinstance.createMutableActionQueue)((0, _createinitialrouterstate.createInitialRouterState)({
        navigatedAt: initialTimestamp,
        initialRSCPayload,
        initialFlightStreamForCache,
        location: window.location
    }), instrumentationHooks);
    const reactEl = /*#__PURE__*/ (0, _jsxruntime.jsx)(StrictModeIfEnabled, {
        children: /*#__PURE__*/ (0, _jsxruntime.jsx)(_headmanagercontextsharedruntime.HeadManagerContext.Provider, {
            value: {
                appDir: true
            },
            children: /*#__PURE__*/ (0, _jsxruntime.jsx)(Root, {
                children: /*#__PURE__*/ (0, _jsxruntime.jsx)(ServerRoot, {
                    initialRSCPayload: initialRSCPayload,
                    actionQueue: actionQueue,
                    webSocket: webSocket,
                    staticIndicatorState: staticIndicatorState
                })
            })
        })
    });
    if (document.documentElement.id === '__next_error__') {
        let element = reactEl;
        // Server rendering failed, fall back to client-side rendering
        if ("TURBOPACK compile-time truthy", 1) {
            const { RootLevelDevOverlayElement } = (()=>{
                const e = new Error("Cannot find module '../next-devtools/userspace/app/client-entry'");
                e.code = 'MODULE_NOT_FOUND';
                throw e;
            })();
            // Note this won't cause hydration mismatch because we are doing CSR w/o hydration
            element = /*#__PURE__*/ (0, _jsxruntime.jsx)(RootLevelDevOverlayElement, {
                children: element
            });
        }
        _client.default.createRoot(appElement, reactRootOptions).render(element);
    } else {
        _react.default.startTransition(()=>{
            _client.default.hydrateRoot(appElement, reactEl, {
                ...reactRootOptions,
                formState: initialFormStateData
            });
        });
    }
    // TODO-APP: Remove this logic when Float has GC built-in in development.
    if ("TURBOPACK compile-time truthy", 1) {
        const { linkGc } = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/client/app-link-gc.js [app-client] (ecmascript)");
        linkGc();
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
"[project]/store-builder/node_modules/next/dist/client/app-next-turbopack.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
(()=>{
    const e = new Error("Cannot find module './register-deployment-id-global'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const _appbootstrap = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/client/app-bootstrap.js [app-client] (ecmascript)");
const _onrecoverableerror = (()=>{
    const e = new Error("Cannot find module './react-client-callbacks/on-recoverable-error'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
window.next.turbopack = true;
self.__webpack_hash__ = '';
// eslint-disable-next-line @next/internal/typechecked-require
const instrumentationHooks = (()=>{
    const e = new Error("Cannot find module '../lib/require-instrumentation-client'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
(0, _appbootstrap.appBootstrap)((assetPrefix)=>{
    const { hydrate } = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/client/app-index.js [app-client] (ecmascript)");
    try {
        hydrate(instrumentationHooks, assetPrefix);
    } finally{
        if ("TURBOPACK compile-time truthy", 1) {
            const enableCacheIndicator = ("TURBOPACK compile-time value", false);
            const { getOwnerStack } = (()=>{
                const e = new Error("Cannot find module '../next-devtools/userspace/app/errors/stitched-error'");
                e.code = 'MODULE_NOT_FOUND';
                throw e;
            })();
            const { renderAppDevOverlay } = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/next-devtools/index.js (raw)");
            renderAppDevOverlay(getOwnerStack, _onrecoverableerror.isRecoverableError, enableCacheIndicator);
        }
    }
});
if ((typeof exports.default === 'function' || typeof exports.default === 'object' && exports.default !== null) && typeof exports.default.__esModule === 'undefined') {
    Object.defineProperty(exports.default, '__esModule', {
        value: true
    });
    Object.assign(exports.default, exports);
    module.exports = exports.default;
}
}),
]);

//# sourceMappingURL=1k36_next_dist_18-ld3x._.js.map
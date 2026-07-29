(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/store-builder/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$store$2d$builder$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/store-builder/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    module.exports = (()=>{
        const e = new Error("Cannot find module './cjs/react.development.js'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })();
}
}),
"[project]/store-builder/node_modules/next/dist/compiled/react/cjs/react-jsx-runtime.development.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$store$2d$builder$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/store-builder/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ "use strict";
"production" !== ("TURBOPACK compile-time value", "development") && function() {
    function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch(type){
            case REACT_FRAGMENT_TYPE:
                return "Fragment";
            case REACT_PROFILER_TYPE:
                return "Profiler";
            case REACT_STRICT_MODE_TYPE:
                return "StrictMode";
            case REACT_SUSPENSE_TYPE:
                return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
                return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
                return "Activity";
            case REACT_VIEW_TRANSITION_TYPE:
                return "ViewTransition";
        }
        if ("object" === typeof type) switch("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof){
            case REACT_PORTAL_TYPE:
                return "Portal";
            case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
            case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                    return getComponentNameFromType(type(innerType));
                } catch (x) {}
        }
        return null;
    }
    function testStringCoercion(value) {
        return "" + value;
    }
    function checkKeyStringCoercion(value) {
        try {
            testStringCoercion(value);
            var JSCompiler_inline_result = !1;
        } catch (e) {
            JSCompiler_inline_result = !0;
        }
        if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
            return testStringCoercion(value);
        }
    }
    function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE) return "<...>";
        try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
        } catch (x) {
            return "<...>";
        }
    }
    function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
    }
    function UnknownOwner() {
        return Error("react-stack-top-frame");
    }
    function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return !1;
        }
        return void 0 !== config.key;
    }
    function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
        }
        warnAboutAccessingKey.isReactWarning = !0;
        Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: !0
        });
    }
    function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
    }
    function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type: type,
            key: key,
            props: props,
            _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
            enumerable: !1,
            get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", {
            enumerable: !1,
            value: null
        });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: null
        });
        Object.defineProperty(type, "_debugStack", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
    }
    function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children) if (isStaticChildren) if (isArrayImpl(children)) {
            for(isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)validateChildKeys(children[isStaticChildren]);
            Object.freeze && Object.freeze(children);
        } else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
        else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
            children = getComponentNameFromType(type);
            var keys = Object.keys(config).filter(function(k) {
                return "key" !== k;
            });
            isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
            didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error('A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />', isStaticChildren, children, keys, children), didWarnAboutKeySpread[children + isStaticChildren] = !0);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
            maybeKey = {};
            for(var propName in config)"key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(maybeKey, "function" === typeof type ? type.displayName || type.name || "Unknown" : type);
        return ReactElement(type, children, maybeKey, getOwner(), debugStack, debugTask);
    }
    function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
    }
    function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    var React = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition"), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
    };
    React = {
        react_stack_bottom_frame: function(callStackForError) {
            return callStackForError();
        }
    };
    var specialPropKeyWarningShown;
    var didWarnAboutElementRef = {};
    var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(React, UnknownOwner)();
    var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
    var didWarnAboutKeySpread = {};
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsx = function(type, config, maybeKey) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        if (trackActualOwner) {
            var previousStackTraceLimit = Error.stackTraceLimit;
            Error.stackTraceLimit = 10;
            var debugStackDEV = Error("react-stack-top-frame");
            Error.stackTraceLimit = previousStackTraceLimit;
        } else debugStackDEV = unknownOwnerDebugStack;
        return jsxDEVImpl(type, config, maybeKey, !1, debugStackDEV, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
    };
    exports.jsxs = function(type, config, maybeKey) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        if (trackActualOwner) {
            var previousStackTraceLimit = Error.stackTraceLimit;
            Error.stackTraceLimit = 10;
            var debugStackDEV = Error("react-stack-top-frame");
            Error.stackTraceLimit = previousStackTraceLimit;
        } else debugStackDEV = unknownOwnerDebugStack;
        return jsxDEVImpl(type, config, maybeKey, !0, debugStackDEV, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
    };
}();
}),
"[project]/store-builder/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$store$2d$builder$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/store-builder/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    module.exports = __turbopack_context__.r("[project]/store-builder/node_modules/next/dist/compiled/react/cjs/react-jsx-runtime.development.js [app-client] (ecmascript)");
}
}),
"[project]/store-builder/node_modules/next/dist/compiled/safe-stable-stringify/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

(function() {
    "use strict";
    var e = {
        879: function(e, t) {
            const { hasOwnProperty: n } = Object.prototype;
            const r = configure();
            r.configure = configure;
            r.stringify = r;
            r.default = r;
            t.stringify = r;
            t.configure = configure;
            e.exports = r;
            const i = /[\u0000-\u001f\u0022\u005c\ud800-\udfff]/;
            function strEscape(e) {
                if (e.length < 5e3 && !i.test(e)) {
                    return `"${e}"`;
                }
                return JSON.stringify(e);
            }
            function sort(e, t) {
                if (e.length > 200 || t) {
                    return e.sort(t);
                }
                for(let t = 1; t < e.length; t++){
                    const n = e[t];
                    let r = t;
                    while(r !== 0 && e[r - 1] > n){
                        e[r] = e[r - 1];
                        r--;
                    }
                    e[r] = n;
                }
                return e;
            }
            const f = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Object.getPrototypeOf(new Int8Array)), Symbol.toStringTag).get;
            function isTypedArrayWithEntries(e) {
                return f.call(e) !== undefined && e.length !== 0;
            }
            function stringifyTypedArray(e, t, n) {
                if (e.length < n) {
                    n = e.length;
                }
                const r = t === "," ? "" : " ";
                let i = `"0":${r}${e[0]}`;
                for(let f = 1; f < n; f++){
                    i += `${t}"${f}":${r}${e[f]}`;
                }
                return i;
            }
            function getCircularValueOption(e) {
                if (n.call(e, "circularValue")) {
                    const t = e.circularValue;
                    if (typeof t === "string") {
                        return `"${t}"`;
                    }
                    if (t == null) {
                        return t;
                    }
                    if (t === Error || t === TypeError) {
                        return {
                            toString () {
                                throw new TypeError("Converting circular structure to JSON");
                            }
                        };
                    }
                    throw new TypeError('The "circularValue" argument must be of type string or the value null or undefined');
                }
                return '"[Circular]"';
            }
            function getDeterministicOption(e) {
                let t;
                if (n.call(e, "deterministic")) {
                    t = e.deterministic;
                    if (typeof t !== "boolean" && typeof t !== "function") {
                        throw new TypeError('The "deterministic" argument must be of type boolean or comparator function');
                    }
                }
                return t === undefined ? true : t;
            }
            function getBooleanOption(e, t) {
                let r;
                if (n.call(e, t)) {
                    r = e[t];
                    if (typeof r !== "boolean") {
                        throw new TypeError(`The "${t}" argument must be of type boolean`);
                    }
                }
                return r === undefined ? true : r;
            }
            function getPositiveIntegerOption(e, t) {
                let r;
                if (n.call(e, t)) {
                    r = e[t];
                    if (typeof r !== "number") {
                        throw new TypeError(`The "${t}" argument must be of type number`);
                    }
                    if (!Number.isInteger(r)) {
                        throw new TypeError(`The "${t}" argument must be an integer`);
                    }
                    if (r < 1) {
                        throw new RangeError(`The "${t}" argument must be >= 1`);
                    }
                }
                return r === undefined ? Infinity : r;
            }
            function getItemCount(e) {
                if (e === 1) {
                    return "1 item";
                }
                return `${e} items`;
            }
            function getUniqueReplacerSet(e) {
                const t = new Set;
                for (const n of e){
                    if (typeof n === "string" || typeof n === "number") {
                        t.add(String(n));
                    }
                }
                return t;
            }
            function getStrictOption(e) {
                if (n.call(e, "strict")) {
                    const t = e.strict;
                    if (typeof t !== "boolean") {
                        throw new TypeError('The "strict" argument must be of type boolean');
                    }
                    if (t) {
                        return (e)=>{
                            let t = `Object can not safely be stringified. Received type ${typeof e}`;
                            if (typeof e !== "function") t += ` (${e.toString()})`;
                            throw new Error(t);
                        };
                    }
                }
            }
            function configure(e) {
                e = {
                    ...e
                };
                const t = getStrictOption(e);
                if (t) {
                    if (e.bigint === undefined) {
                        e.bigint = false;
                    }
                    if (!("circularValue" in e)) {
                        e.circularValue = Error;
                    }
                }
                const n = getCircularValueOption(e);
                const r = getBooleanOption(e, "bigint");
                const i = getDeterministicOption(e);
                const f = typeof i === "function" ? i : undefined;
                const u = getPositiveIntegerOption(e, "maximumDepth");
                const o = getPositiveIntegerOption(e, "maximumBreadth");
                function stringifyFnReplacer(e, s, l, c, a, g) {
                    let p = s[e];
                    if (typeof p === "object" && p !== null && typeof p.toJSON === "function") {
                        p = p.toJSON(e);
                    }
                    p = c.call(s, e, p);
                    switch(typeof p){
                        case "string":
                            return strEscape(p);
                        case "object":
                            {
                                if (p === null) {
                                    return "null";
                                }
                                if (l.indexOf(p) !== -1) {
                                    return n;
                                }
                                let e = "";
                                let t = ",";
                                const r = g;
                                if (Array.isArray(p)) {
                                    if (p.length === 0) {
                                        return "[]";
                                    }
                                    if (u < l.length + 1) {
                                        return '"[Array]"';
                                    }
                                    l.push(p);
                                    if (a !== "") {
                                        g += a;
                                        e += `\n${g}`;
                                        t = `,\n${g}`;
                                    }
                                    const n = Math.min(p.length, o);
                                    let i = 0;
                                    for(; i < n - 1; i++){
                                        const n = stringifyFnReplacer(String(i), p, l, c, a, g);
                                        e += n !== undefined ? n : "null";
                                        e += t;
                                    }
                                    const f = stringifyFnReplacer(String(i), p, l, c, a, g);
                                    e += f !== undefined ? f : "null";
                                    if (p.length - 1 > o) {
                                        const n = p.length - o - 1;
                                        e += `${t}"... ${getItemCount(n)} not stringified"`;
                                    }
                                    if (a !== "") {
                                        e += `\n${r}`;
                                    }
                                    l.pop();
                                    return `[${e}]`;
                                }
                                let s = Object.keys(p);
                                const y = s.length;
                                if (y === 0) {
                                    return "{}";
                                }
                                if (u < l.length + 1) {
                                    return '"[Object]"';
                                }
                                let d = "";
                                let h = "";
                                if (a !== "") {
                                    g += a;
                                    t = `,\n${g}`;
                                    d = " ";
                                }
                                const $ = Math.min(y, o);
                                if (i && !isTypedArrayWithEntries(p)) {
                                    s = sort(s, f);
                                }
                                l.push(p);
                                for(let n = 0; n < $; n++){
                                    const r = s[n];
                                    const i = stringifyFnReplacer(r, p, l, c, a, g);
                                    if (i !== undefined) {
                                        e += `${h}${strEscape(r)}:${d}${i}`;
                                        h = t;
                                    }
                                }
                                if (y > o) {
                                    const n = y - o;
                                    e += `${h}"...":${d}"${getItemCount(n)} not stringified"`;
                                    h = t;
                                }
                                if (a !== "" && h.length > 1) {
                                    e = `\n${g}${e}\n${r}`;
                                }
                                l.pop();
                                return `{${e}}`;
                            }
                        case "number":
                            return isFinite(p) ? String(p) : t ? t(p) : "null";
                        case "boolean":
                            return p === true ? "true" : "false";
                        case "undefined":
                            return undefined;
                        case "bigint":
                            if (r) {
                                return String(p);
                            }
                        default:
                            return t ? t(p) : undefined;
                    }
                }
                function stringifyArrayReplacer(e, i, f, s, l, c) {
                    if (typeof i === "object" && i !== null && typeof i.toJSON === "function") {
                        i = i.toJSON(e);
                    }
                    switch(typeof i){
                        case "string":
                            return strEscape(i);
                        case "object":
                            {
                                if (i === null) {
                                    return "null";
                                }
                                if (f.indexOf(i) !== -1) {
                                    return n;
                                }
                                const e = c;
                                let t = "";
                                let r = ",";
                                if (Array.isArray(i)) {
                                    if (i.length === 0) {
                                        return "[]";
                                    }
                                    if (u < f.length + 1) {
                                        return '"[Array]"';
                                    }
                                    f.push(i);
                                    if (l !== "") {
                                        c += l;
                                        t += `\n${c}`;
                                        r = `,\n${c}`;
                                    }
                                    const n = Math.min(i.length, o);
                                    let a = 0;
                                    for(; a < n - 1; a++){
                                        const e = stringifyArrayReplacer(String(a), i[a], f, s, l, c);
                                        t += e !== undefined ? e : "null";
                                        t += r;
                                    }
                                    const g = stringifyArrayReplacer(String(a), i[a], f, s, l, c);
                                    t += g !== undefined ? g : "null";
                                    if (i.length - 1 > o) {
                                        const e = i.length - o - 1;
                                        t += `${r}"... ${getItemCount(e)} not stringified"`;
                                    }
                                    if (l !== "") {
                                        t += `\n${e}`;
                                    }
                                    f.pop();
                                    return `[${t}]`;
                                }
                                f.push(i);
                                let a = "";
                                if (l !== "") {
                                    c += l;
                                    r = `,\n${c}`;
                                    a = " ";
                                }
                                let g = "";
                                for (const e of s){
                                    const n = stringifyArrayReplacer(e, i[e], f, s, l, c);
                                    if (n !== undefined) {
                                        t += `${g}${strEscape(e)}:${a}${n}`;
                                        g = r;
                                    }
                                }
                                if (l !== "" && g.length > 1) {
                                    t = `\n${c}${t}\n${e}`;
                                }
                                f.pop();
                                return `{${t}}`;
                            }
                        case "number":
                            return isFinite(i) ? String(i) : t ? t(i) : "null";
                        case "boolean":
                            return i === true ? "true" : "false";
                        case "undefined":
                            return undefined;
                        case "bigint":
                            if (r) {
                                return String(i);
                            }
                        default:
                            return t ? t(i) : undefined;
                    }
                }
                function stringifyIndent(e, s, l, c, a) {
                    switch(typeof s){
                        case "string":
                            return strEscape(s);
                        case "object":
                            {
                                if (s === null) {
                                    return "null";
                                }
                                if (typeof s.toJSON === "function") {
                                    s = s.toJSON(e);
                                    if (typeof s !== "object") {
                                        return stringifyIndent(e, s, l, c, a);
                                    }
                                    if (s === null) {
                                        return "null";
                                    }
                                }
                                if (l.indexOf(s) !== -1) {
                                    return n;
                                }
                                const t = a;
                                if (Array.isArray(s)) {
                                    if (s.length === 0) {
                                        return "[]";
                                    }
                                    if (u < l.length + 1) {
                                        return '"[Array]"';
                                    }
                                    l.push(s);
                                    a += c;
                                    let e = `\n${a}`;
                                    const n = `,\n${a}`;
                                    const r = Math.min(s.length, o);
                                    let i = 0;
                                    for(; i < r - 1; i++){
                                        const t = stringifyIndent(String(i), s[i], l, c, a);
                                        e += t !== undefined ? t : "null";
                                        e += n;
                                    }
                                    const f = stringifyIndent(String(i), s[i], l, c, a);
                                    e += f !== undefined ? f : "null";
                                    if (s.length - 1 > o) {
                                        const t = s.length - o - 1;
                                        e += `${n}"... ${getItemCount(t)} not stringified"`;
                                    }
                                    e += `\n${t}`;
                                    l.pop();
                                    return `[${e}]`;
                                }
                                let r = Object.keys(s);
                                const g = r.length;
                                if (g === 0) {
                                    return "{}";
                                }
                                if (u < l.length + 1) {
                                    return '"[Object]"';
                                }
                                a += c;
                                const p = `,\n${a}`;
                                let y = "";
                                let d = "";
                                let h = Math.min(g, o);
                                if (isTypedArrayWithEntries(s)) {
                                    y += stringifyTypedArray(s, p, o);
                                    r = r.slice(s.length);
                                    h -= s.length;
                                    d = p;
                                }
                                if (i) {
                                    r = sort(r, f);
                                }
                                l.push(s);
                                for(let e = 0; e < h; e++){
                                    const t = r[e];
                                    const n = stringifyIndent(t, s[t], l, c, a);
                                    if (n !== undefined) {
                                        y += `${d}${strEscape(t)}: ${n}`;
                                        d = p;
                                    }
                                }
                                if (g > o) {
                                    const e = g - o;
                                    y += `${d}"...": "${getItemCount(e)} not stringified"`;
                                    d = p;
                                }
                                if (d !== "") {
                                    y = `\n${a}${y}\n${t}`;
                                }
                                l.pop();
                                return `{${y}}`;
                            }
                        case "number":
                            return isFinite(s) ? String(s) : t ? t(s) : "null";
                        case "boolean":
                            return s === true ? "true" : "false";
                        case "undefined":
                            return undefined;
                        case "bigint":
                            if (r) {
                                return String(s);
                            }
                        default:
                            return t ? t(s) : undefined;
                    }
                }
                function stringifySimple(e, s, l) {
                    switch(typeof s){
                        case "string":
                            return strEscape(s);
                        case "object":
                            {
                                if (s === null) {
                                    return "null";
                                }
                                if (typeof s.toJSON === "function") {
                                    s = s.toJSON(e);
                                    if (typeof s !== "object") {
                                        return stringifySimple(e, s, l);
                                    }
                                    if (s === null) {
                                        return "null";
                                    }
                                }
                                if (l.indexOf(s) !== -1) {
                                    return n;
                                }
                                let t = "";
                                const r = s.length !== undefined;
                                if (r && Array.isArray(s)) {
                                    if (s.length === 0) {
                                        return "[]";
                                    }
                                    if (u < l.length + 1) {
                                        return '"[Array]"';
                                    }
                                    l.push(s);
                                    const e = Math.min(s.length, o);
                                    let n = 0;
                                    for(; n < e - 1; n++){
                                        const e = stringifySimple(String(n), s[n], l);
                                        t += e !== undefined ? e : "null";
                                        t += ",";
                                    }
                                    const r = stringifySimple(String(n), s[n], l);
                                    t += r !== undefined ? r : "null";
                                    if (s.length - 1 > o) {
                                        const e = s.length - o - 1;
                                        t += `,"... ${getItemCount(e)} not stringified"`;
                                    }
                                    l.pop();
                                    return `[${t}]`;
                                }
                                let c = Object.keys(s);
                                const a = c.length;
                                if (a === 0) {
                                    return "{}";
                                }
                                if (u < l.length + 1) {
                                    return '"[Object]"';
                                }
                                let g = "";
                                let p = Math.min(a, o);
                                if (r && isTypedArrayWithEntries(s)) {
                                    t += stringifyTypedArray(s, ",", o);
                                    c = c.slice(s.length);
                                    p -= s.length;
                                    g = ",";
                                }
                                if (i) {
                                    c = sort(c, f);
                                }
                                l.push(s);
                                for(let e = 0; e < p; e++){
                                    const n = c[e];
                                    const r = stringifySimple(n, s[n], l);
                                    if (r !== undefined) {
                                        t += `${g}${strEscape(n)}:${r}`;
                                        g = ",";
                                    }
                                }
                                if (a > o) {
                                    const e = a - o;
                                    t += `${g}"...":"${getItemCount(e)} not stringified"`;
                                }
                                l.pop();
                                return `{${t}}`;
                            }
                        case "number":
                            return isFinite(s) ? String(s) : t ? t(s) : "null";
                        case "boolean":
                            return s === true ? "true" : "false";
                        case "undefined":
                            return undefined;
                        case "bigint":
                            if (r) {
                                return String(s);
                            }
                        default:
                            return t ? t(s) : undefined;
                    }
                }
                function stringify(e, t, n) {
                    if (arguments.length > 1) {
                        let r = "";
                        if (typeof n === "number") {
                            r = " ".repeat(Math.min(n, 10));
                        } else if (typeof n === "string") {
                            r = n.slice(0, 10);
                        }
                        if (t != null) {
                            if (typeof t === "function") {
                                return stringifyFnReplacer("", {
                                    "": e
                                }, [], t, r, "");
                            }
                            if (Array.isArray(t)) {
                                return stringifyArrayReplacer("", e, [], getUniqueReplacerSet(t), r, "");
                            }
                        }
                        if (r.length !== 0) {
                            return stringifyIndent("", e, [], r, "");
                        }
                    }
                    return stringifySimple("", e, []);
                }
                return stringify;
            }
        }
    };
    var t = {};
    function __nccwpck_require__(n) {
        var r = t[n];
        if (r !== undefined) {
            return r.exports;
        }
        var i = t[n] = {
            exports: {}
        };
        var f = true;
        try {
            e[n](i, i.exports, __nccwpck_require__);
            f = false;
        } finally{
            if (f) delete t[n];
        }
        return i.exports;
    }
    if (typeof __nccwpck_require__ !== "undefined") __nccwpck_require__.ab = ("TURBOPACK compile-time value", "/ROOT/store-builder/node_modules/next/dist/compiled/safe-stable-stringify") + "/";
    var n = __nccwpck_require__(879);
    module.exports = n;
})();
}),
"[project]/store-builder/node_modules/next/dist/compiled/scheduler/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$store$2d$builder$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/store-builder/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    module.exports = (()=>{
        const e = new Error("Cannot find module './cjs/scheduler.development.js'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })();
}
}),
"[project]/store-builder/node_modules/next/dist/compiled/strip-ansi/index.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

(()=>{
    "use strict";
    var e = {
        511: (e)=>{
            e.exports = ({ onlyFirst: e = false } = {})=>{
                const r = [
                    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
                    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"
                ].join("|");
                return new RegExp(r, e ? undefined : "g");
            };
        },
        532: (e, r, _)=>{
            const t = _(511);
            e.exports = (e)=>typeof e === "string" ? e.replace(t(), "") : e;
        }
    };
    var r = {};
    function __nccwpck_require__(_) {
        var t = r[_];
        if (t !== undefined) {
            return t.exports;
        }
        var a = r[_] = {
            exports: {}
        };
        var n = true;
        try {
            e[_](a, a.exports, __nccwpck_require__);
            n = false;
        } finally{
            if (n) delete r[_];
        }
        return a.exports;
    }
    if (typeof __nccwpck_require__ !== "undefined") __nccwpck_require__.ab = ("TURBOPACK compile-time value", "/ROOT/store-builder/node_modules/next/dist/compiled/strip-ansi") + "/";
    var _ = __nccwpck_require__(532);
    module.exports = _;
})();
}),
]);

//# sourceMappingURL=1k36_next_dist_compiled_1wcrxhr._.js.map
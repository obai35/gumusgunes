(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push(["chunks/[root-of-the-server]__13jvavz._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/src/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/spec-extension/response.js [middleware-edge] (ecmascript)");
;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map((o)=>o.trim());
const CSRF_EXEMPT = [
    '/api/csp-report',
    '/api/payments/stripe/webhook',
    '/api/whatsapp/webhook',
    '/api/integrations/meta/webhook'
];
const MAX_BODY_BYTES = 500_000;
function isValidOrigin(origin, requestOrigin) {
    if (!origin) return false;
    if (requestOrigin && origin === requestOrigin) return true;
    return ALLOWED_ORIGINS.some((allowed)=>origin === allowed || origin === allowed.replace(/\/$/, ''));
}
function middleware(request) {
    const { pathname } = request.nextUrl;
    const start = Date.now();
    if (pathname.startsWith('/preview')) {
        const response = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
        response.headers.set('X-Frame-Options', 'SAMEORIGIN');
        return response;
    }
    if (CSRF_EXEMPT.some((p)=>pathname === p || pathname.startsWith(p + '/'))) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    if (pathname.startsWith('/api')) {
        if ([
            'POST',
            'PUT',
            'PATCH'
        ].includes(request.method)) {
            const contentLength = request.headers.get('content-length');
            if (contentLength && parseInt(contentLength) > MAX_BODY_BYTES) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'Request too large'
                }, {
                    status: 413
                });
            }
        }
        const response = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
        const origin = request.headers.get('origin');
        if (origin && isValidOrigin(origin, request.nextUrl.origin)) {
            response.headers.set('Access-Control-Allow-Origin', origin);
            response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-csrf-token');
            response.headers.set('Access-Control-Allow-Credentials', 'true');
        }
        if (request.method === 'OPTIONS') {
            return response;
        }
        if ([
            'GET',
            'HEAD',
            'OPTIONS'
        ].includes(request.method)) {
            return response;
        }
        const referer = request.headers.get('referer');
        const ownOrigin = request.nextUrl.origin;
        if (origin && !isValidOrigin(origin, ownOrigin)) {
            console.warn('[CSRF] Invalid origin:', origin, 'for', request.method, pathname);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Invalid origin'
            }, {
                status: 403
            });
        }
        if (!origin && referer) {
            try {
                const refererUrl = new URL(referer);
                if (!isValidOrigin(refererUrl.origin, ownOrigin)) {
                    console.warn('[CSRF] Invalid referer:', referer, 'for', request.method, pathname);
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        error: 'Invalid origin'
                    }, {
                        status: 403
                    });
                }
            } catch  {
                console.warn('[CSRF] Invalid referer URL:', referer, 'for', request.method, pathname);
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'Invalid origin'
                }, {
                    status: 403
                });
            }
        }
        const duration = Date.now() - start;
        if (duration > 100) {
            console.log(`[API] ${request.method} ${pathname} ${duration}ms`);
        }
        return response;
    }
    const pageRes = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    pageRes.headers.set('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.paypal.com https://accounts.google.com https://www.google.com https://www.gstatic.com",
        "frame-src https://js.stripe.com https://www.paypal.com https://accounts.google.com",
        "connect-src 'self' https://api.stripe.com https://www.paypal.com https://accounts.google.com",
        "img-src 'self' data: blob: https:",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "report-uri /api/csp-report"
    ].join('; '));
    return pageRes;
}
const config = {
    matcher: [
        '/',
        '/((?!api/|_next/|static/|favicon.ico).*)'
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__13jvavz._.js.map
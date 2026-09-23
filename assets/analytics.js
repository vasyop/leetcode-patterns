/**
 * PostHog product analytics and session replay for the book.
 *
 * The book reports into the same PostHog project as the upDATE app (same public
 * project key), so every event from here carries `site: 'book'` as a super
 * property. Filter recordings and insights on that property (or on
 * `$host = vasyop.github.io`) to see the book on its own.
 *
 * The SDK loads once the page is idle, so it never competes with the first
 * chapter render. Pageviews are captured by hand from app.js, because the viewer
 * routes through the hash and only a chapter change counts as a new page.
 */
(() => {
    'use strict';

    const API_KEY = 'phc_y63p3kr6CMGbikVsekmNbGZHm9Fu77TSaRRsj8xjxYf8';
    const API_HOST = 'https://eu.i.posthog.com';
    const SDK_URL = 'https://eu-assets.i.posthog.com/static/array.js';
    const SITE = 'book';

    // keep a local preview out of the numbers
    if (!/\.github\.io$/.test(location.hostname)) {
        window.bookAnalytics = { page() {} };
        return;
    }

    let posthog = null;
    const pending = [];

    const capturePage = (route, title) =>
        posthog.capture('$pageview', {
            $current_url: location.href,
            book_route: route || 'README',
            book_title: title,
        });

    window.bookAnalytics = {
        page(route, title) {
            if (posthog) {
                capturePage(route, title);
            } else {
                pending.push([route, title]);
            }
        },
    };

    function load() {
        const script = document.createElement('script');
        script.src = SDK_URL;
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.onload = () => {
            if (!window.posthog?.init) {
                return;
            }
            window.posthog.init(API_KEY, {
                api_host: API_HOST,
                defaults: '2026-05-30',
                capture_pageview: false,
                capture_pageleave: true,
                person_profiles: 'never',
                session_recording: {
                    sampleRate: 1,
                    // the only input is the search field, and seeing what readers look for is the point
                    maskAllInputs: false,
                },
                loaded: (instance) => {
                    instance.register({ site: SITE });
                    posthog = instance;
                    for (const [route, title] of pending.splice(0)) {
                        capturePage(route, title);
                    }
                },
            });
        };
        document.head.append(script);
    }

    const whenIdle = () => (window.requestIdleCallback ? requestIdleCallback(load, { timeout: 5000 }) : setTimeout(load, 1200));
    if (document.readyState === 'complete') {
        whenIdle();
    } else {
        window.addEventListener('load', whenIdle, { once: true });
    }
})();

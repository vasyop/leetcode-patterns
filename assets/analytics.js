/**
 * PostHog product analytics and session replay for the book.
 *
 * The book reports into the same PostHog project as the upDATE app (same public
 * project key), so every event from here carries `site: 'book'` as a super
 * property. Filter recordings and insights on that property (or on
 * `$host = vasyop.github.io`) to see the book on its own.
 *
 * The SDK waits until the first chapter has painted and the main thread is idle.
 * Waiting for `load` alone is not enough: it fires before the viewer has even
 * fetched the chapter, so the SDK and recorder would compete with it. Pageviews
 * are captured by hand from app.js, because the viewer routes through the hash
 * and only a chapter change counts as a new page.
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
                scheduleLoad();
            }
        },
    };

    let scheduled = false;
    let started = false;

    // Once the recorder starts it snapshots the whole page, so starting a little
    // late loses nothing on screen, only the first seconds of scrolling.
    const SETTLE_MS = 2000;

    /*
     * app.js calls page() just before it renders the chapter. The chapter's text is
     * the largest paint, and it can move again when the web fonts arrive, so wait
     * for the fonts, two frames for the paint, then a settle delay and an idle slot.
     */
    function scheduleLoad() {
        if (scheduled) {
            return;
        }
        scheduled = true;
        const fonts = document.fonts?.ready ?? Promise.resolve();
        fonts.then(() => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(whenIdle, SETTLE_MS))));
    }

    const whenIdle = () => (window.requestIdleCallback ? requestIdleCallback(load, { timeout: 4000 }) : setTimeout(load, 1500));

    function load() {
        if (started) {
            return;
        }
        started = true;
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
                disable_surveys: true,
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

    // a page that never renders a chapter (the manifest failed, say) still gets recorded
    window.addEventListener('load', () => setTimeout(whenIdle, 5000), { once: true });
})();

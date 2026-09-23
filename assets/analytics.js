/**
 * PostHog product analytics and session replay for the book.
 *
 * The book reports into the same PostHog project as the upDATE app (same public
 * project key), so every event from here carries `site: 'book'` as a super
 * property. Filter recordings and insights on that property (or on
 * `$host = vasyop.github.io`) to see the book on its own.
 *
 * Nothing is loaded or recorded unless the URL carries `?utm_source=<value>`, so
 * only visitors who arrive through a tagged link (an ad, a post) are tracked,
 * and the author reading the plain URL never shows up. The value is registered
 * on every event as `utm_source`, so recordings can be filtered by it. The
 * viewer only ever changes the hash, so the query survives chapter changes and
 * reloads within the visit.
 *
 * This runs from <head> and starts the SDK download straight away, so the
 * recorder is up as early as possible and misses as little of the visit as it
 * can. That costs some page load time, which is an accepted trade. Pageviews are
 * captured by hand from app.js, because the viewer routes through the hash and
 * only a chapter change counts as a new page; any that come before the SDK is
 * ready are queued.
 */
(() => {
    'use strict';

    const API_KEY = 'phc_y63p3kr6CMGbikVsekmNbGZHm9Fu77TSaRRsj8xjxYf8';
    const API_HOST = 'https://eu.i.posthog.com';
    const SDK_URL = 'https://eu-assets.i.posthog.com/static/array.js';
    const SITE = 'book';

    const SOURCE = new URLSearchParams(location.search).get('utm_source')?.trim();

    // keep local previews and untagged visits (the author's own, say) out of the numbers
    if (!/\.github\.io$/.test(location.hostname) || !SOURCE) {
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
                disable_surveys: true,
                session_recording: {
                    sampleRate: 1,
                    // the only input is the search field, and seeing what readers look for is the point
                    maskAllInputs: false,
                },
                loaded: (instance) => {
                    instance.register({ site: SITE, utm_source: SOURCE });
                    posthog = instance;
                    for (const [route, title] of pending.splice(0)) {
                        capturePage(route, title);
                    }
                },
            });
        };
        document.head.append(script);
    }

    load();
})();

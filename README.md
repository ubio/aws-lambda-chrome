# AWS Lambda compatible Chrome

This repository wraps a custom build of Chrome suitable for use on AWS lambda.

## Usage

Requiring this module augments the `LD_LIBRARY_PATH` and `PATH` in order for
chrome to find a custom build of NSS. This is necessary because the build of
NSS on lambda is too old for newer versions of Chrome to boot with.

```es6
const { chromePath } = require('aws-lambda-chrome');
const { spawn } = require('child_process');

chromeProcess = spawn(chromePath, effectiveArgs, {
    env: process.env,
    /* TODO add required args here */
});
```

## CLI Arguments

We have tested Chrome with following list of arguments:

```
--proxy-server=XXX
--remote-debugging-port=XXX
--user-data-dir=XXX
--disable-background-networking
--disable-breakpad
--disable-canvas-aa
--disable-client-side-phishing-detection
--disable-cloud-import
--disable-composited-antialiasing
--disable-default-apps
--disable-extensions-http-throttling
--disable-gpu
--disable-gpu-sandbox
--disable-kill-after-bad-ipc
--disable-namespace-sandbox
--disable-plugins
--disable-print-preview
--disable-renderer-backgrounding
--disable-seccomp-filter-sandbox
--disable-setuid-sandbox
--disable-smooth-scrolling
--disable-sync
--disable-translate
--disable-translate-new-ux
--disable-webgl
--disk-cache-dir=/tmp/cache-dir
--disk-cache-size=10000000
--ipc-connection-timeout=10000
--media-cache-size=10000000
--nacl-dangerous-no-sandbox-nonsfi
--no-default-browser-check
--no-experiments
--no-first-run
--no-pings
--no-sandbox
--no-zygote
--prerender-from-omnibox=disabled
--single-process
--window-size=1280,720
```

Note: these are provided only for reference. They are not guaranteed to work, and most of them are probably redundant.

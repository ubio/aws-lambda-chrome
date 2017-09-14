# AWS Lambda compatible Chrome

This repository wraps a custom build of Chrome suitable for use on AWS lambda.

## Usage

Requiring this module augments the `LD_LIBRARY_PATH` and `PATH` in order for
chrome to find a custom build of NSS. This is necessary because the build of
NSS on lambda is too old for newer versions of Chrome to boot with.

```javascript
const { chromePath } = require('aws-lambda-chrome');
const { spawn } = require('child_process');

chromeProcess = spawn(chromePath, effectiveArgs, {
    env: process.env,
    /* TODO add required args here */
});

// ...
```

'use strict';

const fs = require('fs');
const path = require('path');

const extractDir = path.resolve(__dirname, 'extract');
const headlessDir = path.join(extractDir, 'headless_shell');
const pathToNss = path.join(extractDir, 'nss', fs.readFileSync(path.join(extractDir, 'nss', 'latest'), 'utf8').trim());

process.env.LD_LIBRARY_PATH = path.join(pathToNss, 'lib') + ':' + process.env.LD_LIBRARY_PATH,
process.env.PATH = path.join(pathToNss, 'bin') + ':' + process.env.PATH,

exports.chromePath = headlessDir;

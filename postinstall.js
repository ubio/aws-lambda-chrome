'use strict';

const archivesBaseUrl = process.env.npm_package_archivesBaseUrl;

const path = require('path');
const tar = require('tar');
const rimraf = require('rimraf');
const fs = require('fs');
const http = require(archivesBaseUrl.startsWith('https') ? 'https' : 'http');

const chromePath = `/chrome/${process.env.npm_package_archives_chromeFileName}`;
const nssPath = `/nss/${process.env.npm_package_archives_nssFileName}`;
const extractPath = path.resolve(__dirname, 'extract');

function removeExtractDir() {
    return new Promise((resolve, reject) => {
        rimraf(extractPath, err => err ? reject(err) : resolve());
    });
}

function makeExtractDir() {
    return new Promise((resolve, reject) => {
        fs.mkdir(extractPath, err => err ? reject(err) : resolve());
    });
}

function download(path, destination) {
    return new Promise((resolve, reject) => {
        const req = http.get(archivesBaseUrl + path, res => {
            if (res.statusCode < 200 || res.statusCode > 299) {
                return reject(new Error(`Unexpected status code from GitHub: ${res.statusCode}`));
            }

            res.on('error', reject);
            res.pipe(tar.x({ C: destination }));
        });

        req.on('end', () => resolve());
        req.on('error', reject);
    });
}

console.log('Downloading compiled chrome components.');

removeExtractDir()
    .then(() => makeExtractDir())
    .then(() => Promise.all([
        download(chromePath, extractPath),
        download(nssPath, extractPath),
    ]))
    .then(() => console.log('Finished downloading chrome components.'))
    .catch(err => {
        console.error('Error downloading chrome.', err);
        process.exit(1);
    });

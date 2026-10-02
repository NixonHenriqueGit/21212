const fs = require('fs');
const path = require('path');
const { mergeDataset } = require('./merge_util.cjs');

// Let's also check if retro parser or direct dataset can be enriched
console.log('Running direct merge utility...');
const maySample = require('../src/data/quebrasMayToAug2026.json');
mergeDataset(maySample);

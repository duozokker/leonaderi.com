import fs from 'fs';
import { PNG } from 'pngjs';

const haystack = PNG.sync.read(fs.readFileSync('leonaderi-world-export/map-composite.png'));
const needle = PNG.sync.read(fs.readFileSync('leonaderi-world-export/objects/5ff7d2d4-eadb-4cde-a5af-8ee10048aa26.png')); // flower patch

let found = false;
for (let y = 0; y <= haystack.height - needle.height; y++) {
    for (let x = 0; x <= haystack.width - needle.width; x++) {
        let match = true;
        for (let ny = 0; ny < needle.height; ny++) {
            for (let nx = 0; nx < needle.width; nx++) {
                const nIdx = (needle.width * ny + nx) << 2;
                if (needle.data[nIdx + 3] > 0) {
                    const hIdx = (haystack.width * (y + ny) + (x + nx)) << 2;
                    if (
                        needle.data[nIdx] !== haystack.data[hIdx] ||
                        needle.data[nIdx + 1] !== haystack.data[hIdx + 1] ||
                        needle.data[nIdx + 2] !== haystack.data[hIdx + 2]
                    ) {
                        match = false; break;
                    }
                }
            }
            if (!match) break;
        }
        if (match) {
            console.log(`Flower patch found at top-left x=${x}, y=${y}`);
            found = true; break;
        }
    }
    if (found) break;
}

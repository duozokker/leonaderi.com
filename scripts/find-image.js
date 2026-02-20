import fs from 'fs';
import { PNG } from 'pngjs';

const haystack = PNG.sync.read(fs.readFileSync('leonaderi-world-export/map-composite.png'));
const needle = PNG.sync.read(fs.readFileSync('leonaderi-world-export/objects/e28517cb-7b07-41f3-b23b-ac77ab827544.png')); // company hall

console.log(`Haystack: ${haystack.width}x${haystack.height}`);
console.log(`Needle: ${needle.width}x${needle.height}`);

let found = false;
for (let y = 0; y <= haystack.height - needle.height; y++) {
    for (let x = 0; x <= haystack.width - needle.width; x++) {
        let match = true;
        for (let ny = 0; ny < needle.height; ny++) {
            for (let nx = 0; nx < needle.width; nx++) {
                const nIdx = (needle.width * ny + nx) << 2;
                const hIdx = (haystack.width * (y + ny) + (x + nx)) << 2;
                
                // Only check opaque pixels of the needle
                if (needle.data[nIdx + 3] > 0) {
                    if (
                        needle.data[nIdx] !== haystack.data[hIdx] ||
                        needle.data[nIdx + 1] !== haystack.data[hIdx + 1] ||
                        needle.data[nIdx + 2] !== haystack.data[hIdx + 2]
                    ) {
                        match = false;
                        break;
                    }
                }
            }
            if (!match) break;
        }
        if (match) {
            console.log(`Found exact match at top-left x=${x}, y=${y}`);
            const center_x = x + needle.width / 2;
            const center_y = y + needle.height / 2;
            console.log(`Which means center is x=${center_x}, y=${center_y}`);
            found = true;
            break;
        }
    }
    if (found) break;
}
if (!found) console.log("Not found!");

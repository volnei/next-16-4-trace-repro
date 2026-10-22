import { mkdirSync, openSync, closeSync, ftruncateSync } from "node:fs";

// Stands in for a real app's public/ assets. Sparse file, so it costs no disk.
mkdirSync("public/assets", { recursive: true });
const fd = openSync("public/assets/large.bin", "w");
ftruncateSync(fd, 260 * 1024 * 1024);
closeSync(fd);

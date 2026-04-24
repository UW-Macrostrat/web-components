import process from "node:process";
import { resolve } from "node:path";
async function run() {
    const mod = await import("./index.js");
    const { bundleLibrary } = mod;
    const dirToBundle = process.argv[2] || ".";
    await bundleLibrary(resolve(dirToBundle));
}
run().catch((err) => {
    console.error("Error during execution:", err);
    process.exit(1);
});

import { promises as fs } from "node:fs";
import path from "node:path";
import { subDir } from "./workspace.js";
function textInputPath(slug) {
    return path.join(subDir(slug, "inputs"), "text-input.md");
}
export async function readTextInputs(slug) {
    let raw;
    try {
        raw = await fs.readFile(textInputPath(slug), "utf-8");
    }
    catch {
        return [];
    }
    const entries = [];
    const blocks = raw.split("\n---\n").map((b) => b.trim()).filter(Boolean);
    for (const block of blocks) {
        const timestampMatch = block.match(/^\[(.+?)\]\s+\((.+?)\)/);
        const questionMatch = block.match(/Q:\s*(.*)/);
        const answerMatch = block.match(/A:\s*([\s\S]*)/);
        if (timestampMatch && questionMatch && answerMatch) {
            entries.push({
                timestamp: timestampMatch[1],
                skill: timestampMatch[2],
                question: questionMatch[1].trim(),
                answer: answerMatch[1].trim(),
            });
        }
    }
    return entries;
}
export async function appendTextInput(slug, entry) {
    const block = `[${entry.timestamp}] (${entry.skill})\nQ: ${entry.question}\nA: ${entry.answer}\n---\n`;
    await fs.appendFile(textInputPath(slug), block, "utf-8");
}
export async function listInputFiles(slug) {
    try {
        const entries = await fs.readdir(subDir(slug, "inputs"), { withFileTypes: true });
        return entries.filter((e) => e.isFile() && e.name !== "text-input.md").map((e) => e.name);
    }
    catch {
        return [];
    }
}
export async function listOutputFiles(slug) {
    try {
        const entries = await fs.readdir(subDir(slug, "outputs"), { withFileTypes: true });
        return entries.filter((e) => e.isFile()).map((e) => e.name);
    }
    catch {
        return [];
    }
}

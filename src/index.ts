import * as core from "@actions/core";
import * as github from "@actions/github";
import { Octokit } from "@octokit/rest";
import yaml from "yaml";
import packageJson from "../package.json";

type Cache = Awaited<
    ReturnType<Octokit["rest"]["actions"]["getActionsCacheList"]>
>["data"]["actions_caches"][number];

let octokit: Octokit;
let hadWarning = false;

main().catch((err) => core.setFailed(`❌ ${err.message}`));

async function main(): Promise<void> {
    const token = core.getInput("github-token", { required: true });
    const refsInput = core.getInput("ref", { required: true });
    const failOnWarning = core.getInput("fail-on-warning") === "true";
    const refs = parseRefs(refsInput);
    octokit = new Octokit({ auth: token });
    core.info(
        `🛠️ Running Friedinger/DeleteBranchCaches@v${packageJson.version}`
    );

    let deletedSize = 0;
    let totalCaches = 0;
    for (const ref of refs) {
        const { size, count } = await deleteCachesForRef(ref);
        deletedSize += size;
        totalCaches += count;
    }
    core.info(
        `✅ Deleted ${totalCaches} cache${
            totalCaches === 1 ? "" : "s"
        } with a total size of ${formatSize(deletedSize)}.`
    );
    if (failOnWarning && hadWarning) {
        core.setFailed("⚠️ Action failed due to warning(s).");
    }
}

async function deleteCachesForRef(
    ref: string
): Promise<{ size: number; count: number }> {
    const caches = await octokit.rest.actions.getActionsCacheList({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        ref: ref,
    });
    const count = caches.data.actions_caches.length;
    let deletedSize = 0;
    let deletedCount = 0;
    core.info(
        `📦 ${count} cache${count === 1 ? "" : "s"} found for ref "${ref}"`
    );
    for (const cache of caches.data.actions_caches) {
        const { success, size } = await deleteCache(cache);
        if (success) deletedCount++;
        deletedSize += size;
    }
    return { size: deletedSize, count: deletedCount };
}

async function deleteCache(
    cache: Cache
): Promise<{ success: boolean; size: number }> {
    try {
        if (!cache.id) throw new Error("Missing cache.id");
        await octokit.rest.actions.deleteActionsCacheById({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            cache_id: cache.id,
        });
        core.info(
            `🗑️ Deleted cache ${cache.id} with key "${cache.key}" on ref "${
                cache.ref
            }", created at ${formatDate(cache.created_at ?? "")}"`
        );
        return { success: true, size: cache.size_in_bytes ?? 0 };
    } catch (error) {
        hadWarning = true;
        core.warning(`⚠️ Could not delete cache ${cache.id}: ${error}`);
        return { success: false, size: 0 };
    }
}

function parseRefs(refsInput: string): string[] {
    const refsParsed = yaml.parse(refsInput);
    if (Array.isArray(refsParsed)) {
        return refsParsed
            .map((ref) => String(ref).trim())
            .filter((ref) => ref.length > 0);
    } else if (typeof refsParsed === "string") {
        return [refsParsed.trim()];
    } else {
        throw new TypeError("ref input must be a string or array");
    }
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString().replaceAll(",", "");
}

function formatSize(bytes: number): string {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
    }
    return `${bytes.toFixed(2)} ${units[i]}`;
}

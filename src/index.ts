import * as core from "@actions/core";
import * as github from "@actions/github";
import { Octokit } from "@octokit/rest";
import yaml from "yaml";
import packageJson from "../package.json";

type Cache = Awaited<
	ReturnType<Octokit["rest"]["actions"]["getActionsCacheList"]>
>["data"]["actions_caches"][number];

let octokit: Octokit;

main().catch((err) => core.setFailed(`❌ ${err.message}`));

async function main(): Promise<void> {
	const token = core.getInput("github-token", { required: true });
	const refsInput = core.getInput("ref", { required: true });
	const refs = parseRefs(refsInput);
	octokit = new Octokit({ auth: token });
	core.info(
		`🛠️ Running Friedinger/DeleteBranchCaches@v${packageJson.version}`
	);

	let deletedSize = 0;
	for (const ref of refs) {
		deletedSize += await deleteCachesForRef(ref);
	}
	core.info(
		`✅ All caches with a total size of ${formatSize(
			deletedSize
		)} have been deleted successfully.`
	);
}

async function deleteCachesForRef(ref: string): Promise<number> {
	const caches = await octokit.rest.actions.getActionsCacheList({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		ref: ref,
	});
	const count = caches.data.actions_caches.length;
	let deletedSize = 0;
	core.info(
		`📦 ${count} cache${count === 1 ? "" : "s"} found for ref "${ref}"`
	);
	for (const cache of caches.data.actions_caches) {
		deletedSize += await deleteCache(cache);
	}
	return deletedSize;
}

async function deleteCache(cache: Cache): Promise<number> {
	if (!cache.id) return 0;
	await octokit.rest.actions.deleteActionsCacheById({
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		cache_id: cache.id,
	});
	core.info(
		`🗑️ Deleted cache ${cache.id} with key "${cache.key}" on ref "${
			cache.ref
		}", created at ${formatDate(cache.created_at!)}`
	);
	return cache.size_in_bytes ?? 0;
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
		throw new Error("ref input must be a string or array");
	}
}

function formatDate(dateString: string): string {
	return new Date(dateString).toLocaleString().replace(/,/g, "");
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

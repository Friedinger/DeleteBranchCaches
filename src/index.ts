import * as core from "@actions/core";
import * as github from "@actions/github";
import { Octokit } from "@octokit/rest";
import yaml from "yaml";

async function main(): Promise<void> {
	const token = core.getInput("github-token", { required: true });
	const refsInput = core.getInput("ref", { required: true });
	let refs: string[];
	const refsParsed = yaml.parse(refsInput);
	if (Array.isArray(refsParsed)) {
		refs = refsParsed
			.map((r: any) => String(r).trim())
			.filter((r: string) => r.length > 0);
	} else if (typeof refsParsed === "string") {
		refs = [refsParsed.trim()];
	} else {
		throw new Error("ref input must be a string or array");
	}

	const octokit = new Octokit({ auth: token });
	const context = github.context;

	let totalSize = 0;
	for (const ref of refs) {
		const caches = await octokit.rest.actions.getActionsCacheList({
			owner: context.repo.owner,
			repo: context.repo.repo,
			ref: ref,
		});
		const count = caches.data.actions_caches.length;
		core.info(
			`📦 ${count} cache${count === 1 ? "" : "s"} found for ref "${ref}"`
		);
		for (const cache of caches.data.actions_caches) {
			if (!cache.id) continue;
			await octokit.rest.actions.deleteActionsCacheById({
				owner: context.repo.owner,
				repo: context.repo.repo,
				cache_id: cache.id,
			});
			totalSize += cache.size_in_bytes ?? 0;
			const message = `🗑️ Deleted cache ${cache.id} with key "${
				cache.key
			}" on ref "${cache.ref}", created at ${new Date(cache.created_at!)
				.toLocaleString()
				.replace(/,/g, "")}`;
			core.info(message);
		}
	}
	core.info(
		`✅ All caches with a total size of ${formatSize(
			totalSize
		)} have been deleted successfully.`
	);
}

function formatSize(bytes: number): string {
	if (bytes >= 1024 * 1024 * 1024)
		return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
	if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
	if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
	return `${bytes} B`;
}

main().catch((err) => core.setFailed(`❌ ${err.message}`));

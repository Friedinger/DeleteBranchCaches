import * as core from "@actions/core";
import * as github from "@actions/github";
import { Octokit } from "@octokit/rest";

async function main(): Promise<void> {
	const token = core.getInput("github-token", { required: true });
	const ref = core.getInput("ref", { required: true });
	const octokit = new Octokit({ auth: token });
	const context = github.context;

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
		if (!cache.id) return;
		await octokit.rest.actions.deleteActionsCacheById({
			owner: context.repo.owner,
			repo: context.repo.repo,
			cache_id: cache.id,
		});
		const message = [
			"🗑️ Deleted cache:",
			`  - ID: ${cache.id}`,
			`  - Key: ${cache.key}`,
			`  - Ref: ${cache.ref}`,
			`  - Created at: ${new Date(cache.created_at!).toLocaleString()}`,
			`  - Size: ${(cache.size_in_bytes! / (1024 * 1024)).toFixed(2)} MB`,
		];
		core.info(message.join("\n"));
	}
	core.info(`✅ All caches for ref "${ref}" have been deleted successfully.`);
}

main().catch((err) => core.setFailed(`❌ ${err.message}`));

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
	core.info(
		`Found ${caches.data.actions_caches.length} caches for ref: ${ref}`
	);
	for (const cache of caches.data.actions_caches) {
		if (!cache.id) return;
		await octokit.rest.actions.deleteActionsCacheById({
			owner: context.repo.owner,
			repo: context.repo.repo,
			cache_id: cache.id,
		});
		core.info(`Cleared cache: ${cache.id}`);
	}
}

main().catch((err) => core.setFailed(err.message));

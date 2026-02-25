import { readObsidianJson } from "../utils/vault.ts";
import type { CommandContext } from "./shared.ts";
import type { ContextResult } from "../types.ts";

type WorkspaceNode = {
	id?: string;
	type?: string;
	state?: {
		type?: string;
		state?: {
			file?: string;
			query?: string;
		};
	};
	children?: WorkspaceNode[];
};

type WorkspaceJson = {
	main?: WorkspaceNode;
	left?: WorkspaceNode;
	right?: WorkspaceNode;
	active?: string;
	lastOpenFiles?: string[];
};

function findLeaves({
	node,
	leaves,
}: {
	node: WorkspaceNode;
	leaves: Array<{ id: string; file: string }>;
}): void {
	if (node.type === "leaf" && node.state?.state?.file) {
		leaves.push({
			id: node.id ?? "",
			file: node.state.state.file,
		});
	}
	for (const child of node.children ?? []) {
		findLeaves({ node: child, leaves });
	}
}

function findSearch({ node }: { node: WorkspaceNode }): string | null {
	if (node.type === "leaf" && node.state?.type === "search") {
		return node.state.state?.query ?? null;
	}
	for (const child of node.children ?? []) {
		const result = findSearch({ node: child });
		if (result !== null) {
			return result;
		}
	}
	return null;
}

export async function context({ ctx }: { ctx: CommandContext }): Promise<ContextResult> {
	const workspace = await readObsidianJson<WorkspaceJson>({
		vault: ctx.vault,
		filename: "workspace.json",
	});

	if (!workspace) {
		return {
			vault: ctx.vault.name,
			active_file: null,
			recent_files: [],
			last_search: null,
			open_tabs: [],
		};
	}

	// Extract open tabs from main split
	const tabs: Array<{ id: string; file: string }> = [];
	if (workspace.main) {
		findLeaves({ node: workspace.main, leaves: tabs });
	}

	// Find active file by matching active leaf ID
	const activeId = workspace.active;
	const activeTab = tabs.find((t) => t.id === activeId);
	const activeFile = activeTab?.file ?? null;

	// Recent files (filter to .md only)
	const recentFiles = (workspace.lastOpenFiles ?? []).filter((f) =>
		f.endsWith(".md"),
	);

	// Search query from left/right sidebars
	let lastSearch: string | null = null;
	if (workspace.left) {
		lastSearch = findSearch({ node: workspace.left });
	}
	if (lastSearch === null && workspace.right) {
		lastSearch = findSearch({ node: workspace.right });
	}

	return {
		vault: ctx.vault.name,
		active_file: activeFile,
		recent_files: recentFiles,
		last_search: lastSearch,
		open_tabs: tabs.map((t) => t.file),
	};
}

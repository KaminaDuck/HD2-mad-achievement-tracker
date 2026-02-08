declare module "@opencode-ai/plugin" {
  export interface Project {
    id: string;
    worktree: string;
    vcsDir?: string;
    vcs?: "git";
    time: {
      created: number;
      initialized?: number;
    };
  }

  export interface PluginInput {
    project: Project;
    directory: string;
    worktree: string;
  }

  export interface PluginEvent {
    type: string;
    properties?: Record<string, unknown>;
  }

  export interface ToolExecuteInput {
    tool?: string;
    id?: string;
    args?: unknown;
  }

  export interface ToolExecuteOutput {
    args?: unknown;
    result?: unknown;
    error?: Error;
  }

  export interface PluginHooks {
    event?: (payload: { event: PluginEvent }) => Promise<void>;
    "tool.execute.before"?: (input: ToolExecuteInput, output: ToolExecuteOutput) => Promise<void>;
    "tool.execute.after"?: (input: ToolExecuteInput, output: ToolExecuteOutput) => Promise<void>;
  }

  export type Plugin = (input: PluginInput) => Promise<PluginHooks>;
}

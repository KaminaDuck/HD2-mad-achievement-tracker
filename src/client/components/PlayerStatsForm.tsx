import { useForm } from "@tanstack/react-form";
import {
  createPlayerStatsSchema,
  type CreatePlayerStats,
  type StatKey,
} from "@/shared/schemas/stats.ts";
import type { Confidence } from "@/server/services/parser.ts";

interface StatFieldDef {
  key: StatKey;
  label: string;
}

interface StatGroupDef {
  label: string;
  fields: StatFieldDef[];
}

const STAT_GROUPS: StatGroupDef[] = [
  {
    label: "Kills",
    fields: [
      { key: "enemyKills", label: "Enemy Kills" },
      { key: "terminidKills", label: "Terminid Kills" },
      { key: "automatonKills", label: "Automaton Kills" },
      { key: "illuminateKills", label: "Illuminate Kills" },
      { key: "friendlyKills", label: "Friendly Kills" },
      { key: "grenadeKills", label: "Grenade Kills" },
      { key: "meleeKills", label: "Melee Kills" },
      { key: "eagleKills", label: "Eagle Kills" },
    ],
  },
  {
    label: "Missions",
    fields: [
      { key: "missionsPlayed", label: "Missions Played" },
      { key: "missionsWon", label: "Missions Won" },
      { key: "inMissionTimeSeconds", label: "In-Mission Time (seconds)" },
    ],
  },
  {
    label: "Accuracy",
    fields: [
      { key: "shotsFired", label: "Shots Fired" },
      { key: "shotsHit", label: "Shots Hit" },
    ],
  },
  {
    label: "Stratagems",
    fields: [
      { key: "orbitalsUsed", label: "Orbitals Used" },
      { key: "eagleStratagems", label: "Eagle Stratagems" },
      { key: "supplyStratagems", label: "Supply Stratagems" },
      { key: "defensiveStratagems", label: "Defensive Stratagems" },
      { key: "reinforceStratagems", label: "Reinforce Stratagems" },
      { key: "totalStratagems", label: "Total Stratagems" },
    ],
  },
  {
    label: "Other",
    fields: [
      { key: "deaths", label: "Deaths" },
      { key: "objectivesCompleted", label: "Objectives Completed" },
      { key: "samplesCollected", label: "Samples Collected" },
      { key: "totalXp", label: "Total XP" },
    ],
  },
];

const ALL_STAT_KEYS = STAT_GROUPS.flatMap((g) => g.fields.map((f) => f.key));

function buildDefaults(
  partial?: Partial<Record<StatKey, number>>,
  playerName?: string,
): CreatePlayerStats {
  const stats = {} as Record<StatKey, number>;
  for (const key of ALL_STAT_KEYS) {
    stats[key] = partial?.[key] ?? 0;
  }
  return { playerName: playerName ?? "", ...stats };
}

interface PlayerStatsFormProps {
  defaultStats?: Partial<Record<StatKey, number>>;
  defaultPlayerName?: string;
  confidence?: Partial<Record<StatKey, Confidence>>;
  onSubmit: (data: CreatePlayerStats) => void;
  isPending: boolean;
  error?: string | null;
}

export function PlayerStatsForm({
  defaultStats,
  defaultPlayerName,
  confidence,
  onSubmit,
  isPending,
  error,
}: PlayerStatsFormProps) {
  const form = useForm({
    defaultValues: buildDefaults(defaultStats, defaultPlayerName),
    validators: { onSubmit: createPlayerStatsSchema },
    onSubmit: ({ value }) => onSubmit(value),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      {/* Player Name */}
      <form.Field name="playerName">
        {(field) => (
          <div>
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-gray-300"
            >
              Player Name
            </label>
            <input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 focus:border-yellow-500 focus:outline-none"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="mt-1 text-sm text-red-400">
                {field.state.meta.errors[0]?.message ?? String(field.state.meta.errors[0])}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* Stat Groups */}
      {STAT_GROUPS.map((group) => (
        <fieldset key={group.label}>
          <legend className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
            {group.label}
          </legend>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.fields.map((fieldDef) => (
              <form.Field key={fieldDef.key} name={fieldDef.key}>
                {(field) => {
                  const conf = confidence?.[fieldDef.key];
                  const isLowConfidence = conf === "position";
                  return (
                    <div>
                      <label
                        htmlFor={field.name}
                        className="block text-sm text-gray-400"
                      >
                        {fieldDef.label}
                        {isLowConfidence && (
                          <span className="ml-1 text-amber-500" title="Low confidence — verify this value">
                            *
                          </span>
                        )}
                      </label>
                      <input
                        id={field.name}
                        type="number"
                        min={0}
                        value={field.state.value}
                        onChange={(e) =>
                          field.handleChange(
                            e.target.value === ""
                              ? 0
                              : parseInt(e.target.value, 10) || 0,
                          )
                        }
                        onBlur={field.handleBlur}
                        className={`mt-1 w-full rounded-md border px-3 py-2 font-mono text-gray-100 focus:outline-none ${
                          isLowConfidence
                            ? "border-amber-500/50 bg-amber-950/20 focus:border-amber-500"
                            : "border-gray-700 bg-gray-800 focus:border-yellow-500"
                        }`}
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="mt-1 text-sm text-red-400">
                          {field.state.meta.errors[0]?.message ?? String(field.state.meta.errors[0])}
                        </p>
                      )}
                    </div>
                  );
                }}
              </form.Field>
            ))}
          </div>
        </fieldset>
      ))}

      {error && (
        <div className="rounded-md border border-red-800 bg-red-950 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {confidence && (
        <p className="text-sm text-amber-500">
          * Fields marked with an asterisk had low OCR confidence — please
          verify them.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-yellow-600 px-6 py-2 font-medium text-gray-950 transition-colors hover:bg-yellow-500 disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save Stats"}
      </button>
    </form>
  );
}

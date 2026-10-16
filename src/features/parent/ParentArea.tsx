import clsx from 'clsx';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useId, useMemo, useState } from 'react';

import { useNav } from '@/app/nav';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { parseWordList, parseWordSet } from '@/features/parent/parseWordList';
import type { Theme } from '@/game/types';
import {
  deleteCustomList,
  resetProgress,
  saveCustomList,
  setCustomDefinition,
  setWordRules,
  updateSettings,
} from '@/store/actions';
import { useAppData } from '@/store/appStore';

import type { FormEvent } from 'react';

type Tab = 'lists' | 'rules' | 'settings';
const LIST_ICONS = ['📝', '🏫', '⭐', '🌍', '🔤', '🧪', '🎨', '🏠'];

function ParentGate({ onPass }: { onPass: () => void }) {
  const { go } = useNav();
  const [[a, b]] = useState(() => [
    6 + Math.floor(Math.random() * 4),
    6 + Math.floor(Math.random() * 4),
  ]);
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);
  const id = useId();
  const check = (e: FormEvent) => {
    e.preventDefault();
    if (Number(answer) === (a ?? 0) * (b ?? 0)) {
      onPass();
    } else {
      setWrong(true);
      setAnswer('');
    }
  };
  return (
    <Modal open title="Grown-ups only" onClose={() => go('home')}>
      <form onSubmit={check}>
        <label htmlFor={id} className="mt-2 block text-ink-soft">
          To change word lists and settings, answer this: what is {a} × {b}?
        </label>
        <input
          id={id}
          inputMode="numeric"
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value.replace(/\D/g, ''));
            setWrong(false);
          }}
          className="mt-3 h-14 w-full rounded-2xl border-2 border-parchment-400 bg-white/70 px-4 text-2xl outline-none focus:border-gilt-500"
          aria-invalid={wrong}
        />
        {wrong && (
          <p className="mt-2 font-semibold text-ruby">
            That’s not it. Try again.
          </p>
        )}
        <div className="mt-5 flex gap-3">
          <Button className="flex-1" onClick={() => go('home')}>
            Cancel
          </Button>
          <Button type="submit" variant="gilt" className="flex-1">
            Continue
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ListEditor({
  list,
  onDone,
}: {
  list: Theme | null;
  onDone: () => void;
}) {
  const definitions = useAppData((d) => d.custom.definitions);
  const [name, setName] = useState(list?.name ?? '');
  const [icon, setIcon] = useState(list?.icon ?? LIST_ICONS[0] ?? '📝');
  const [text, setText] = useState(
    () =>
      list?.words
        .map((w) =>
          definitions[w]
            ? `${w.toLowerCase()} - ${definitions[w].definition}`
            : w.toLowerCase()
        )
        .join('\n') ?? ''
  );
  const parsed = useMemo(() => parseWordList(text), [text]);
  const nameId = useId();
  const wordsId = useId();

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || parsed.entries.length < 2) {
      return;
    }
    saveCustomList({
      id: list?.id ?? `custom-${Date.now().toString(36)}`,
      name: name.trim(),
      icon,
      words: parsed.entries.map((e) => e.word),
    });
    for (const entry of parsed.entries) {
      if (entry.definition) {
        setCustomDefinition(entry.word, { definition: entry.definition });
      }
    }
    onDone();
  };

  return (
    <form onSubmit={save} className="paper rounded-[24px] p-5">
      <h3 className="font-display text-2xl font-semibold">
        {list ? 'Edit word list' : 'New word list'}
      </h3>
      <label htmlFor={nameId} className="mt-4 block font-bold">
        List name
      </label>
      <input
        id={nameId}
        value={name}
        maxLength={24}
        onChange={(e) => setName(e.target.value)}
        placeholder="This week’s spelling words"
        className="mt-1 h-12 w-full rounded-xl border-2 border-parchment-400 bg-white/70 px-3 outline-none focus:border-gilt-500"
      />
      <fieldset className="mt-4">
        <legend className="font-bold">Icon</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {LIST_ICONS.map((i) => (
            <button
              key={i}
              type="button"
              aria-pressed={icon === i}
              onClick={() => setIcon(i)}
              className={clsx(
                'grid size-11 place-items-center rounded-xl text-2xl',
                icon === i
                  ? 'bg-gilt-300 ring-2 ring-gilt-700'
                  : 'bg-parchment-200'
              )}
            >
              {i}
            </button>
          ))}
        </div>
      </fieldset>
      <label htmlFor={wordsId} className="mt-4 block font-bold">
        Words
      </label>
      <p className="text-sm text-ink-soft">
        One word per line. Add a meaning after a dash to show it on the word
        card, like “planet - a big ball that goes around a star”.
      </p>
      <textarea
        id={wordsId}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        className="mt-2 w-full rounded-xl border-2 border-parchment-400 bg-white/70 p-3 font-mono text-sm outline-none focus:border-gilt-500"
      />
      <p className="mt-1 text-sm text-ink-soft">
        {parsed.entries.length} words ready
        {parsed.entries.length < 2 && ' (add at least 2)'}
      </p>
      {parsed.problems.length > 0 && (
        <ul className="mt-2 text-sm text-ruby">
          {parsed.problems.slice(0, 5).map((p) => (
            <li key={p.line}>
              “{p.line}”: {p.reason}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-5 flex gap-3">
        <Button className="flex-1" onClick={onDone}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="gilt"
          className="flex-1"
          disabled={!name.trim() || parsed.entries.length < 2}
        >
          Save list
        </Button>
      </div>
    </form>
  );
}

function ListsTab() {
  const lists = useAppData((d) => d.custom.lists);
  const [editing, setEditing] = useState<Theme | 'new' | null>(null);

  if (editing) {
    return (
      <ListEditor
        list={editing === 'new' ? null : editing}
        onDone={() => setEditing(null)}
      />
    );
  }
  return (
    <div>
      <p className="text-parchment-300">
        Make your own themes for Word Search, like a spelling list from school.
        Meanings you add show up on the word cards.
      </p>
      <ul className="mt-4 flex flex-col gap-2">
        {lists.map((l) => (
          <li
            key={l.id}
            className="wood flex items-center gap-3 rounded-2xl px-4 py-3"
          >
            <span className="text-2xl" aria-hidden>
              {l.icon}
            </span>
            <span className="flex-1">
              <span className="block font-bold text-parchment-50">
                {l.name}
              </span>
              <span className="text-sm text-parchment-300">
                {l.words.length} words
              </span>
            </span>
            <Button size="sm" onClick={() => setEditing(l)}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => deleteCustomList(l.id)}
              aria-label={`Delete ${l.name}`}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
      <Button variant="gilt" className="mt-4" onClick={() => setEditing('new')}>
        <Plus className="size-5" aria-hidden /> New word list
      </Button>
    </div>
  );
}

function RulesTab() {
  const allowed = useAppData((d) => d.custom.allowed);
  const blocked = useAppData((d) => d.custom.blocked);
  const [allowText, setAllowText] = useState(allowed.join(', ').toLowerCase());
  const [blockText, setBlockText] = useState(blocked.join(', ').toLowerCase());
  const [saved, setSaved] = useState(false);
  const allowId = useId();
  const blockId = useId();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setWordRules(parseWordSet(allowText), parseWordSet(blockText));
        setSaved(true);
      }}
    >
      <p className="text-parchment-300">
        Word Worm accepts about 168,000 English words, with rude words already
        removed. Fine-tune it here.
      </p>
      <label
        htmlFor={allowId}
        className="mt-5 block font-bold text-parchment-50"
      >
        Extra words to allow
      </label>
      <p className="text-sm text-parchment-300">
        Names, family words or made-up words you want to count.
      </p>
      <textarea
        id={allowId}
        value={allowText}
        onChange={(e) => {
          setAllowText(e.target.value);
          setSaved(false);
        }}
        rows={3}
        placeholder="nana, popo, ava"
        className="mt-2 w-full rounded-xl bg-parchment-100 p-3 text-ink outline-none focus:ring-4 focus:ring-gilt-300/60"
      />
      <label
        htmlFor={blockId}
        className="mt-5 block font-bold text-parchment-50"
      >
        Words to block
      </label>
      <p className="text-sm text-parchment-300">
        These never count in Word Worm.
      </p>
      <textarea
        id={blockId}
        value={blockText}
        onChange={(e) => {
          setBlockText(e.target.value);
          setSaved(false);
        }}
        rows={3}
        className="mt-2 w-full rounded-xl bg-parchment-100 p-3 text-ink outline-none focus:ring-4 focus:ring-gilt-300/60"
      />
      <div className="mt-4 flex items-center gap-3">
        <Button type="submit" variant="gilt">
          Save word rules
        </Button>
        {saved && <span className="font-semibold text-emerald">Saved</span>}
      </div>
    </form>
  );
}

function SettingsTab() {
  const settings = useAppData((d) => d.settings);
  const profiles = useAppData((d) => d.profiles);
  const [resetId, setResetId] = useState<string | null>(null);
  const resetting = profiles.find((p) => p.id === resetId);

  const toggles: [keyof typeof settings, string, string][] = [
    [
      'speakWords',
      'Read found words aloud',
      'Uses the device’s voice, so it works offline.',
    ],
    ['muted', 'Mute sounds', 'Turns off music and sound effects.'],
  ];

  return (
    <div>
      <ul className="flex flex-col gap-2">
        {toggles.map(([key, label, help]) => (
          <li
            key={key}
            className="wood flex items-center gap-4 rounded-2xl px-4 py-3"
          >
            <span className="flex-1">
              <span className="block font-bold text-parchment-50">{label}</span>
              <span className="text-sm text-parchment-300">{help}</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={settings[key]}
              aria-label={label}
              onClick={() => updateSettings({ [key]: !settings[key] })}
              className={clsx(
                'relative h-8 w-14 rounded-full transition',
                settings[key] ? 'bg-emerald' : 'bg-black/40'
              )}
            >
              <span
                className={clsx(
                  'absolute top-1 size-6 rounded-full bg-parchment-50 shadow transition-all',
                  settings[key] ? 'left-7' : 'left-1'
                )}
              />
            </button>
          </li>
        ))}
      </ul>

      <h3 className="mt-8 font-display text-xl text-parchment-50">Players</h3>
      <ul className="mt-2 flex flex-col gap-2">
        {profiles.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-3 rounded-2xl bg-black/20 px-4 py-2.5"
          >
            <span className="text-2xl" aria-hidden>
              {p.avatar}
            </span>
            <span className="flex-1 font-bold text-parchment-50">{p.name}</span>
            <span className="text-sm text-parchment-300 tabular-nums">
              {p.points.toLocaleString()} points
            </span>
            <Button size="sm" onClick={() => setResetId(p.id)}>
              Reset progress
            </Button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-parchment-300">
        Progress is saved in this browser only. Each device keeps its own
        players.
      </p>

      <Modal
        open={!!resetting}
        onClose={() => setResetId(null)}
        title={`Reset ${resetting?.name ?? ''}’s progress?`}
      >
        <p className="mt-2 text-ink-soft">
          Points, badges, titles and the Word Book go back to zero. The player’s
          name and book stay.
        </p>
        <div className="mt-6 flex gap-3">
          <Button className="flex-1" onClick={() => setResetId(null)}>
            Keep progress
          </Button>
          <Button
            className="flex-1 !bg-ruby !bg-none text-white"
            onClick={() => {
              if (resetId) {
                resetProgress(resetId);
              }
              setResetId(null);
            }}
          >
            Reset progress
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export function ParentArea() {
  const { go } = useNav();
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<Tab>('lists');

  if (!unlocked) {
    return <ParentGate onPass={() => setUnlocked(true)} />;
  }

  const tabs: [Tab, string][] = [
    ['lists', 'Word lists'],
    ['rules', 'Word Worm'],
    ['settings', 'Settings'],
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 pt-4 pb-16">
      <Button variant="ghost" size="sm" onClick={() => go('home')}>
        <ArrowLeft className="size-4" aria-hidden /> Players
      </Button>
      <h1 className="mt-3 font-display text-4xl font-semibold text-parchment-50">
        Grown-ups
      </h1>

      <div
        className="mt-5 flex gap-1 rounded-2xl bg-black/25 p-1"
        role="tablist"
      >
        {tabs.map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={clsx(
              'flex-1 rounded-xl px-2 py-2.5 text-sm font-bold transition sm:px-3 sm:text-base',
              tab === value
                ? 'bg-gilt-300 text-ink'
                : 'text-parchment-200 hover:bg-white/5'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6" role="tabpanel">
        {tab === 'lists' && <ListsTab />}
        {tab === 'rules' && <RulesTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>
    </main>
  );
}

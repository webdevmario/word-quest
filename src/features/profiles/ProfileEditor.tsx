import clsx from 'clsx';
import { ArrowLeft } from 'lucide-react';
import { useId, useState } from 'react';

import { useNav } from '@/app/nav';
import { BookCover } from '@/components/BookCover';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AVATARS, COVERS } from '@/game/appearance';
import { createProfile, deleteProfile, editProfile } from '@/store/actions';
import { useAppData } from '@/store/appStore';

import type { FormEvent } from 'react';

export function ProfileEditor() {
  const { go, editingId } = useNav();
  const profiles = useAppData((d) => d.profiles);
  const existing = profiles.find((p) => p.id === editingId) ?? null;
  const usedColors = profiles.map((p) => p.color);

  const [name, setName] = useState(existing?.name ?? '');
  const [avatar, setAvatar] = useState(
    () =>
      existing?.avatar ??
      AVATARS[Math.floor(Math.random() * AVATARS.length)] ??
      '🦊'
  );
  const [color, setColor] = useState<string>(
    existing?.color ??
      COVERS.find((c) => !usedColors.includes(c.color))?.color ??
      COVERS[0].color
  );
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const nameId = useId();

  const back = () =>
    existing ? go('setup', { profileId: existing.id }) : go('home');

  const save = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Type a name for this player.');
      return;
    }
    if (existing) {
      editProfile(existing.id, { name: trimmed, avatar, color });
      go('setup', { profileId: existing.id });
    } else {
      const p = createProfile({ name: trimmed, avatar, color });
      go('setup', { profileId: p.id });
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <Button variant="ghost" size="sm" onClick={back}>
        <ArrowLeft className="size-4" aria-hidden /> Back
      </Button>

      <form onSubmit={save} className="paper mt-4 rounded-[28px] p-6 sm:p-8">
        <div className="flex flex-col items-center gap-3">
          <BookCover name={name} avatar={avatar} color={color} size="lg" />
          <h2 className="mt-2 font-display text-3xl font-semibold">
            {existing ? 'Edit player' : 'New player'}
          </h2>
        </div>

        <label htmlFor={nameId} className="mt-6 block font-bold">
          Name
        </label>
        <input
          id={nameId}
          value={name}
          maxLength={14}
          autoComplete="off"
          // Focus the name box right away for a new player.
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={!existing}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          placeholder="Type a name"
          aria-invalid={!!error}
          aria-describedby={error ? `${nameId}-error` : undefined}
          className="mt-2 w-full rounded-2xl border-2 border-parchment-400 bg-white/70 px-4 py-3 font-display text-2xl text-ink outline-none focus:border-gilt-500 focus:ring-4 focus:ring-gilt-300/50"
        />
        {error && (
          <p id={`${nameId}-error`} className="mt-2 font-semibold text-ruby">
            {error}
          </p>
        )}

        <fieldset className="mt-6">
          <legend className="font-bold">Pick a buddy</legend>
          <div className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-10">
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={a === avatar}
                aria-label={`Buddy ${a}`}
                onClick={() => setAvatar(a)}
                className={clsx(
                  'grid aspect-square place-items-center rounded-xl text-2xl transition',
                  a === avatar
                    ? 'scale-110 bg-gradient-to-b from-gilt-200 to-gilt-400 shadow-md ring-2 ring-gilt-700'
                    : 'bg-parchment-200/70 hover:bg-parchment-300/70'
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="font-bold">Pick a cover</legend>
          <div className="mt-2 grid grid-cols-5 justify-items-center gap-x-2 gap-y-3 sm:grid-cols-10">
            {COVERS.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={c.color === color}
                aria-label={`${c.name} cover`}
                onClick={() => setColor(c.color)}
                className={clsx(
                  'size-11 rounded-full shadow-inner transition',
                  c.color === color &&
                    'scale-110 ring-4 ring-gilt-400 ring-offset-2 ring-offset-parchment-100'
                )}
                style={{ background: c.color }}
              />
            ))}
          </div>
        </fieldset>

        <Button type="submit" variant="gilt" size="lg" className="mt-8 w-full">
          {existing ? 'Save changes' : 'Create player'}
        </Button>
        {existing && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="mt-4 w-full text-center font-semibold text-ruby underline-offset-4 hover:underline"
          >
            Delete this player
          </button>
        )}
      </form>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Delete ${existing?.name ?? 'player'}?`}
      >
        <p className="mt-2 text-ink-soft">
          This erases their points, badges and Word Book on this device. It
          can’t be undone.
        </p>
        <div className="mt-6 flex gap-3">
          <Button className="flex-1" onClick={() => setConfirmDelete(false)}>
            Keep player
          </Button>
          <Button
            className="flex-1 !bg-ruby !bg-none text-white"
            onClick={() => {
              if (existing) {
                deleteProfile(existing.id);
              }
              go('home', { profileId: null });
            }}
          >
            Delete player
          </Button>
        </div>
      </Modal>
    </main>
  );
}

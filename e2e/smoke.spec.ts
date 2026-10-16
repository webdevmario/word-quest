import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('create a player and start Word Search', async ({ page }) => {
  await page.getByRole('button', { name: 'New player' }).click();
  await page.getByLabel('Name').fill('Ava');
  await page.getByRole('button', { name: 'Create player' }).click();
  await expect(page.getByRole('heading', { name: 'Ava' })).toBeVisible();

  await page.getByRole('button', { name: 'Start Word Search' }).click();
  await expect(page.getByRole('grid')).toBeVisible();
  await expect(page.getByRole('gridcell')).toHaveCount(64);
  await expect(page.getByRole('listitem')).toHaveCount(6);
});

test('Word Worm loads the dictionary and shows the board', async ({ page }) => {
  await page.getByRole('button', { name: 'New player' }).click();
  await page.getByLabel('Name').fill('Leo');
  await page.getByRole('button', { name: 'Create player' }).click();
  await page.getByRole('button', { name: /Word Worm/ }).click();
  await page.getByRole('button', { name: 'Start Word Worm' }).click();
  await expect(
    page.getByRole('grid', { name: 'Word Worm letter tiles' })
  ).toBeVisible();
  await expect(page.getByRole('gridcell')).toHaveCount(56);
  await expect(page.getByText('Opening the dictionary…')).toHaveCount(0);
});

test('grown-ups area is behind a question', async ({ page }) => {
  await page.getByRole('button', { name: 'Grown-ups' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Grown-ups only' })
  ).toBeVisible();
  const question = await page.getByText(/what is \d+ × \d+/).textContent();
  const [, a, b] = /(\d+) × (\d+)/.exec(question ?? '') ?? [];
  await page.getByRole('textbox').fill(String(Number(a) * Number(b)));
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('tab', { name: 'Word lists' })).toBeVisible();
});

test('Word Guess colors a guess', async ({ page }) => {
  await page.getByRole('button', { name: 'New player' }).click();
  await page.getByLabel('Name').fill('Mia');
  await page.getByRole('button', { name: 'Create player' }).click();
  await page.getByRole('button', { name: /Word Guess/ }).click();
  await page.getByRole('radio', { name: /Medium/ }).click();
  await page.getByRole('button', { name: 'Start Word Guess' }).click();
  await expect(page.getByRole('grid', { name: 'Your guesses' })).toBeVisible();
  // Type a common word on the on-screen keyboard.
  for (const letter of 'HOUSE') {
    await page.getByRole('button', { name: new RegExp(`^${letter}$`) }).click();
  }
  await page.getByRole('button', { name: 'Enter guess' }).click();
  await expect(page.getByRole('row', { name: /^HOUSE: / })).toBeVisible();
});

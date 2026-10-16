/** Reads words aloud with the device's built-in voice (works offline). */

export const canSpeak = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(
      (v) => v.lang === 'en-US' && /samantha|google us|aria|jenny/i.test(v.name)
    ) ?? voices.find((v) => v.lang.startsWith('en'))
  );
}

export function speak(text: string, rate = 0.85) {
  if (!canSpeak()) {
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = 1.05;
  const voice = pickVoice();
  if (voice) {
    utterance.voice = voice;
  }
  window.speechSynthesis.speak(utterance);
}

/** Says the word, spells it, then says it again — good for learning. */
export function speakAndSpell(word: string) {
  const lower = word.toLowerCase();
  speak(`${lower}. ${[...lower].join(', ')}. ${lower}.`, 0.8);
}

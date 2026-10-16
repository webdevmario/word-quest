// Static game data: themes, difficulty levels, scoring, titles, badges.
window.WS = window.WS || {};

(function (WS) {
  'use strict';

  const words = (s) => s.trim().split(/\s+/);

  WS.THEMES = {
    animals: {
      name: 'Animals', icon: '🦁',
      words: words(`CAT DOG COW PIG FOX OWL BEE YAK EMU APE BAT HEN BEAR LION FROG DUCK GOAT WOLF DEER SEAL MOLE
        ZEBRA TIGER HORSE MOUSE SHEEP SNAKE KOALA PANDA OTTER CAMEL LLAMA SLOTH RABBIT MONKEY TURTLE PARROT
        JAGUAR DONKEY BEAVER GIRAFFE PENGUIN HAMSTER LEOPARD GORILLA CHEETAH KANGAROO ELEPHANT FLAMINGO
        HEDGEHOG PORCUPINE ALLIGATOR RHINOCEROS HIPPOPOTAMUS`),
    },
    ocean: {
      name: 'Ocean', icon: '🐙',
      words: words(`SEA FIN EEL RAY COD CRAB REEF WAVE TIDE CLAM KELP ORCA SAND BOAT SHELL CORAL WHALE SHARK SQUID
        OCEAN SNAIL PEARL SHRIMP OYSTER ANCHOR DOLPHIN LOBSTER OCTOPUS SEAWEED SEAHORSE STARFISH TREASURE
        JELLYFISH SUBMARINE BARNACLE SEAGULL LIGHTHOUSE STINGRAY`),
    },
    space: {
      name: 'Space', icon: '🚀',
      words: words(`SUN SKY UFO MOON STAR MARS DUST ORBIT COMET ALIEN EARTH VENUS PLUTO LUNAR SPACE SATURN URANUS
        ROCKET PLANET GALAXY METEOR NEBULA COSMOS CRATER LAUNCH MERCURY JUPITER NEPTUNE GRAVITY ECLIPSE
        ASTEROID TELESCOPE ASTRONAUT SATELLITE SPACESHIP`),
    },
    food: {
      name: 'Yummy Food', icon: '🍕',
      words: words(`PIE JAM EGG BUN TEA TACO RICE CAKE SOUP PEAR KIWI CORN PLUM APPLE PIZZA BREAD LEMON MANGO GRAPE
        PASTA HONEY SALAD PEACH COOKIE MUFFIN CHEESE BANANA CARROT WAFFLE BURRITO NOODLES PANCAKE POPCORN
        PRETZEL CUPCAKE AVOCADO SANDWICH BROCCOLI SPAGHETTI WATERMELON STRAWBERRY BLUEBERRY`),
    },
    sports: {
      name: 'Sports', icon: '⚽',
      words: words(`RUN BAT NET SKI GYM JUMP GOAL BALL GOLF SWIM KICK TEAM RACE SKATE SCORE CATCH COACH RUGBY MEDAL
        SPORT HOCKEY SOCCER TENNIS KARATE TROPHY BOWLING CRICKET ARCHERY CYCLING SURFING BASEBALL FOOTBALL
        MARATHON GYMNASTICS BASKETBALL VOLLEYBALL SKATEBOARD`),
    },
    dinos: {
      name: 'Dinosaurs', icon: '🦖',
      words: words(`EGG DINO BONE CLAW TAIL ROAR HORN FERN NEST HERD LAVA ROCK TOOTH SCALE SPIKE SWAMP FOSSIL RAPTOR
        EXTINCT VOLCANO JURASSIC HERBIVORE CARNIVORE IGUANODON DIPLODOCUS TRICERATOPS PTERODACTYL
        SPINOSAURUS VELOCIRAPTOR STEGOSAURUS ANKYLOSAURUS PREHISTORIC TYRANNOSAUR`),
    },
    nature: {
      name: 'Nature', icon: '🌻',
      words: words(`OAK SUN BUG TREE LEAF ROSE RAIN SNOW WIND MOSS SEED POND HILL LAKE ROOT CLOUD RIVER BLOOM DAISY
        ACORN STORM FOREST FLOWER GARDEN MEADOW BREEZE SPROUT RAINBOW THUNDER BLOSSOM MUSHROOM MOUNTAIN
        WATERFALL SUNFLOWER BUTTERFLY CATERPILLAR DRAGONFLY`),
    },
    music: {
      name: 'Music', icon: '🎸',
      words: words(`DRUM HARP SONG NOTE BAND TUNE BEAT SING FLUTE PIANO CELLO BANJO TUBA DANCE OPERA CHOIR TEMPO
        RHYTHM GUITAR VIOLIN MELODY TRUMPET CONCERT HARMONY UKULELE TROMBONE CLARINET XYLOPHONE ORCHESTRA
        SAXOPHONE MICROPHONE TAMBOURINE`),
    },
  };

  WS.MIX_THEME = { name: 'Surprise Mix', icon: '🎲' };

  // Directions as [rowStep, colStep]
  WS.DIRS = {
    E: [0, 1], S: [1, 0], SE: [1, 1], NE: [-1, 1],
    W: [0, -1], N: [-1, 0], NW: [-1, -1], SW: [1, -1],
  };
  const ALL_DIRS = Object.keys(WS.DIRS);

  WS.DIFFICULTIES = {
    easy: {
      key: 'easy', name: 'Easy', icon: '🌱', desc: 'Small grid. Words go across and down.',
      size: 8, count: 6, minLen: 3, maxLen: 5, dirs: ['E', 'S'], mult: 1, par: 15,
    },
    medium: {
      key: 'medium', name: 'Medium', icon: '🌿', desc: 'Bigger grid. Diagonals join in!',
      size: 10, count: 8, minLen: 3, maxLen: 7, dirs: ['E', 'S', 'SE', 'NE'], mult: 1.5, par: 18,
    },
    hard: {
      key: 'hard', name: 'Hard', icon: '🔥', desc: 'Words can hide backwards!',
      size: 12, count: 10, minLen: 4, maxLen: 9, dirs: ALL_DIRS, mult: 2, par: 22,
    },
    expert: {
      key: 'expert', name: 'Expert', icon: '💎', desc: 'Huge grid with sneaky decoy letters.',
      size: 15, count: 13, minLen: 5, maxLen: 12, dirs: ALL_DIRS, mult: 3, par: 26, decoys: true,
    },
  };

  // Scrabble-style letter values: rare letters make a word worth more.
  WS.LETTER_VALUES = {
    A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
    N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10,
  };

  WS.SCORING = {
    perLetterPoint: 5,      // word value = sum(letter values) * 5 * level multiplier
    goldenMultiplier: 2,    // one golden word per puzzle
    comboWindowMs: 8000,    // find the next word within 8s to build a combo
    comboStep: 10,          // +10 per combo level (x level multiplier)
    clearBonus: 50,
    noHintBonus: 25,
  };

  WS.AVATARS = words('🦊 🐼 🐯 🦄 🐸 🐙 🦖 🐶 🐱 🐵 🦁 🐧 🐨 🦉 🐬 🐲 🚀 ⚽ 🌈 🎸');

  WS.COLORS = [
    { bg: '#FF6B6B', ink: '#1d1b4b' },
    { bg: '#FF9F1C', ink: '#1d1b4b' },
    { bg: '#FFD23F', ink: '#1d1b4b' },
    { bg: '#06D6A0', ink: '#1d1b4b' },
    { bg: '#4CC9F0', ink: '#1d1b4b' },
    { bg: '#3A86FF', ink: '#ffffff' },
    { bg: '#8338EC', ink: '#ffffff' },
    { bg: '#FF5DA2', ink: '#1d1b4b' },
  ];
  WS.colorFor = (hex) => WS.COLORS.find((c) => c.bg === hex) || WS.COLORS[5];

  // Colors for the capsules drawn over found words.
  WS.FOUND_PALETTE = ['#FF6B6B', '#4CC9F0', '#06D6A0', '#FF9F1C', '#8338EC', '#FF5DA2', '#3A86FF', '#90BE6D', '#F15BB5', '#00BBF9'];

  WS.TITLES = [
    { min: 0, name: 'Word Hatchling', icon: '🐣' },
    { min: 200, name: 'Letter Scout', icon: '🔎' },
    { min: 600, name: 'Word Explorer', icon: '🧭' },
    { min: 1500, name: 'Puzzle Ranger', icon: '🏹' },
    { min: 3000, name: 'Word Wizard', icon: '🧙' },
    { min: 6000, name: 'Grand Master', icon: '🦉' },
    { min: 10000, name: 'Word Legend', icon: '🐉' },
    { min: 20000, name: 'Supreme Champion', icon: '🌟' },
  ];
  WS.titleFor = (pts) => WS.TITLES.filter((t) => pts >= t.min).pop();
  WS.nextTitle = (pts) => WS.TITLES.find((t) => t.min > pts) || null;

  WS.BADGES = [
    { id: 'first_word', icon: '🔍', name: 'First Find', desc: 'Find your very first word', test: (s) => s.wordsFound >= 1 },
    { id: 'first_puzzle', icon: '🧩', name: 'Puzzle Solver', desc: 'Finish your first puzzle', test: (s) => s.puzzlesCompleted >= 1 },
    { id: 'golden', icon: '✨', name: 'Golden Touch', desc: 'Find a golden word', test: (s) => s.goldenFound >= 1 },
    { id: 'combo3', icon: '⚡', name: 'Lightning Fingers', desc: 'Get a x3 combo (3 quick finds in a row)', test: (s) => s.bestCombo >= 3 },
    { id: 'speedy', icon: '🚀', name: 'Speed Demon', desc: 'Finish a puzzle in under 60 seconds', test: (s) => s.fastest != null && s.fastest < 60 },
    { id: 'medium', icon: '🌿', name: 'Leveling Up', desc: 'Finish a Medium puzzle', test: (s) => (s.levelsCompleted.medium || 0) >= 1 },
    { id: 'backwards', icon: '🔄', name: 'Backwards Brain', desc: 'Find a word spelled backwards', test: (s) => s.backwardsFound >= 1 },
    { id: 'diag10', icon: '↗️', name: 'Diagonal Dynamo', desc: 'Find 10 diagonal words', test: (s) => s.diagonalFound >= 10 },
    { id: 'long_word', icon: '📏', name: 'Long Haul', desc: 'Find a word with 9 or more letters', test: (s) => s.longestWord >= 9 },
    { id: 'pure', icon: '🧠', name: 'Pure Skill', desc: 'Finish Medium or harder with no hints', test: (s) => s.noHintClears >= 1 },
    { id: 'hard', icon: '🔥', name: 'Hard Mode Hero', desc: 'Finish a Hard puzzle', test: (s) => (s.levelsCompleted.hard || 0) >= 1 },
    { id: 'big_score', icon: '💰', name: 'Jackpot', desc: 'Score 500+ points in one puzzle', test: (s) => s.bestPuzzleScore >= 500 },
    { id: 'words50', icon: '📚', name: 'Word Collector', desc: 'Find 50 words', test: (s) => s.wordsFound >= 50 },
    { id: 'puzzles10', icon: '🎯', name: 'Dedicated', desc: 'Finish 10 puzzles', test: (s) => s.puzzlesCompleted >= 10 },
    { id: 'expert', icon: '💎', name: 'Expert Explorer', desc: 'Finish an Expert puzzle', test: (s) => (s.levelsCompleted.expert || 0) >= 1 },
    { id: 'golden10', icon: '👑', name: 'Midas', desc: 'Find 10 golden words', test: (s) => s.goldenFound >= 10 },
    { id: 'explorer', icon: '🗺️', name: 'World Traveler', desc: 'Finish a puzzle in every theme', test: (s) => Object.keys(WS.THEMES).every((k) => s.themesCompleted.includes(k)) },
    { id: 'words250', icon: '🏛️', name: 'Word Museum', desc: 'Find 250 words', test: (s) => s.wordsFound >= 250 },
    { id: 'puzzles50', icon: '🏅', name: 'Unstoppable', desc: 'Finish 50 puzzles', test: (s) => s.puzzlesCompleted >= 50 },
  ];

  // Awards any newly earned badges to the profile and returns them.
  WS.awardBadges = (profile) => {
    const earned = [];
    for (const b of WS.BADGES) {
      if (!profile.badges[b.id] && b.test(profile.stats)) {
        profile.badges[b.id] = Date.now();
        earned.push(b);
      }
    }
    return earned;
  };
})(window.WS);

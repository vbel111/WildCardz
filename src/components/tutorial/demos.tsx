import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, TextInput, View } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { colors, fonts } from '@/theme';
import { Body, Buzzer, GameButton, Label, OutlineButton, PromptCard } from '../ui';
import { Icon } from '../Icon';
import { fx, play } from '@/services/feedback';
import { useSettings } from '@/stores/settings';
import { ChoiceTile, type DemoPlayer, PassThePhone, ScoreBurst, Stage, useBob, usePop, useShake } from './kit';

export type DemoProps = { done: () => void; players: DemoPlayer[]; fake: string; setFake: (v: string) => void };

/* ─────────────────────────── Truth or Dare ─────────────────────────── */

const SAMPLE_TRUTHS = ['What is the last lie you told?', 'Who here would survive a zombie movie the longest?', 'What is your most embarrassing ringtone ever?'];
const SAMPLE_DARES = ['Talk in an accent until your next turn.', 'Do your best runway walk across the room.', 'Let the group pick your new phone wallpaper.'];

export function TodPick({ done }: DemoProps) {
  const [card, setCard] = useState<{ kind: 'truth' | 'dare'; text: string } | null>(null);
  const n = useRef(0);
  const flip = useRef(new Animated.Value(1)).current;

  const draw = (kind: 'truth' | 'dare') => {
    const pool = kind === 'truth' ? SAMPLE_TRUTHS : SAMPLE_DARES;
    setCard({ kind, text: pool[n.current++ % pool.length] });
    fx.reveal();
    flip.setValue(0);
    Animated.spring(flip, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }).start();
    done();
  };

  return (
    <Stage>
      <View style={{ minHeight: 170, justifyContent: 'center' }}>
        {card ? (
          <Animated.View style={{ transform: [{ perspective: 900 }, { rotateY: flip.interpolate({ inputRange: [0, 1], outputRange: ['95deg', '0deg'] }) }] }}>
            <PromptCard eyebrow={card.kind === 'truth' ? 'TRUTH' : 'DARE'} text={card.text} size={30} />
          </Animated.View>
        ) : (
          <View style={{ height: 160, borderRadius: 20, borderWidth: 3, borderStyle: 'dashed', borderColor: colors.faint, alignItems: 'center', justifyContent: 'center' }}>
            <Label size={64} color={colors.faint}>
              ?
            </Label>
          </View>
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <GameButton label="TRUTH" style={{ flex: 1 }} onPress={() => draw('truth')} />
        <GameButton label="DARE" color={colors.pink} shade={colors.pinkShade} style={{ flex: 1 }} onPress={() => draw('dare')} />
      </View>
    </Stage>
  );
}

export function TodScore({ done, players }: DemoProps) {
  const p = players[0];
  const [score, setScore] = useState(0);
  const [msg, setMsg] = useState('');
  const [burst, setBurst] = useState(0);
  const pop = usePop(score);

  return (
    <Stage>
      <PromptCard eyebrow={`DARE FOR ${p.name.toUpperCase()}`} text="Do your best robot dance for 10 seconds." size={28} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.navy, borderRadius: 16, padding: 12 }}>
        <Buzzer name={p.name} color={p.color} size={46} />
        <Body bold color={colors.white} style={{ flex: 1 }}>
          {p.name}
        </Body>
        <View>
          <ScoreBurst text="+1" trigger={burst} />
          <Animated.View style={{ transform: [{ scale: pop }] }}>
            <Label size={34} color={colors.yellow}>
              {score}
            </Label>
          </Animated.View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <GameButton
          label="DONE IT"
          color={colors.mint}
          shade={colors.mintShade}
          style={{ flex: 1 }}
          onPress={() => {
            setScore((s) => s + 1);
            setBurst((b) => b + 1);
            setMsg('+1 point. The crowd goes wild.');
            fx.correct();
            done();
          }}
        />
        <OutlineButton
          label="Chicken out"
          style={{ flex: 1 }}
          onPress={() => {
            setMsg('No points, no shame. Skipping is always allowed.');
            fx.wrong();
            done();
          }}
        />
      </View>
      {msg ? (
        <Body center bold color={colors.yellow} accessibilityLiveRegion="polite">
          {msg}
        </Body>
      ) : null}
    </Stage>
  );
}

export function PassDemo({ done, players }: DemoProps) {
  const [turn, setTurn] = useState(0);
  const [passes, setPasses] = useState(0);
  return (
    <Stage>
      <PassThePhone
        players={players}
        onPass={(to, n) => {
          fx.tap();
          setTurn(to);
          setPasses(n);
          if (n >= 2) done();
        }}
      />
      <Body center bold color={colors.white} accessibilityLiveRegion="polite">
        {passes === 0 ? 'Tap anywhere above to pass the phone' : `${players[turn].name}'s turn now`}
      </Body>
    </Stage>
  );
}

/* ─────────────────────────── Never Have I Ever ─────────────────────────── */

export function NhieRead({ done }: DemoProps) {
  const [open, setOpen] = useState(false);
  const pop = usePop(open);
  const bob = useBob(6);
  return (
    <Stage>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={open ? 'Never have I ever sung in the shower' : 'Tap to reveal the card'}
        onPress={() => {
          if (open) return;
          setOpen(true);
          fx.reveal();
          done();
        }}
      >
        <Animated.View style={{ transform: [{ scale: pop }] }}>
          <PromptCard eyebrow="NEVER HAVE I EVER" text={open ? '...sung in the shower like it was a sold-out concert.' : 'Tap me to read the card'} size={30} />
        </Animated.View>
      </Pressable>
      {!open ? (
        <Animated.View style={{ alignSelf: 'center', transform: [{ translateY: bob }] }}>
          <Icon name="up" color={colors.yellow} size={30} strokeWidth={3} />
        </Animated.View>
      ) : (
        <Body center color={colors.mist}>
          Read it out loud so the whole room hears it.
        </Body>
      )}
    </Stage>
  );
}

export function NhieBuzz({ done, players }: DemoProps) {
  const [has, setHas] = useState<Record<number, boolean>>({});
  const guilty = Object.values(has).filter(Boolean).length;
  const pop = usePop(guilty);
  return (
    <Stage gap={18}>
      <PromptCard eyebrow="NEVER HAVE I EVER" text="...sung in the shower." size={26} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        {players.map((p, i) => {
          const on = !!has[i];
          return (
            <Pressable
              key={p.name + i}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${p.name} has done it`}
              onPress={() => {
                on ? fx.select() : fx.buzz();
                setHas((h) => ({ ...h, [i]: !on }));
                if (!on) done();
              }}
              style={{ alignItems: 'center', gap: 6 }}
            >
              <Buzzer name={p.name} color={on ? p.color : colors.navySoft} size={62} ring={on ? colors.white : undefined} />
              <Body bold size={12} color={colors.white}>
                {p.name}
              </Body>
            </Pressable>
          );
        })}
      </View>
      <Animated.View style={{ transform: [{ scale: pop }] }}>
        <Body center bold color={colors.yellow} accessibilityLiveRegion="polite">
          {guilty === 0 ? 'Tap the buzzer of anyone who has done it' : `${guilty} guilty. +1 confession each.`}
        </Body>
      </Animated.View>
    </Stage>
  );
}

export function Leaderboard({ players }: DemoProps) {
  const scores = [7, 5, 3, 2];
  const grow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(grow, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [grow]);
  return (
    <Stage gap={10}>
      {players.map((p, i) => (
        <View key={p.name + i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Buzzer name={p.name} color={p.color} size={38} />
          <View style={{ flex: 1, height: 34, borderRadius: 10, backgroundColor: colors.deep, overflow: 'hidden' }}>
            <Animated.View
              style={{
                height: '100%',
                width: grow.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${(scores[i] / 7) * 100}%`] }),
                backgroundColor: p.color,
                justifyContent: 'center',
                paddingLeft: 10,
              }}
            >
              {i === 0 ? <Icon name="crown" color={colors.ink} size={18} /> : null}
            </Animated.View>
          </View>
          <Label size={22} color={colors.white} style={{ width: 28, textAlign: 'right' }}>
            {scores[i]}
          </Label>
        </View>
      ))}
    </Stage>
  );
}

/* ─────────────────────────── Charades ─────────────────────────── */

export function CharHead({ done }: DemoProps) {
  const [on, setOn] = useState(false);
  const v = useRef(new Animated.Value(0)).current;
  const bob = useBob(6);
  const put = () => {
    if (on) return;
    setOn(true);
    fx.reveal();
    Animated.spring(v, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }).start();
    done();
  };
  return (
    <Stage>
      <Pressable accessibilityRole="button" accessibilityLabel="Put the phone on your forehead" onPress={put} style={{ height: 250, alignItems: 'center', justifyContent: 'flex-end' }}>
        {/* the head */}
        <View style={{ width: 150, height: 170, borderRadius: 75, backgroundColor: colors.lilac, alignItems: 'center', paddingTop: 92 }}>
          <View style={{ flexDirection: 'row', gap: 34 }}>
            <View style={{ width: 14, height: on ? 4 : 14, borderRadius: 7, backgroundColor: colors.ink }} />
            <View style={{ width: 14, height: on ? 4 : 14, borderRadius: 7, backgroundColor: colors.ink }} />
          </View>
          <View style={{ marginTop: 22, width: 40, height: 10, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, backgroundColor: colors.ink }} />
        </View>
        {/* the phone */}
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            width: 64,
            height: 112,
            borderRadius: 12,
            borderWidth: 4,
            borderColor: colors.ink,
            backgroundColor: colors.mint,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [
              { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-6, -150] }) },
              { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] }) },
            ],
          }}
        >
          <Label size={18} color={colors.ink}>
            PIZZA
          </Label>
        </Animated.View>
      </Pressable>
      {!on ? (
        <Animated.View style={{ alignItems: 'center', transform: [{ translateY: bob }] }}>
          <Body bold color={colors.yellow}>
            Tap to put the phone on your head
          </Body>
        </Animated.View>
      ) : (
        <Body center color={colors.mist}>
          Your friends can see PIZZA. You can't. Now they act it out.
        </Body>
      )}
    </Stage>
  );
}

const TILT = 0.62;
const NEUTRAL = 0.35;

/** Live tilt practice using the real motion sensor, with a tap fallback. */
export function TiltDemo({ done, want }: DemoProps & { want: 'got' | 'pass' }) {
  const invert = useSettings((s) => s.invertTilt);
  const [state, setState] = useState<'wait' | 'hit' | 'other'>('wait');
  const [sensor, setSensor] = useState(true);
  const armed = useRef(false);
  const finished = useRef(false);
  const bob = useBob(10, 450);
  const pop = usePop(state);

  const hit = () => {
    if (finished.current) return;
    finished.current = true;
    setState('hit');
    want === 'got' ? fx.correct() : fx.wrong();
    done();
  };
  const hitRef = useRef(hit);
  hitRef.current = hit;

  useEffect(() => {
    let cancelled = false;
    let sub: { remove: () => void } | undefined;
    Accelerometer.isAvailableAsync()
      .then((ok) => {
        if (cancelled) return;
        if (!ok) {
          setSensor(false);
          return;
        }
        Accelerometer.setUpdateInterval(60);
        const sign = (Platform.OS === 'android' ? -1 : 1) * (invert ? -1 : 1);
        sub = Accelerometer.addListener(({ z }) => {
          const v = z * sign;
          if (!armed.current) {
            if (Math.abs(v) < NEUTRAL) armed.current = true;
            return;
          }
          if (finished.current) return;
          const down = v > TILT;
          const up = v < -TILT;
          if (!down && !up) return;
          armed.current = false;
          if ((want === 'got' && down) || (want === 'pass' && up)) hitRef.current();
          else {
            setState('other');
            play('wrong');
          }
        });
      })
      .catch(() => setSensor(false));
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [want, invert]);

  const isGot = want === 'got';
  const bg = state === 'hit' ? (isGot ? colors.mint : colors.pink) : colors.navy;
  return (
    <Stage>
      <Animated.View
        style={{ height: 200, borderRadius: 24, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', gap: 10, transform: [{ scale: pop }] }}
        accessibilityLiveRegion="polite"
      >
        {state === 'hit' ? (
          <>
            <Icon name={isGot ? 'check' : 'close'} color={colors.ink} size={54} strokeWidth={3.4} />
            <Label size={44} color={colors.ink}>
              {isGot ? 'GOT IT!' : 'PASS!'}
            </Label>
          </>
        ) : (
          <>
            <Label size={46} color={colors.white}>
              {isGot ? 'PIZZA' : 'GIRAFFE'}
            </Label>
            <Animated.View style={{ transform: [{ translateY: isGot ? bob : Animated.multiply(bob, -1) }] }}>
              <Icon name={isGot ? 'down' : 'up'} color={isGot ? colors.mint : colors.pink} size={44} strokeWidth={3.2} />
            </Animated.View>
          </>
        )}
      </Animated.View>
      {state === 'other' ? (
        <Body center bold color={colors.yellow}>
          Other way! Tip the screen {isGot ? 'to the floor' : 'to the sky'}.
        </Body>
      ) : state === 'wait' ? (
        <Body center color={colors.mist}>
          {sensor ? `Hold your phone upright, then tip the screen ${isGot ? 'down to face the floor' : 'up to face the sky'}.` : 'No motion sensor found. Tap the button below instead.'}
        </Body>
      ) : null}
      {state !== 'hit' ? (
        <Pressable accessibilityRole="button" onPress={hit} style={{ alignSelf: 'center', padding: 8 }}>
          <Body bold size={13} color={colors.faint} style={{ textDecorationLine: 'underline' }}>
            {sensor ? "Can't tilt right now? Tap here" : isGot ? 'Mark as got it' : 'Pass this word'}
          </Body>
        </Pressable>
      ) : null}
    </Stage>
  );
}

export function CharReview({ done }: DemoProps) {
  const [rows, setRows] = useState([
    { w: 'PIZZA', got: true },
    { w: 'GIRAFFE', got: false },
    { w: 'SURFING', got: true },
    { w: 'TITANIC', got: false },
  ]);
  const total = rows.filter((r) => r.got).length;
  const pop = usePop(total);
  return (
    <Stage gap={10}>
      {rows.map((r, i) => (
        <ChoiceTile
          key={r.w}
          label={r.w}
          state={r.got ? 'right' : 'wrong'}
          onPress={() => {
            fx.select();
            setRows((all) => all.map((x, j) => (j === i ? { ...x, got: !x.got } : x)));
            done();
          }}
        />
      ))}
      <Animated.View style={{ transform: [{ scale: pop }] }}>
        <Label center size={28} color={colors.yellow}>
          {total} POINTS
        </Label>
      </Animated.View>
    </Stage>
  );
}

/* ─────────────────────────── Trivia ─────────────────────────── */

const Q_SECONDS = 12;

export function TriviaAnswer({ done }: DemoProps) {
  const options = ['Kumasi', 'Accra', 'Tamale', 'Cape Coast'];
  const correct = 1;
  const [picked, setPicked] = useState<number[]>([]);
  const [won, setWon] = useState(0);
  const [burst, setBurst] = useState(0);
  const bar = useRef(new Animated.Value(1)).current;
  const start = useRef(Date.now());
  const [shakeX, shake] = useShake();

  useEffect(() => {
    const a = Animated.timing(bar, { toValue: 0, duration: Q_SECONDS * 1000, easing: Easing.linear, useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [bar]);

  const answer = (i: number) => {
    if (won) return;
    setPicked((p) => [...p, i]);
    if (i === correct) {
      bar.stopAnimation();
      const left = Math.max(0, 1 - (Date.now() - start.current) / (Q_SECONDS * 1000));
      const pts = 100 + Math.round(left * 50);
      setWon(pts);
      setBurst(1);
      fx.correct();
      done();
    } else {
      fx.wrong();
      shake();
    }
  };

  return (
    <Stage gap={10}>
      <View style={{ height: 10, borderRadius: 5, backgroundColor: colors.deep, overflow: 'hidden' }}>
        <Animated.View style={{ height: '100%', backgroundColor: colors.orange, width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
      </View>
      <View>
        <ScoreBurst text={`+${won}`} trigger={burst} color={colors.yellow} />
        <PromptCard eyebrow="AFRICA & GHANA" text="What is the capital of Ghana?" size={28} />
      </View>
      <Animated.View style={{ gap: 10, transform: [{ translateX: shakeX }] }}>
        {options.map((o, i) => (
          <ChoiceTile key={o} label={o} onPress={() => answer(i)} state={won && i === correct ? 'right' : picked.includes(i) ? 'wrong' : 'idle'} />
        ))}
      </Animated.View>
      {won ? (
        <Body center bold color={colors.yellow}>
          100 for the answer + {won - 100} speed bonus
        </Body>
      ) : picked.length ? (
        <Body center bold color={colors.pink}>
          Not that one. Try again!
        </Body>
      ) : null}
    </Stage>
  );
}

export function TriviaBuzz({ done, players }: DemoProps) {
  const [state, setState] = useState<'idle' | 'wait' | 'go' | 'early' | 'won'>('idle');
  const [ms, setMs] = useState(0);
  const goAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pop = usePop(state);
  const me = players[players.length - 1];

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const arm = () => {
    setState('wait');
    timer.current = setTimeout(() => {
      goAt.current = Date.now();
      setState('go');
      play('tick');
    }, 1200 + Math.random() * 1600);
  };

  const press = () => {
    if (state === 'idle' || state === 'early' || state === 'won') {
      fx.tap();
      arm();
      return;
    }
    if (state === 'wait') {
      if (timer.current) clearTimeout(timer.current);
      fx.wrong();
      setState('early');
      return;
    }
    setMs(Date.now() - goAt.current);
    setState('won');
    fx.buzz();
    done();
  };

  const bg = state === 'go' ? colors.mint : state === 'won' ? me.color : state === 'early' ? colors.pink : state === 'wait' ? colors.navySoft : colors.orange;
  const text =
    state === 'idle' ? 'TAP TO START' : state === 'wait' ? 'WAIT FOR IT...' : state === 'go' ? 'BUZZ!' : state === 'early' ? 'TOO EARLY! AGAIN' : `${ms} MS!`;

  return (
    <Stage gap={16}>
      <Pressable accessibilityRole="button" accessibilityLabel={text} onPress={press} style={{ alignSelf: 'center' }}>
        <Animated.View
          style={{
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: bg,
            borderBottomWidth: 12,
            borderBottomColor: 'rgba(0,0,0,0.25)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            transform: [{ scale: pop }],
          }}
        >
          <Label center size={30} color={colors.ink}>
            {text}
          </Label>
        </Animated.View>
      </Pressable>
      <Body center color={colors.mist} accessibilityLiveRegion="polite">
        {state === 'won' ? `${me.name} buzzed in first and gets to answer. Tap to go again.` : 'In Buzz mode the first player to hit their buzzer answers. Wait for green.'}
      </Body>
    </Stage>
  );
}

export function StreakDemo({ done }: DemoProps) {
  const [n, setN] = useState(0);
  const pop = usePop(n);
  return (
    <Stage gap={16}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 14 }}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: i < n ? colors.mint : colors.deep, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: i < n ? colors.white : colors.navySoft }}
          >
            {i < n ? <Icon name="check" color={colors.ink} size={30} strokeWidth={3.4} /> : <Label size={24} color={colors.faint}>{i + 1}</Label>}
          </View>
        ))}
      </View>
      <Animated.View style={{ transform: [{ scale: pop }] }}>
        <Label center size={n >= 3 ? 40 : 26} color={n >= 3 ? colors.yellow : colors.white}>
          {n >= 3 ? 'ON FIRE! +50 BONUS' : `${n} IN A ROW`}
        </Label>
      </Animated.View>
      <GameButton
        label={n >= 3 ? 'AGAIN' : 'ANSWER RIGHT'}
        color={colors.orange}
        shade={colors.orangeShade}
        onPress={() => {
          if (n >= 3) {
            setN(0);
            return;
          }
          const next = n + 1;
          setN(next);
          if (next >= 3) {
            fx.win();
            done();
          } else fx.correct();
        }}
      />
    </Stage>
  );
}

/* ─────────────────────────── Bluff ─────────────────────────── */

export function BluffWrite({ done, fake, setFake }: DemoProps) {
  const [locked, setLocked] = useState(false);
  const pop = usePop(locked);
  const lock = () => {
    if (fake.trim().length < 2) return;
    setLocked(true);
    fx.correct();
    done();
  };
  return (
    <Stage>
      <PromptCard eyebrow="WEIRD BUT TRUE" text="Wombat poop is shaped like ___." size={28} />
      {locked ? (
        <Animated.View style={{ transform: [{ scale: pop }], backgroundColor: colors.navy, borderRadius: 16, padding: 16, gap: 4 }}>
          <Body bold size={12} color={colors.muted}>
            YOUR BLUFF
          </Body>
          <Label size={30} color={colors.yellow}>
            {fake.trim().toUpperCase()}
          </Label>
        </Animated.View>
      ) : (
        <>
          <TextInput
            value={fake}
            onChangeText={(t) => setFake(t.slice(0, 24))}
            onSubmitEditing={lock}
            placeholder="Type a believable fake..."
            placeholderTextColor={colors.faint}
            returnKeyType="done"
            autoCorrect={false}
            accessibilityLabel="Your fake answer"
            style={{ height: 58, borderRadius: 14, backgroundColor: colors.deep, paddingHorizontal: 16, color: colors.white, fontFamily: fonts.bodyBold, fontSize: 18 }}
          />
          <GameButton label="LOCK IT IN" color={colors.white} shade={colors.lilac} disabled={fake.trim().length < 2} onPress={lock} />
        </>
      )}
    </Stage>
  );
}

export function BluffVote({ done, fake, players }: DemoProps) {
  const mine = fake.trim() || 'pancakes';
  const a = players[0].name;
  const b = players[1].name;
  const options = [
    { text: 'triangles', by: a },
    { text: mine, by: 'YOU' },
    { text: 'cubes', by: null },
    { text: 'tiny hearts', by: b },
  ];
  const [picked, setPicked] = useState<number[]>([]);
  const [msg, setMsg] = useState('');
  const [won, setWon] = useState(false);
  const [shakeX, shake] = useShake();

  const vote = (i: number) => {
    if (won) return;
    const o = options[i];
    if (o.by === 'YOU') {
      fx.select();
      setMsg("That's your own bluff. You can't vote for it!");
      return;
    }
    setPicked((p) => [...p, i]);
    if (o.by) {
      fx.wrong();
      shake();
      setMsg(`Fooled! That was ${o.by}'s bluff. ${o.by} gets +100.`);
      return;
    }
    fx.win();
    setWon(true);
    setMsg('You spotted the truth: +200. Wombats really do make cubes.');
    done();
  };

  return (
    <Stage gap={10}>
      <PromptCard eyebrow="WHICH ONE IS REAL?" text="Wombat poop is shaped like ___." size={24} />
      <Animated.View style={{ gap: 10, transform: [{ translateX: shakeX }] }}>
        {options.map((o, i) => (
          <ChoiceTile
            key={o.text + i}
            label={o.text.toUpperCase()}
            tag={o.by === 'YOU' ? 'YOURS' : undefined}
            state={o.by === 'YOU' ? 'muted' : won && !o.by ? 'right' : picked.includes(i) ? 'wrong' : 'idle'}
            onPress={() => vote(i)}
          />
        ))}
      </Animated.View>
      {msg ? (
        <Body center bold color={won ? colors.mint : colors.yellow} accessibilityLiveRegion="polite">
          {msg}
        </Body>
      ) : null}
    </Stage>
  );
}

export function BluffScore({ players }: DemoProps) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s >= 3 ? s : s + 1)), 650);
    return () => clearInterval(t);
  }, []);
  const rows = [
    { who: players[0], what: 'fooled 2 friends', pts: '+200' },
    { who: players[2], what: 'spotted the truth', pts: '+200' },
    { who: players[1], what: 'fooled nobody', pts: '+0' },
  ];
  return (
    <Stage gap={10}>
      {rows.map((r, i) =>
        i < step ? (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.navy, borderRadius: 14, padding: 12 }}>
            <Buzzer name={r.who.name} color={r.who.color} size={40} />
            <Body bold color={colors.white} style={{ flex: 1 }}>
              {r.who.name} {r.what}
            </Body>
            <Label size={24} color={r.pts === '+0' ? colors.faint : colors.mint}>
              {r.pts}
            </Label>
          </View>
        ) : null,
      )}
    </Stage>
  );
}

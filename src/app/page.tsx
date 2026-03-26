"use client";

import { useMemo, useState } from "react";
import { format, log, max } from "mathjs";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Flame, Rocket, Sigma } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

type DataPoint = {
  n: number;
  factorial: number;
  luks: number;
  babai: number;
  poly1: number;
  poly2: number;
  poly3: number;
  polyCustom: number;
};

const OPS_PER_SECOND_LOG10 = 9;
const SECONDS_PER_YEAR_LOG10 = Math.log10(60 * 60 * 24 * 365);

function log10Factorial(value: number) {
  if (value <= 1) {
    return 0;
  }

  let total = 0;
  for (let i = 2; i <= value; i += 1) {
    total += Math.log10(i);
  }
  return total;
}

function scientificFromLog10(log10Value: number) {
  if (!Number.isFinite(log10Value)) {
    return "Overflow";
  }

  if (log10Value < 6) {
    const numeric = 10 ** log10Value;
    return format(numeric, { precision: 6 });
  }

  const exponent = Math.floor(log10Value);
  const mantissa = 10 ** (log10Value - exponent);
  return `${mantissa.toFixed(3)}e${exponent}`;
}

function prettyTimeFromOpsLog10(log10Ops: number) {
  const log10Seconds = log10Ops - OPS_PER_SECOND_LOG10;

  if (log10Seconds < -2) {
    return `${(10 ** log10Seconds).toFixed(4)} sec`;
  }
  if (log10Seconds < 3) {
    return `${(10 ** log10Seconds).toFixed(2)} sec`;
  }

  const log10Years = log10Seconds - SECONDS_PER_YEAR_LOG10;
  if (log10Years < 3) {
    return `${(10 ** log10Years).toFixed(2)} years`;
  }

  return `~1e${Math.floor(log10Years)} years`;
}

export default function HomePage() {
  const [n, setN] = useState(10);
  const [babaiC, setBabaiC] = useState(2);
  const [polyK, setPolyK] = useState(3);
  const [showCustomPolynomial, setShowCustomPolynomial] = useState(false);

  const data = useMemo<DataPoint[]>(() => {
    const generated: DataPoint[] = [];

    for (let i = 1; i <= n; i += 1) {
      const logNBase2 = i === 1 ? 0 : Number(log(i, 2));
      const sqrtExponent = Math.sqrt(i * max(logNBase2, 0));

      generated.push({
        n: i,
        factorial: log10Factorial(i),
        luks: sqrtExponent * Math.log10(2),
        babai: (logNBase2 ** babaiC) * Math.log10(2),
        poly1: Math.log10(i),
        poly2: 2 * Math.log10(i),
        poly3: 3 * Math.log10(i),
        polyCustom: polyK * Math.log10(i),
      });
    }

    return generated;
  }, [n, babaiC, polyK]);

  const latest = data[data.length - 1];

  const complexitySnapshot = useMemo(() => {
    if (!latest) {
      return [];
    }

    return [
      {
        label: "Brute Force (n!)",
        log10Ops: latest.factorial,
        color: "#e4572e",
      },
      {
        label: "Luks (2^(sqrt(n log n)))",
        log10Ops: latest.luks,
        color: "#0f6f87",
      },
      {
        label: `Babai (2^(log(n)^${babaiC}))`,
        log10Ops: latest.babai,
        color: "#3ba99c",
      },
      {
        label: "Polynomial Goal (n^3)",
        log10Ops: latest.poly3,
        color: "#4d7c0f",
      },
    ];
  }, [babaiC, latest]);

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-12 pt-8 sm:px-8">
      <div className="pointer-events-none absolute inset-0 grid-glow opacity-30" />

      <section className="relative mx-auto max-w-7xl space-y-6">
        <header className="animate-fade-up space-y-3" style={{ animationDelay: "40ms" }}>
          <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Complexity Analyzer</p>
          <h1 className="font-display text-4xl font-semibold leading-tight sm:text-6xl">
            Graph Isomorphism <span className="gradient-title">Complexity Gap</span>
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground sm:text-lg">
            Compare brute-force, sub-exponential, quasi-polynomial, and polynomial behavior as node
            count scales. Y-axis values are plotted as log10(operations) to expose the real gap.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[340px,1fr]">
          <Card className="animate-fade-up" style={{ animationDelay: "120ms" }}>
            <CardHeader>
              <CardTitle>Interactive Controls</CardTitle>
              <CardDescription>Adjust n, Babai's c, and polynomial options.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>n (Number of Nodes)</span>
                  <strong>{n}</strong>
                </div>
                <Slider value={[n]} min={1} max={100} step={1} onValueChange={(v) => setN(v[0] ?? 10)} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Babai constant c</span>
                  <strong>{babaiC}</strong>
                </div>
                <Slider
                  value={[babaiC]}
                  min={1}
                  max={5}
                  step={1}
                  onValueChange={(v) => setBabaiC(v[0] ?? 2)}
                />
              </div>

              <div className="rounded-xl border border-border/70 bg-secondary/40 p-4">
                <p className="mb-3 text-sm font-semibold">Polynomial Display</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomPolynomial(false)}
                    className={`rounded-lg px-3 py-2 text-sm transition ${
                      !showCustomPolynomial
                        ? "bg-primary text-primary-foreground"
                        : "bg-white/70 text-foreground hover:bg-white"
                    }`}
                  >
                    Show n, n^2, n^3
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomPolynomial(true)}
                    className={`rounded-lg px-3 py-2 text-sm transition ${
                      showCustomPolynomial
                        ? "bg-primary text-primary-foreground"
                        : "bg-white/70 text-foreground hover:bg-white"
                    }`}
                  >
                    Show custom n^k
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>k (Custom polynomial degree)</span>
                    <strong>{polyK}</strong>
                  </div>
                  <Slider
                    value={[polyK]}
                    min={1}
                    max={6}
                    step={1}
                    onValueChange={(v) => setPolyK(v[0] ?? 3)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-up" style={{ animationDelay: "180ms" }}>
            <CardHeader>
              <CardTitle>Complexity Curves (log10 scale)</CardTitle>
              <CardDescription>
                This chart compares operation growth up to n={n}. Lower is better.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[460px] w-full rounded-xl bg-white/70 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 20, right: 26, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#7b9ea84f" />
                    <XAxis dataKey="n" tick={{ fill: "#35545b", fontSize: 12 }} />
                    <YAxis
                      tick={{ fill: "#35545b", fontSize: 12 }}
                      label={{
                        value: "log10(operations)",
                        angle: -90,
                        position: "insideLeft",
                        fill: "#35545b",
                        fontSize: 12,
                      }}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", borderColor: "#a8c6cc" }}
                      formatter={(value: number) => [`~10^${value.toFixed(2)} ops`, "Scale"]}
                    />
                    <Legend />

                    <Line type="monotone" dataKey="factorial" name="n! (Brute Force)" stroke="#e4572e" strokeWidth={3} dot={false} />
                    <Line
                      type="monotone"
                      dataKey="luks"
                      name="2^(sqrt(n log n))"
                      stroke="#0f6f87"
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="babai"
                      name={`2^(log(n)^${babaiC})`}
                      stroke="#3ba99c"
                      strokeWidth={2.5}
                      dot={false}
                    />

                    {!showCustomPolynomial ? (
                      <>
                        <Line type="monotone" dataKey="poly1" name="n" stroke="#6a994e" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="poly2" name="n^2" stroke="#4c7d27" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="poly3" name="n^3" stroke="#2e5c12" strokeWidth={2.6} dot={false} />
                      </>
                    ) : (
                      <Line
                        type="monotone"
                        dataKey="polyCustom"
                        name={`n^${polyK}`}
                        stroke="#2e5c12"
                        strokeWidth={2.6}
                        dot={false}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {complexitySnapshot.map((item, index) => (
            <Card
              key={item.label}
              className="animate-fade-up"
              style={{ animationDelay: `${220 + index * 70}ms` }}
            >
              <CardHeader className="pb-3">
                <CardDescription>{item.label}</CardDescription>
                <CardTitle className="text-xl" style={{ color: item.color }}>
                  {scientificFromLog10(item.log10Ops)} ops
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                Time @ 1B ops/s: {prettyTimeFromOpsLog10(item.log10Ops)}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="animate-fade-up" style={{ animationDelay: "420ms" }}>
          <CardContent className="flex flex-wrap gap-4 pt-6 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-[#e4572e]" />
              Brute force n! grows explosively.
            </p>
            <p className="flex items-center gap-2">
              <Sigma className="h-4 w-4 text-[#3ba99c]" />
              Babai's quasi-polynomial is the key breakthrough.
            </p>
            <p className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-[#2e5c12]" />
              Polynomial time remains the target destination.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

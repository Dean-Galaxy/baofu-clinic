"use client";

import { useMemo, useState } from "react";

type Mode = "elements" | "expectation";
type ScriptType = "前提" | "呈现" | "吐槽" | "混合";

type ElementsResult = {
  script_map: Array<{ text: string; type: ScriptType }>;
  rhythm_diagnosis: string;
  fluff_warning: string;
  improvement_suggestions: string;
};

type ExpectationResult = {
  connector: string;
  assumption_a: string;
  real_logic_b: string;
  connector_validity: boolean;
  score: number;
  diagnosis: string;
  rewritten_version: string;
};

const MODES = {
  elements: {
    eyebrow: "长段子·结构扫描",
    title: "四大元素",
    description: "拆解前提、呈现、吐槽与混合，找到节奏堵点。",
  },
  expectation: {
    eyebrow: "One-Liner·咬合度",
    title: "预期违背",
    description: "抽出假定 A、真实 B 与连接点，检查包袱是否扣得牢。",
  },
} as const;

const SAMPLES: Record<Mode, string> = {
  elements:
    "我最近开始健身，教练说我的核心力量太差。我不服，我每天上班都在练核心：老板画饼的时候，我得用核心稳住自己，才不会当场辞职。教练说那叫情绪管理。我说不，那叫上班的平板支撑。",
  expectation:
    "我去面试，HR 问我抗压能力怎么样。我说非常强，上家公司欠我三个月工资，我现在还能笑着找工作。",
};

const TYPE_META: Record<ScriptType, { code: string; className: string }> = {
  前提: { code: "P", className: "premise" },
  呈现: { code: "S", className: "scene" },
  吐槽: { code: "R", className: "roast" },
  混合: { code: "M", className: "mix" },
};

function LoadingResult({ mode, characterCount }: { mode: Mode; characterCount: number }) {
  const isLongDraft = characterCount >= 1200;
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="scan-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="loading-kicker">EDITOR IS READING</p>
      <h2>正在拆解你的段子…</h2>
      <p>
        {isLongDraft
          ? `正在处理 ${characterCount.toLocaleString("zh-CN")} 字长文稿，通常需要 40–120 秒，请勿重复提交`
          : mode === "elements"
          ? "逐句标记结构，检查铺垫与笑点密度"
          : "对齐假定 A 与真实 B，寻找关键连接点"}
      </p>
      <div className="loading-line"><span /></div>
    </div>
  );
}

function EmptyResult({ mode }: { mode: Mode }) {
  return (
    <div className="empty-result">
      <div className="empty-index">02</div>
      <p className="section-kicker">DIAGNOSIS</p>
      <h2>编辑判断会出现在这里</h2>
      <p>
        {mode === "elements"
          ? "它会告诉你哪里在铺垫、哪里有画面，以及哪些话可以删。"
          : "它会把包袱拆成 A / B 两层语义，再判断连接点是否成立。"}
      </p>
      <div className="empty-ruler" aria-hidden="true">
        <span>INPUT</span><i /><span>READ</span><i /><span>REWRITE</span>
      </div>
      <div className="editor-note">
        <span>建议</span>
        <p>一次放入一个完整段子，不要把整场文稿一次性塞进来。</p>
      </div>
    </div>
  );
}

function ElementsReport({ data }: { data: ElementsResult }) {
  const counts = useMemo(() => {
    const base: Record<ScriptType, number> = { 前提: 0, 呈现: 0, 吐槽: 0, 混合: 0 };
    data.script_map.forEach((item) => { base[item.type] = (base[item.type] || 0) + 1; });
    return base;
  }, [data]);
  const total = Math.max(data.script_map.length, 1);

  return (
    <div className="report elements-report">
      <div className="report-heading">
        <div><p className="section-kicker">STRUCTURE MAP</p><h2>四大元素分布</h2></div>
        <span className="report-status">ANALYZED</span>
      </div>

      <div className="ratio-bar" aria-label="四大元素句数占比">
        {(Object.keys(counts) as ScriptType[]).map((type) => (
          counts[type] > 0 && <span key={type} className={TYPE_META[type].className} style={{ width: `${(counts[type] / total) * 100}%` }} />
        ))}
      </div>
      <div className="legend">
        {(Object.keys(counts) as ScriptType[]).map((type) => (
          <span key={type}><i className={TYPE_META[type].className} />{type} {counts[type]}</span>
        ))}
      </div>

      <div className="script-map">
        {data.script_map.map((item, index) => (
          <div className={`script-line ${TYPE_META[item.type].className}`} key={`${index}-${item.text.slice(0, 8)}`}>
            <span className="type-code">{TYPE_META[item.type].code}</span>
            <p>{item.text}</p>
            <span className="type-name">{item.type}</span>
          </div>
        ))}
      </div>

      <div className="diagnosis-grid">
        <article className="diagnosis-card wide">
          <span className="card-number">01</span><p className="card-label">节奏与比例</p>
          <p>{data.rhythm_diagnosis}</p>
        </article>
        <article className="diagnosis-card warning">
          <span className="card-number">02</span><p className="card-label">减法警报</p>
          <p>{data.fluff_warning}</p>
        </article>
        <article className="diagnosis-card suggestion">
          <span className="card-number">03</span><p className="card-label">改写方向</p>
          <p>{data.improvement_suggestions}</p>
        </article>
      </div>
    </div>
  );
}

function ExpectationReport({ data }: { data: ExpectationResult }) {
  const score = Math.max(0, Math.min(100, data.score));
  const grade = score >= 90 ? "S" : score >= 80 ? "A" : score >= 65 ? "B" : "C";

  return (
    <div className="report expectation-report">
      <div className="report-heading">
        <div><p className="section-kicker">PUNCHLINE FIT</p><h2>连接点咬合度</h2></div>
        <span className={`validity ${data.connector_validity ? "valid" : "invalid"}`}>
          {data.connector_validity ? "连接成立" : "连接偏弱"}
        </span>
      </div>

      <div className="score-connector">
        <div className="score-ring" style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}>
          <div><strong>{score}</strong><span>{grade} 级</span></div>
        </div>
        <div className="connector-card">
          <span>CORE CONNECTOR</span>
          <strong>{data.connector || "未找到明确连接点"}</strong>
          <p>包袱中同时开启两层语义的那把钥匙</p>
        </div>
      </div>

      <div className="logic-flow">
        <article>
          <span className="logic-letter">A</span>
          <p className="card-label">观众的定向假设</p>
          <p>{data.assumption_a}</p>
        </article>
        <div className="logic-arrow" aria-hidden="true"><span>连接点</span><i>→</i></div>
        <article>
          <span className="logic-letter accent">B</span>
          <p className="card-label">包袱揭示的真实</p>
          <p>{data.real_logic_b}</p>
        </article>
      </div>

      <article className="editor-verdict">
        <p className="section-kicker">EDITOR&apos;S VERDICT</p>
        <p>{data.diagnosis}</p>
      </article>

      <article className="rewrite-card">
        <div><span>改写稿</span><span>REWRITE</span></div>
        <p>{data.rewritten_version}</p>
      </article>
    </div>
  );
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("elements");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ElementsResult | ExpectationResult | null>(null);

  const switchMode = (next: Mode) => {
    setMode(next);
    setResult(null);
    setError("");
  };

  const diagnose = async () => {
    const trimmed = text.trim();
    if (trimmed.length < 8) {
      setError("再多写一点：至少需要 8 个字才能诊断。");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, mode }),
      });
      const payload = await response.json() as { data?: ElementsResult | ExpectationResult; detail?: string };
      if (!response.ok || !payload.data) throw new Error(payload.detail || "诊断失败，请稍后再试。");
      setResult(payload.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "诊断失败，请稍后再试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="包袱诊断室首页">
          <span className="brand-mark">BFD</span>
          <span><strong>包袱诊断室</strong><small>COMEDY DRAFT CLINIC</small></span>
        </a>
        <div className="top-note"><span />AI 编剧工作台 · BETA</div>
      </header>

      <section className="hero" id="top">
        <p className="hero-kicker">DON&apos;T GUESS. DIAGNOSE.</p>
        <h1>别猜哪里不好笑，<br /><em>把包袱拆开看。</em></h1>
        <p className="hero-copy">用两套编剧方法诊断脱口秀文稿，看清结构、节奏和预期违背。
        </p>
      </section>

      <section className="workspace-shell">
        <div className="mode-tabs" role="tablist" aria-label="诊断模式">
          {(Object.keys(MODES) as Mode[]).map((key, index) => (
            <button key={key} role="tab" aria-selected={mode === key} className={mode === key ? "active" : ""} onClick={() => switchMode(key)}>
              <span>0{index + 1}</span>
              <div><small>{MODES[key].eyebrow}</small><strong>{MODES[key].title}</strong><p>{MODES[key].description}</p></div>
              <i aria-hidden="true">↗</i>
            </button>
          ))}
        </div>

        <div className="workbench">
          <section className="input-panel">
            <div className="panel-heading">
              <div><span className="panel-index">01</span><div><p className="section-kicker">YOUR DRAFT</p><h2>粘贴待诊断文稿</h2></div></div>
              <button className="sample-button" onClick={() => { setText(SAMPLES[mode]); setError(""); }}>填入示例</button>
            </div>

            <div className="paper-input">
              <textarea
                value={text}
                onChange={(event) => { setText(event.target.value.slice(0, 5000)); setError(""); }}
                placeholder={mode === "elements" ? "把你的段子放在这里。\n\n建议包含完整的铺垫、呈现与包袱…" : "把 One-Liner 或短段子放在这里。\n\n建议保留完整铺垫和最后的包袱…"}
                aria-label="待诊断文稿"
              />
              <div className="input-meta"><span>{text.length.toLocaleString()} / 5,000</span><span>中文 · 纯文本</span></div>
            </div>

            {error && <div className="error-message" role="alert"><span>!</span>{error}</div>}

            <button className="diagnose-button" onClick={diagnose} disabled={loading}>
              <span>{loading ? "正在诊断" : `开始${MODES[mode].title}诊断`}</span>
              <i aria-hidden="true">{loading ? "···" : "→"}</i>
            </button>
            <p className="privacy-note"><span>◆</span> 文稿仅用于本次诊断，不会在本站保存</p>
          </section>

          <section className="result-panel" aria-live="polite">
            {loading ? <LoadingResult mode={mode} characterCount={text.trim().length} /> : !result ? <EmptyResult mode={mode} /> : mode === "elements" ? (
              <ElementsReport data={result as ElementsResult} />
            ) : (
              <ExpectationReport data={result as ExpectationResult} />
            )}
          </section>
        </div>
      </section>

      <footer>
        <div><strong>包袱诊断室</strong><span>让改稿有依据，让笑点有结构。</span></div>
        <p>AI 诊断是编剧参考，最后的舞台判断永远属于你。</p>
      </footer>
    </main>
  );
}

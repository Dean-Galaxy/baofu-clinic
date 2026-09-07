import Link from "next/link";
import { getLiveTools } from "@/lib/tool-registry";

export default function ToolboxHome() {
  const liveTools = getLiveTools();

  return (
    <main className="toolbox-home">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="AI 工具箱首页">
          <span className="brand-mark">AI</span>
          <span><strong>AI 工具箱</strong><small>CREATOR TOOLBOX</small></span>
        </Link>
        <div className="top-note"><span />当前开放体验 · {liveTools.length} 个工具</div>
      </header>

      <section className="toolbox-hero">
        <div>
          <p className="hero-kicker">ONE ACCOUNT. MANY TOOLS.</p>
          <h1>把重复工作，<br /><em>交给你的 AI 工具箱。</em></h1>
          <p>从文稿诊断开始，逐步接入更多创作工具。现在无需登录即可体验，账户与权益系统将在正式收费前统一接入。</p>
        </div>
        <aside aria-label="工具箱状态">
          <span>TOOLBOX STATUS</span>
          <strong>{String(liveTools.length).padStart(2, "0")}</strong>
          <p>个工具已上线</p>
          <i>持续扩展中</i>
        </aside>
      </section>

      <section className="tool-library" aria-labelledby="tool-library-title">
        <div className="library-heading">
          <div><p className="section-kicker">AVAILABLE TOOLS</p><h2 id="tool-library-title">选择一个工具开始</h2></div>
          <p>工具各自完成一件具体的事，账户、用量和权益由工具箱统一管理。</p>
        </div>

        <div className="tool-grid">
          {liveTools.map((tool) => (
            <Link className="tool-card active-tool" href={tool.href} key={tool.id}>
              <div className="tool-card-top"><span className="tool-index">{tool.index}</span><span className="live-badge"><i />已上线</span></div>
              <div className="tool-icon" aria-hidden="true">{tool.shortCode}</div>
              <p className="tool-category">{tool.category}</p>
              <h3>{tool.name}</h3>
              <p className="tool-description">{tool.description}</p>
              <ul>
                {tool.capabilities.map((capability) => <li key={capability}>{capability}</li>)}
              </ul>
              <div className="tool-card-action"><span>打开工具</span><strong>→</strong></div>
            </Link>
          ))}

          <article className="tool-card future-tool" aria-label="下一个工具位，待接入">
            <div className="tool-card-top"><span className="tool-index">02</span><span className="future-badge">待接入</span></div>
            <div className="future-mark" aria-hidden="true">＋</div>
            <p className="tool-category">NEXT TOOL</p>
            <h3>下一个工具位</h3>
            <p className="tool-description">后续工具将沿用统一入口和权益，不需要重复注册或购买不同账户。</p>
          </article>
        </div>
      </section>

      <section className="toolbox-foundation" aria-label="工具箱账户和权益规划">
        <article><span>01</span><div><strong>统一身份</strong><p>一次登录，使用工具箱中的所有工具。</p></div></article>
        <article><span>02</span><div><strong>灵活权益</strong><p>底层同时兼容按次、订阅和混合收费。</p></div></article>
        <article><span>03</span><div><strong>用量清楚</strong><p>每次调用、余额变化和诊断结果都有记录。</p></div></article>
      </section>

      <footer>
        <div><strong>AI 工具箱</strong><span>让每个工具，只解决一个清楚的问题。</span></div>
        <p>当前为免登录体验版本，正式账户与收费体系正在规划中。</p>
      </footer>
    </main>
  );
}

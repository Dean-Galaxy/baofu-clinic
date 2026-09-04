import { NextResponse } from "next/server";

type Mode = "elements" | "expectation";

const ELEMENTS_PROMPT = `
你是一位严格、具体、不说套话的中文脱口秀总编剧。请根据“四大元素”诊断用户提交的单个段子。

判断标准：
1. 前提：抛出事实、设定场景、表达观点或主张。
2. 呈现：展示具体场景中不对的逻辑、观点或行为，包括角色、动作、拟音和对话。
3. 吐槽：态度宣泄、反驳、荒谬点评或逻辑剖析。
4. 混合：沿着错误逻辑继续想象和延展，通常边演边评。

核心前提提炼：
- 在逐句分类之外，还必须提炼整段段子隐含的一个核心前提。它不是简单摘抄被标为“前提”的原句，而是从开头情节、动作、对话、心理活动和吐槽中推断出来。
- 先找出表演者反复围绕的最具体生活情境或触发事件，例如“和同事上班打招呼”“在餐厅点餐”“坐地铁通勤”，不得只写“生活”“工作”“人际关系”等抽象主题。
- 再从“困难、可怕、愚蠢、奇怪”中选择且只能选择一个贯穿始终、最根本的主导情绪。不要增加近义词或第五种情绪。
- premise_extraction.statement 必须使用“【具体情境】让我感到【情绪】”的完整句式；situation 只写具体情境，emotion 只写上述四种情绪之一。
- premise_extraction.evidence 必须恰好写两句话：第一句指出原文中哪些动作、对话或心理活动支持这一判断；第二句说明为什么所选情绪是贯穿段子的主导情绪。不要用分号把两句合并，也不要展示内部推理过程。

要求：
- script_map 必须按原文顺序覆盖所有句子，不得改写或遗漏原文内容。
- 不要因为一句不好笑就默认它是“前提”，应按句子在结构中的功能分类。
- 指出具体词句和可执行修改，避免“加强节奏”这类空泛结论。
- 只输出符合给定 schema 的 JSON。`;

const EXPECTATION_PROMPT = `
你是一位严格、具体、不说套话的中文脱口秀总编剧。请根据“预期违背 + 连接点”理论诊断用户提交的单个段子。

判断步骤：
1. 定向假设 A：铺垫引导观众建立的默认常识或逻辑。
2. 真实逻辑 B：包袱最终揭示的真实解释。
3. 连接点：同时适配 A 与 B 的核心词、行为或前提，需要判断它是否自然，而非事后强行解释。
4. 精简度：检查细节是否精准，是否存在超过 10 字且无法提供信息或节奏价值的修饰。
5. 综合评分 0-100：90 以上为咬合精准；80-89 为成立但可收紧；65-79 为可理解但转折偏弱；65 以下为连接不成立。

要求：
- connector 应尽量是原文里的词或短语。若没有有效连接点，如实填写“未找到明确连接点”并将 connector_validity 设为 false。
- rewritten_version 保留作者原意与口语感，优先删减和收紧，不得虚构新事实。
- 只输出符合给定 schema 的 JSON。`;

const ELEMENTS_SCHEMA = {
  type: "object",
  properties: {
    script_map: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          type: { type: "string", enum: ["前提", "呈现", "吐槽", "混合"] },
        },
        required: ["text", "type"],
      },
    },
    premise_extraction: {
      type: "object",
      properties: {
        situation: { type: "string" },
        emotion: { type: "string", enum: ["困难", "可怕", "愚蠢", "奇怪"] },
        statement: { type: "string" },
        evidence: { type: "string" },
      },
      required: ["situation", "emotion", "statement", "evidence"],
    },
    rhythm_diagnosis: { type: "string" },
    fluff_warning: { type: "string" },
    improvement_suggestions: { type: "string" },
  },
  required: ["script_map", "premise_extraction", "rhythm_diagnosis", "fluff_warning", "improvement_suggestions"],
};

const EXPECTATION_SCHEMA = {
  type: "object",
  properties: {
    connector: { type: "string" },
    assumption_a: { type: "string" },
    real_logic_b: { type: "string" },
    connector_validity: { type: "boolean" },
    score: { type: "integer", minimum: 0, maximum: 100 },
    diagnosis: { type: "string" },
    rewritten_version: { type: "string" },
  },
  required: ["connector", "assumption_a", "real_logic_b", "connector_validity", "score", "diagnosis", "rewritten_version"],
};

function isMode(value: unknown): value is Mode {
  return value === "elements" || value === "expectation";
}

function collectTextContent(value: unknown, result: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((item) => collectTextContent(item, result));
    return result;
  }
  if (!value || typeof value !== "object") return result;

  const record = value as Record<string, unknown>;
  if (record.type === "text" && typeof record.text === "string") {
    result.push(record.text);
    return result;
  }
  Object.values(record).forEach((item) => collectTextContent(item, result));
  return result;
}

function parseStructuredJson(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const withoutFence = trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const firstBrace = withoutFence.indexOf("{");
    const lastBrace = withoutFence.lastIndexOf("}");
    if (firstBrace < 0 || lastBrace <= firstBrace) throw new SyntaxError("Structured output is incomplete");
    return JSON.parse(withoutFence.slice(firstBrace, lastBrace + 1));
  }
}

const PREMISE_EMOTIONS = new Set(["困难", "可怕", "愚蠢", "奇怪"]);

function normalizeElementsResult(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const result = value as Record<string, unknown>;
  const premise = result.premise_extraction;
  if (!premise || typeof premise !== "object") return value;

  const premiseRecord = premise as Record<string, unknown>;
  const situation = typeof premiseRecord.situation === "string" ? premiseRecord.situation.trim() : "";
  const emotion = typeof premiseRecord.emotion === "string" ? premiseRecord.emotion : "";
  if (!situation || !PREMISE_EMOTIONS.has(emotion)) return value;

  return {
    ...result,
    premise_extraction: {
      ...premiseRecord,
      situation,
      emotion,
      statement: `${situation}让我感到${emotion}`,
    },
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { text?: unknown; mode?: unknown };
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) return NextResponse.json({ detail: "文稿内容不能为空。" }, { status: 400 });
    if (text.length < 8) return NextResponse.json({ detail: "文稿至少需要 8 个字。" }, { status: 400 });
    if (text.length > 5000) return NextResponse.json({ detail: "单次诊断不能超过 5,000 字。" }, { status: 400 });
    if (!isMode(body.mode)) return NextResponse.json({ detail: "不支持的诊断模式。" }, { status: 400 });

    const runtimeGlobal = globalThis as typeof globalThis & {
      __BAOFU_RUNTIME_SECRETS__?: { GEMINI_API_KEY?: string };
    };
    const apiKey = process.env.GEMINI_API_KEY || runtimeGlobal.__BAOFU_RUNTIME_SECRETS__?.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ detail: "线上 AI 服务正在配置，请稍后再试。" }, { status: 503 });
    }

    const systemPrompt = body.mode === "elements" ? ELEMENTS_PROMPT : EXPECTATION_PROMPT;
    const schema = body.mode === "elements" ? ELEMENTS_SCHEMA : EXPECTATION_SCHEMA;
    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          model: "gemini-3.6-flash",
          system_instruction: systemPrompt,
          input: `待诊断文稿：\n${text}`,
          store: false,
          generation_config: {
            temperature: 0.2,
            max_output_tokens: 32768,
            thinking_level: "low",
          },
          response_format: {
            type: "text",
            mime_type: "application/json",
            schema,
          },
        }),
        signal: AbortSignal.timeout(150_000),
      },
    );

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error("Gemini API error", geminiResponse.status, errorBody.slice(0, 500));
      return NextResponse.json({ detail: "AI 编剧暂时没有回应，请稍后重试。" }, { status: 502 });
    }

    const geminiPayload = await geminiResponse.json() as {
      output_text?: string;
      status?: string;
      usage?: { total_output_tokens?: number };
      interaction?: {
        output_text?: string;
        status?: string;
        usage?: { total_output_tokens?: number };
        steps?: unknown[];
      };
      steps?: unknown[];
    };
    const interaction = geminiPayload.interaction || geminiPayload;
    const collectedText = collectTextContent(interaction.steps);
    const raw = interaction.output_text
      || [...collectedText].reverse().find((item) => item.trim().startsWith("{"))
      || collectedText.at(-1)
      || "";
    if (!raw) return NextResponse.json({ detail: "AI 未返回有效诊断，请换一段文稿重试。" }, { status: 502 });

    let data: unknown;
    try {
      data = parseStructuredJson(raw);
    } catch {
      console.error("Gemini returned invalid structured output", {
        status: interaction.status,
        outputTokens: interaction.usage?.total_output_tokens,
        outputCharacters: raw.length,
        appearsComplete: raw.trim().endsWith("}"),
      });
      return NextResponse.json(
        { detail: "AI 返回的诊断不完整，请重试；如果文稿较长，建议按完整段子分段诊断。" },
        { status: 502 },
      );
    }
    if (body.mode === "elements") data = normalizeElementsResult(data);
    return NextResponse.json({ status: "success", mode: body.mode, data });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      return NextResponse.json({ detail: "诊断超时了，请稍后重试。" }, { status: 504 });
    }
    console.error("Diagnosis error", error);
    return NextResponse.json({ detail: "诊断过程出错了，请稍后重试。" }, { status: 500 });
  }
}

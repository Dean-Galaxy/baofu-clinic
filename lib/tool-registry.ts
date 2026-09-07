export type ToolStatus = "live" | "coming-soon";

export type ToolDefinition = {
  id: string;
  index: string;
  name: string;
  shortCode: string;
  category: string;
  description: string;
  href: string;
  status: ToolStatus;
  capabilities: string[];
};

export const TOOL_REGISTRY: ToolDefinition[] = [
  {
    id: "baofu-clinic",
    index: "01",
    name: "包袱诊断室",
    shortCode: "BFD",
    category: "脱口秀创作",
    description: "拆开一段文稿，看清前提、呈现、吐槽、混合以及包袱的预期违背。",
    href: "/tools/baofu-clinic",
    status: "live",
    capabilities: ["四大元素结构扫描", "核心前提提炼", "预期违背与连接点", "精简与改写建议"],
  },
];

export function getLiveTools() {
  return TOOL_REGISTRY.filter((tool) => tool.status === "live");
}

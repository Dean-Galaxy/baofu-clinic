import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "包袱诊断室 · AI 工具箱",
  description: "用四大元素和预期违背两套方法，诊断脱口秀文稿的结构、节奏与包袱。",
};

export default function BaofuClinicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

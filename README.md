# Node Naming Standard（NNS）
# 节点命名规范

[English README](./README.en.md)

Node Naming Standard（NNS）是一个用于代理/网络节点的
**统一、可复现、可扩展**的命名规范。

NNS 的目标是：
- 提供稳定、可读的节点命名规则
- 消除机场/订阅之间的命名混乱
- 让不同客户端、不同实现可以得到一致结果

当前版本：NNS v1（规范文档：`spec/SPEC.v1.md`）

---

## 项目状态

- v1：规范已定义（参考实现进行中）
- v2：规划中（语义增强）
- v3：规划中（验证与生态）

---

## 仓库结构

```text
nns/
├─ README.md                     # 项目总说明（中英可双语）
├─ LICENSE                       # 开源协议（推荐 MIT）
├─ .gitignore
├─ ROADMAP.md                    # v1–v3 整体发展线路图
│
├─ spec/                         # 规范文档（核心）
│  ├─ SPEC.v1.md                 # v1 正式规范（MUST / SHOULD / MAY）
│  ├─ SPEC.v2.md                 # v2 规范（Draft）
│  └─ SPEC.v3.md                 # v3 规划（Draft / Outline）
│
├─ dict/                         # 规范所需的数据字典
│  ├─ sources/                   # 人工维护源（可 PR）
│  │  └─ countries_patch.yaml    # 国家中文名 + 别名补丁
│  │
│  ├─ generated/                 # 生成产物（应提交到仓库）
│  │  ├─ countries.json          # CC -> 国家对象（flag/name/aliases）
│  │  └─ country_alias_map.json  # alias -> CC（快速匹配用）
│  │
│  └─ README.md                  # dict 说明（如何生成/更新）
│
├─ scripts/                      # 构建脚本（规范的一部分）
│  ├─ build_countries.py         # 生成 countries.json 的 Python 脚本
│  └─ README.md                  # 脚本使用说明
│
└─ CONTRIBUTING.md               # 贡献指南（如何加别名/国家）

```

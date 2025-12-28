# Node Naming Standard v2 (NNS v2)
# 节点命名规范 v2

> 本文档为 NNS v2 规范草案（Draft），用于在 v1 基础上引入**结构化路径语义**（path/exit），同时保持对 v1 输出的**前向兼容**。

---

## 1. Scope（适用范围）

NNS v2 在 NNS v1 的基础上扩展，主要新增：

- 对“多地区/多跳”节点描述的**结构化表达**
- 将 v1 中以 tags 形式保留的路径语义（如 `[via:XX]`、`[exit:XX]`）升级为字段

NNS v2 仍然**不**包含网络探测、IP 探测、测速、排序等内容。

---

## 2. Design Goals（设计目标）

NNS v2 的设计目标：

1) **结构化（Structured）**  
   将路径相关语义从“自由文本 tag”升级为字段

2) **兼容（Compatible）**  
   - v1 输出在 v2 中应保持可解析、可展示  
   - v2 输出可降级回 v1（不丢核心信息）

3) **确定性（Deterministic）**  
   相同输入 + 相同规则 + 相同配置 → 相同输出

4) **低维护成本（Maintainable）**  
   v2 只结构化“确实需要结构化、且可稳定定义”的信息

---

## 3. Terminology（术语定义）

- **region**：节点的**展示地区 / 入口地区**（用户购买/选择的主地区）
- **exit**：节点的**出口/落地地区**（最终出口 IP 所在地区）
- **path**：从入口到出口的**中转路径**（有序列表）
- **connector**：连接词（中转/经由/via/落地/出口/箭头）

---

## 4. Field Set（字段集合）

NNS v2 定义字段集合如下：

| 字段名 | 含义 | v2 要求 |
|---|---|---|
| `flag` | 国旗 emoji（与 region 一致） | SHOULD |
| `region` | 展示地区（ISO CC） | MUST |
| `city` | 城市/地区（可选） | MAY |
| `line` | 线路/接入类型（可选） | MAY |
| `mult` | 倍率/计费信息（可选） | MAY |
| `tags` | 标签集合（可选） | MAY |
| `path` | 中转路径（有序 CC 列表） | MAY |
| `exit` | 出口/落地地区（ISO CC） | MAY |

---

## 5. Canonical Order（标准展示顺序）

### 5.1 Default Order（默认顺序）

v2 推荐默认顺序：

```text
flag region city line mult path exit tags
```

### 5.2 Path/Exit 的默认展示形式

- `path` 的展示前缀：`via`
- `exit` 的展示前缀：`→`（或 `exit`）

推荐展示（默认）：

```text
🇨🇦 CA IEPL via HK → US [中转]
```

---

## 6. Path & Exit Semantics（路径与出口语义）

### 6.1 region vs exit

- `region` 表示入口/展示地区（主地区）
- `exit` 表示出口/落地地区
- 若 `exit` 存在且与 `region` 不同，表示“展示与出口不同”

### 6.2 path（中转路径）

- `path` 为有序列表：`[CC1, CC2, ...]`
- `path` 不包含 `region` 本身
- `path` 不包含 `exit`
- `path` 中的 `CC` MUST 为 ISO 3166-1 alpha-2

示例语义：

```text
region=CA, path=[HK], exit=US
```

表示：入口 CA，经由 HK，中转到 US 出口。

---

## 7. Connector-based Parsing（连接词驱动解析）

当输入名称中出现 connector 时，v2 SHOULD 做语义分段。

### 7.1 Connector 优先级（推荐）

从高到低：

- 出口类：落地 / 出口 / exit
- 经由类：经由 / via
- 中转类：中转
- 箭头类：`->` / `→` / `>`（可视作“经由/方向”提示）

### 7.2 分段规则（推荐）

- connector 之前的地区 token 优先用于 `region`
- connector 之后的地区 token 优先用于 `exit`
- connector 中间/多跳地区 token 进入 `path`（如有明确顺序）

---

## 8. v1 Compatibility（v1 兼容与迁移）

### 8.1 v1 tags → v2 fields

若输入（或已存在的名称）包含 v1 保留 tag：

- `[via:XX]` → append `XX` to `path`
- `[exit:XX]` → set `exit = XX`

### 8.2 v2 fields → v1 downgrade

当 v2 需要降级为 v1（例如某些客户端/实现不支持 v2），实现 SHOULD：

- `path=[HK, JP]` → tags 追加 `[via:HK]` `[via:JP]`
- `exit=US` → tags 追加 `[exit:US]`

从而保持信息不丢失。

---

## 9. Tags（标签）规则（继承 v1）

- tags 为并列集合
- 每个标签 MUST 使用独立方括号表示：`[NF] [GPT]`
- tags MUST 位于末尾
- tags MUST NOT 编码逻辑关系（不使用 `[A|B]`、`[A,B]`）

---

## 10. Determinism（确定性）

对于相同的：

- 输入名称
- 字典（countries/aliases/keywords）
- 配置项（字段顺序、分隔符、策略）

输出 MUST 相同。

---

## 11. Internationalization（国际化）

- `region`/`path`/`exit` MUST 使用 CC（ISO alpha-2）
- 本地化展示（中文/英文）由实现 MAY 决定，但不影响字段值

---

## 12. Explicitly Out of Scope（明确不包含内容）

NNS v2 仍不定义、不要求：

- IP 地理定位 / 通过网络探测推断出口
- 自动测速、质量评估、节点排序
- 解锁验证
- 客户端 UI 行为规范（交互/弹窗/流程）

---

## 13. Reference Output Examples（示例）

### 13.1 单地区

输入：香港 IEPL x2 奈飞  
输出：

```text
🇭🇰 HK IEPL x2 [NF]
```

### 13.2 展示地区 + 出口地区

输入：加拿大 中转 美国 IEPL  
输出：

```text
🇨🇦 CA IEPL → US [中转]
```

### 13.3 展示地区 + path + exit

输入：加拿大 经由 香港 落地 美国  
输出：

```text
🇨🇦 CA via HK → US
```

### 13.4 多跳 path

输入：英国 -> 香港 -> 日本 -> 美国  
输出：

```text
🇬🇧 GB via HK via JP → US
```

（实现 MAY 选择更紧凑展示：`via HK,JP`，但字段语义不变）

---

## 14. Versioning（版本）

- 当前文档：NNS v2 Draft
- v2 字段扩展必须保持向后兼容，旧实现应忽略未知字段

---

## 15. License

MIT License.

---

## 附录 A：保留 tag 前缀（v1/v2 兼容）

以下 tag 前缀为保留前缀（Reserved），用于兼容迁移：

- `via:`（路径节点）
- `exit:`（出口节点）

实现 SHOULD 避免将其用于无关含义。

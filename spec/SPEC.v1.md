# Node Naming Standard v1 (NNS v1)
# 节点命名规范 v1

---

## 1. Scope（适用范围）

Node Naming Standard v1（以下简称 **NNS v1**）定义了一套**确定性、可读、可扩展**的节点命名规范，用于：

- 代理节点
- 网络隧道节点
- 订阅型节点列表

本规范关注**节点名称的结构与语义表达**，而非节点的网络质量或实际可用性。

---

## 2. Design Goals（设计目标）

NNS v1 的设计目标包括：

- **确定性（Deterministic）**  
  相同输入应产生相同输出

- **可读性（Readable）**  
  人类可快速识别节点的核心信息

- **可扩展性（Extensible）**  
  为后续版本（v2 / v3）预留空间

- **实现无关（Implementation-agnostic）**  
  不绑定任何特定客户端或平台

---

## 3. Terminology（术语定义）

- **Node Name**：展示给用户的节点名称字符串
- **Field**：节点名称中的一个语义字段
- **Token**：解析过程中得到的最小文本单元
- **CC**：ISO 3166-1 alpha-2 国家/地区代码
- **Alias**：用于归一化匹配的别名

---

## 4. Naming Model（命名模型）

### 4.1 Field Set（字段集合）

NNS v1 定义以下**标准字段**：

| 字段名 | 含义 |
|------|------|
| `flag` | 国家/地区国旗（emoji） |
| `region` | 国家/地区代码（ISO CC） |
| `city` | 城市或地区（可选） |
| `line` | 线路/接入类型（可选） |
| `mult` | 倍率/计费信息（可选） |
| `tags` | 标签/能力标识（可选） |

---

### 4.2 Mandatory vs Optional

- `region` **MUST** 存在  
- 其余字段 **MAY** 存在  
- `flag` **SHOULD** 与 `region` 一致

---

## 5. Canonical Order（标准顺序）

### 5.1 Default Order（默认顺序）

NNS v1 定义的**推荐默认顺序**为：

flag region city line mult tags
示例： 🇭🇰 HK Central IEPL x2 [NF]

---

### 5.2 Custom Order（自定义顺序）

实现 **MAY** 允许用户自定义字段顺序，但：

- 字段语义 **MUST NOT** 改变
- 输出结果 **MUST** 保持确定性

---

## 6. Formatting Rules（格式规则）

### 6.1 Separator（分隔符）

- 默认分隔符为：**空格**
- 实现 **MAY** 允许自定义分隔符
- 不建议使用会造成歧义的分隔符（如连续符号）

---

### 6.2 Character Set

- Node Name **SHOULD** 使用 UTF-8
- 允许 emoji
- 不应依赖不可见字符

---

## 7. Normalization（归一化规则）

### 7.1 Input Normalization

实现 **MUST** 对输入进行归一化处理：

- 忽略大小写
- 忽略空格、连接符、下划线
- 忽略常见标点

---

### 7.2 Alias Resolution

- 国家/地区识别 **MUST** 基于标准 CC
- 多种写法（如 `HK` / `HongKong` / `香港`）**MUST** 归一到同一 CC

---

## 8. Status Lines & Advertising（状态行与广告）

### 8.1 Status Lines

如以下内容：

上传 5G 下载 100G 剩余 50G

yaml
复制代码

- 不属于节点
- 实现 **SHOULD** 提供隐藏选项
- 默认 **SHOULD NOT** 参与规范化输出

---

### 8.2 Advertising / Channel Names

如：

TG频道 https://t.me/xxx

yaml
复制代码

实现 **MAY** 提供以下策略：

- `normalize`：仅输出规范字段
- `keep`：保留原始名称
- `hybrid`：规范输出 + 来源标记

---

## 9. Tags（标签）

### 9.1 Definition

Tags 表示节点的**附加语义**，例如：

- 解锁能力（`[NF]`, `[GPT]`）
- 网络类型（`[家宽]`, `[中转]`）
- 测试/免费标识

---

### 9.2 Rules

- Tags **MUST NOT** 影响字段解析
- Tags **MUST** 置于名称末尾
- Tags **SHOULD** 使用方括号包裹

---

## 10. Determinism（确定性）

对于相同的：

- 输入名称
- 规则集
- 配置选项

输出 **MUST** 相同。

---

## 11. Internationalization（国际化）

- NNS v1 不强制语言转换
- 国家/地区代码以 CC 为准
- 本地化展示 **MAY** 由实现决定

---

## 12. Explicitly Out of Scope（明确不包含内容）

NNS v1 **不定义、不要求、不包含**：

- 网络质量探测
- 延迟 / 带宽测试
- 节点排序
- 可用性判断
- 客户端 UI 行为
- 自动测速
- IP 地理定位
- 解锁验证

上述内容 **MAY** 在 v2 / v3 中讨论。

---

## 13. Forward Compatibility（前向兼容）

- 新字段 **MUST** 不破坏现有字段语义
- 旧实现 **SHOULD** 忽略未知字段

---

## 14. Reference Implementation（参考实现）

NNS v1 提供但不依赖参考实现：

- GUI.for.SingBox 插件
- 字典生成脚本（Python）

参考实现 **MUST NOT** 被视为规范本体。

---

## 15. Versioning（版本）

- 当前版本：**NNS v1**
- 规范版本与实现版本解耦

---

## 16. License

本规范采用 MIT License。

---

### 结束语

> NNS v1 定义的是**最低共识**，而不是全部可能性。  
> 它的目标不是控制实现，而是让不同实现**可以对齐**。

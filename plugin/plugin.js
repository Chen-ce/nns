//GUI.FOR.SINGBOX 的插件


const BASE = `data/${Plugin.id}`
const DICT_DIR = `${BASE}/dict`
const CACHE_DIR = `data/.cache/${Plugin.id}`

// ========== 插件配置 UI ==========
const Configuration = {
    language: {
        label: "显示语言",
        type: "select",
        options: [
            { label: "中文", value: "zh" },
            { label: "English", value: "en" }
        ],
        default: "zh"
    },
    includeFlag: {
        label: "显示国旗",
        type: "switch",
        default: true
    },
    includeCity: {
        label: "显示城市",
        type: "switch",
        default: false
    },
    includeLine: {
        label: "显示线路类型",
        type: "switch",
        default: true
    },
    includeMult: {
        label: "显示倍率",
        type: "switch",
        default: true
    },
    includeTags: {
        label: "显示标签",
        type: "switch",
        default: true
    },
    includePath: {
        label: "显示中转",
        type: "switch",
        default: true
    },
    includeExit: {
        label: "显示落地",
        type: "switch",
        default: true
    },
    maxTags: {
        label: "最多显示标签数",
        type: "number",
        min: 0,
        max: 10,
        default: 3
    },
    statusLinePolicy: {
        label: "状态行处理",
        type: "select",
        options: [
            { label: "隐藏", value: "hide" },
            { label: "保留原样", value: "keep" }
        ],
        default: "hide"
    },
    adPolicy: {
        label: "广告行处理",
        type: "select",
        options: [
            { label: "隐藏", value: "hide" },
            { label: "保留原样", value: "keep" }
        ],
        default: "hide"
    }
}

const DICT_FILE_LIST = [
    "version.json",
    "countries.json",
    "country_alias_map.json",
    "lines.json",
    "line_alias_map.json",
    "tags.json",
    "tag_alias_map.json",
    "cities.json",
    "city_alias_map.json",
    "keywords_status.json",
    "keywords_ad.json",
    "keywords_connectors.json"
]

//枚举项
const DICT_ENUM = {
    COUNTRIES: "countries.json",
    COUNTRY_ALIAS_MAP: "country_alias_map.json",
    LINES: "lines.json",
    LINE_ALIAS_MAP: "line_alias_map.json",
    TAGS: "tags.json",
    TAG_ALIAS_MAP: "tag_alias_map.json",
    CITIES: "cities.json",
    CITY_ALIAS_MAP: "city_alias_map.json",
    KEYWORDS_STATUS: "keywords_status.json",
    KEYWORDS_AD: "keywords_ad.json",
    KEYWORDS_CONNECTORS: "keywords_connectors.json"
}

// NNS 字典 CDN 源列表（按优先级排序，已测试可用）
const DICT_CDN_SOURCES = [
    // jsDelivr CDN（国内访问最快，已测试 ✓）
    "https://cdn.jsdelivr.net/gh/Chen-ce/nns@main/dict/generated",
    // ghproxy.net 镜像（已测试 ✓）
    "https://ghproxy.net/https://raw.githubusercontent.com/Chen-ce/nns/main/dict/generated",
    // GitHub Raw（原始源，已测试 ✓）
    "https://raw.githubusercontent.com/Chen-ce/nns/main/dict/generated"
]

// ========== 字典加载 ==========

let DICTS = {} // 缓存所有字典数据

const ensureDir = async (path) => {
    if (!(await Plugins.FileExists(path))) {
        await Plugins.MakeDir(path)
    }
}

// 校验下载的文件是否为有效 JSON
const validateJSON = async (filePath) => {
    try {
        const content = await Plugins.ReadFile(filePath)
        const trimmed = content.trim()
        // 快速检查：JSON 应该以 { 或 [ 开头
        if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
            return false
        }
        // 尝试解析
        JSON.parse(content)
        return true
    } catch {
        return false
    }
}

// 尝试从多个 CDN 源下载文件
const downloadWithRetry = async (fileName, targetPath) => {
    let lastError = null
    let cdnIndex = 0

    for (const cdnBase of DICT_CDN_SOURCES) {
        try {
            const url = `${cdnBase}/${fileName}`
            await Plugins.Download(url, targetPath)

            // 校验下载的文件
            const isValid = await validateJSON(targetPath)
            if (!isValid) {
                throw new Error('下载的文件不是有效的 JSON')
            }

            return true // 下载成功
        } catch (error) {
            lastError = error
            cdnIndex++

            // 只在切换 CDN 源时提示
            if (cdnIndex < DICT_CDN_SOURCES.length) {
                Plugins.LogWarning(`CDN 源 ${cdnIndex} 失败，尝试下一个: ${error}`)
            }
            continue
        }
    }

    // 所有源都失败
    Plugins.LogError(`所有 CDN 源都无法下载 ${fileName}: ${lastError}`)
    throw new Error(`所有 CDN 源都无法下载 ${fileName}: ${lastError}`)
}

const ensureDictFile = async (fileName) => {
    await ensureDir(DICT_DIR)
    const filePath = `${DICT_DIR}/${fileName}`
    if (await Plugins.FileExists(filePath)) return filePath

    // 下载到临时文件，再移动/覆盖（更安全）
    await ensureDir(CACHE_DIR)
    const tmpPath = `${CACHE_DIR}/${fileName}.tmp`

    await downloadWithRetry(fileName, tmpPath)

    // 如果下载成功，写入正式位置（修复：添加 await）
    await Plugins.MoveFile(tmpPath, filePath)

    return filePath
}

// 限制并发下载（避免并发过高）
const downloadDictsWithLimit = async (fileList, limit = 3) => {
    const results = []
    for (let i = 0; i < fileList.length; i += limit) {
        const batch = fileList.slice(i, i + limit)
        const batchResults = await Promise.all(
            batch.map(fileName => ensureDictFile(fileName))
        )
        results.push(...batchResults)

        // 显示进度
        const progress = Math.min(i + limit, fileList.length)
        Plugins.message.info(`下载进度: ${progress}/${fileList.length}`)
    }
    return results
}

// 加载所有字典到内存
const loadDictionaries = async () => {
    for (const fileName of DICT_FILE_LIST) {
        const filePath = `${DICT_DIR}/${fileName}`

        // 检查文件是否存在
        if (!(await Plugins.FileExists(filePath))) {
            const error = `字典文件不存在: ${fileName}`
            Plugins.LogError(error)
            throw new Error(error)
        }

        try {
            const content = await Plugins.ReadFile(filePath)
            const key = fileName.replace('.json', '').toUpperCase().replace(/-/g, '_')
            DICTS[key] = JSON.parse(content)
        } catch (error) {
            Plugins.LogError(`加载字典失败 ${fileName}: ${error}`)
            throw new Error(`加载字典失败 ${fileName}: ${error}`)
        }
    }
    Plugins.message.success('字典加载完成')
}

/**
 * 合并用户在系统配置中填写的自定义字典扩展
 */
const mergeUserExtensions = () => {
    const tryParse = (val) => {
        try { return val ? JSON.parse(val) : null; } catch (e) { return null; }
    };

    // 1. 合并国家别名
    const customCountries = tryParse(Plugin.customCountries);
    if (customCountries) {
        DICTS.COUNTRIES = DICTS.COUNTRIES || {};
        for (const [code, data] of Object.entries(customCountries)) {
            if (DICTS.COUNTRIES[code]) {
                DICTS.COUNTRIES[code].aliases = [...new Set([...(DICTS.COUNTRIES[code].aliases || []), ...(data.aliases || [])])];
            } else {
                DICTS.COUNTRIES[code] = data;
            }
        }
    }

    // 2. 合并线路别名
    const customLines = tryParse(Plugin.customLines);
    if (customLines) {
        DICTS.LINE_ALIAS_MAP = DICTS.LINE_ALIAS_MAP || {};
        DICTS.LINES = DICTS.LINES || {};
        for (const [code, data] of Object.entries(customLines)) {
            if (typeof data === 'string') {
                DICTS.LINE_ALIAS_MAP[data.toLowerCase()] = code;
            } else {
                DICTS.LINES[code] = { display_en: data.display_en || code, display_zh: data.display_zh || code };
                (data.aliases || []).forEach(a => { DICTS.LINE_ALIAS_MAP[a.toLowerCase()] = code; });
            }
        }
    }

    // 3. 合并标签别名
    const customTags = tryParse(Plugin.customTags);
    if (customTags) {
        DICTS.TAG_ALIAS_MAP = DICTS.TAG_ALIAS_MAP || {};
        DICTS.TAGS = DICTS.TAGS || {};
        for (const [code, data] of Object.entries(customTags)) {
            if (typeof data === 'string') {
                DICTS.TAG_ALIAS_MAP[data.toLowerCase()] = code;
            } else {
                DICTS.TAGS[code] = { display_en: data.display_en || code, display_zh: data.display_zh || code };
                (data.aliases || []).forEach(a => { DICTS.TAG_ALIAS_MAP[a.toLowerCase()] = code; });
            }
        }
    }

    // 4. 合并城市别名
    const customCities = tryParse(Plugin.customCities);
    if (customCities) {
        DICTS.CITIES = DICTS.CITIES || {};
        for (const [reg, cities] of Object.entries(customCities)) {
            DICTS.CITIES[reg] = DICTS.CITIES[reg] || {};
            Object.assign(DICTS.CITIES[reg], cities);
        }
    }

    // 5. 合并语义连接器
    const customConns = tryParse(Plugin.customeConnectors || Plugin.customConnectors);
    if (customConns) {
        DICTS.KEYWORDS_CONNECTORS = DICTS.KEYWORDS_CONNECTORS || {};
        for (const [cat, words] of Object.entries(customConns)) {
            DICTS.KEYWORDS_CONNECTORS[cat] = [...new Set([...(DICTS.KEYWORDS_CONNECTORS[cat] || []), ...words])];
        }
    }

    // 6. 合并状态正则
    const customStatus = tryParse(Plugin.coustomStatus || Plugin.customStatus);
    if (customStatus && customStatus.patterns) {
        DICTS.KEYWORDS_STATUS = DICTS.KEYWORDS_STATUS || { patterns: [] };
        DICTS.KEYWORDS_STATUS.patterns = [...new Set([...DICTS.KEYWORDS_STATUS.patterns, ...customStatus.patterns])];
    }

    console.log(`[${Plugin.name}] 自定义字典合并完成`);
}

/** ---------------- V2 助手函数 ---------------- **/

const v2Normalize = (text) => {
    if (!text) return "";
    return text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').toLowerCase();
};

const v2Tokenize = (text) => {
    if (!text) return [];
    // 匹配倍率 x1.5, 中文, 英文, 数字
    const segments = text.match(/[x×]\d+(?:\.\d+)?|[\u4e00-\u9fa5]+|[a-zA-Z]+|[0-9]+/gi) || [];
    return segments.map(s => s.trim()).filter(Boolean);
};

// 构建全语义索引 (按别名长度倒序 + 分类优先级，用于贪婪匹配)
let UNIVERSAL_INDEX = null;
const buildUniversalIndex = () => {
    if (UNIVERSAL_INDEX) return UNIVERSAL_INDEX;

    const index = [];
    const countries = DICTS.COUNTRIES || {};
    const cities = DICTS.CITIES || {};
    const lines = DICTS.LINES || {};
    const lineAliasMap = DICTS.LINE_ALIAS_MAP || {};
    const tags = DICTS.TAGS || {};
    const tagAliasMap = DICTS.TAG_ALIAS_MAP || {};

    // 优先级矩阵 (同长度时的权重)
    const CAT_PRIORITY = { region: 10, city: 9, line: 8, tag: 5 };

    // 1. 国家/地区
    for (const [code, data] of Object.entries(countries)) {
        (data.aliases || []).forEach(alias => {
            const norm = v2Normalize(alias);
            if (norm) index.push({ alias: norm, code, type: 'region', category: 'region', weight: CAT_PRIORITY.region });
        });
    }

    // 2. 城市
    for (const [regCode, regCities] of Object.entries(cities)) {
        for (const [cityCode, data] of Object.entries(regCities)) {
            (data.aliases || []).forEach(alias => {
                const norm = v2Normalize(alias);
                if (norm) index.push({ alias: norm, code: cityCode, region: regCode, type: 'city', category: 'city', weight: CAT_PRIORITY.city });
            });
        }
    }

    // 3. 线路
    for (const [alias, code] of Object.entries(lineAliasMap)) {
        const norm = v2Normalize(alias);
        if (norm) index.push({ alias: norm, code, type: 'line', category: 'line', weight: CAT_PRIORITY.line });
    }

    // 4. 标签
    for (const [alias, code] of Object.entries(tagAliasMap)) {
        const norm = v2Normalize(alias);
        if (norm) index.push({ alias: norm, code, type: 'tag', category: 'tag', weight: CAT_PRIORITY.tag });
    }

    // 排序逻辑：
    // 1. 长度倒序 (最贪婪)
    // 2. 如果长度相同，按分类优先级倒序
    index.sort((a, b) => (b.alias.length - a.alias.length) || (b.weight - a.weight));
    UNIVERSAL_INDEX = index;
    return index;
};

// 贪婪提取所有语义匹配项
const findMatchesGreedy = (nodeName) => {
    const normName = v2Normalize(nodeName);
    const index = buildUniversalIndex();
    const matches = [];
    const occupied = new Set();

    for (const entry of index) {
        let startPos = 0;
        while (true) {
            const idx = normName.indexOf(entry.alias, startPos);
            if (idx === -1) break;

            let isOccupied = false;
            for (let i = idx; i < idx + entry.alias.length; i++) {
                if (occupied.has(i)) { isOccupied = true; break; }
            }

            if (!isOccupied) {
                matches.push({ ...entry, start: idx, end: idx + entry.alias.length });
                for (let i = idx; i < idx + entry.alias.length; i++) occupied.add(i);
            }
            startPos = idx + 1;
        }
    }
    return matches.sort((a, b) => a.start - b.start);
};


// ========== 版本检查 ==========

// 获取本地字典版本
const getLocalVersion = async () => {
    try {
        const versionPath = `${DICT_DIR}/version.json`;
        if (await Plugins.FileExists(versionPath)) {
            const content = await Plugins.ReadFile(versionPath);
            const data = JSON.parse(content);
            return data.version || '0.0.0';
        }
    } catch (error) {
        Plugins.LogWarning(`读取本地版本失败: ${error}`);
    }
    return '0.0.0';
}

// 获取远程字典版本
const fetchRemoteVersion = async () => {
    for (const cdnBase of DICT_CDN_SOURCES) {
        try {
            const url = `${cdnBase}/version.json`;
            const { body } = await Plugins.HttpGet(url, {});
            if (body && body.version) {
                return body.version;
            }
        } catch (error) {
            continue; // 尝试下一个 CDN
        }
    }
    Plugins.LogWarning('无法获取远程版本信息');
    return null;
}

// 比较版本号 (简单的字符串比较，适用于 semver)
const isNewerVersion = (remote, local) => {
    if (!remote || !local) return false;
    return remote > local;
}

// 检查并更新字典
const checkAndUpdateDictionaries = async () => {
    try {
        const localVersion = await getLocalVersion();
        const remoteVersion = await fetchRemoteVersion();

        if (!remoteVersion) {
            Plugins.LogInfo(`字典版本检查完成 (本地: ${localVersion}, 远程: 无法获取)`);
            return false;
        }

        if (isNewerVersion(remoteVersion, localVersion)) {
            Plugins.message.info(`发现新版本字典 (${localVersion} → ${remoteVersion})，正在更新...`);
            Plugins.LogInfo(`开始更新字典: ${localVersion} → ${remoteVersion}`);

            // 强制重新下载所有文件
            await downloadDictsWithLimit(DICT_FILE_LIST, 3);

            // 重新加载字典
            await loadDictionaries();
            mergeUserExtensions();
            UNIVERSAL_INDEX = null;

            Plugins.message.success(`字典已更新到 v${remoteVersion}`);
            Plugins.LogInfo(`字典更新完成: v${remoteVersion}`);
            return true;
        } else {
            Plugins.LogInfo(`字典已是最新版本: v${localVersion}`);
            return false;
        }
    } catch (error) {
        Plugins.LogError(`版本检查失败: ${error}`);
        return false;
    }
}

// 确保字典已下载并加载到内存
const ensureDictionaries = async () => {
    // 检查是否有缺失的文件
    const missingFiles = [];
    for (const fileName of DICT_FILE_LIST) {
        const filePath = `${DICT_DIR}/${fileName}`;
        if (!(await Plugins.FileExists(filePath))) {
            missingFiles.push(fileName);
        }
    }

    if (missingFiles.length > 0) {
        Plugins.message.info(`正在补全字典文件 (${missingFiles.length}/${DICT_FILE_LIST.length})...`);
        await downloadDictsWithLimit(missingFiles, 3);
    }

    // 如果 DICTS 为空，或者刚才补全了文件，则重新加载
    if (Object.keys(DICTS).length === 0 || missingFiles.length > 0) {
        await loadDictionaries();
        mergeUserExtensions();
        UNIVERSAL_INDEX = null; // 字典重载后强制销毁索引缓存

        // 记录版本信息
        if (DICTS.VERSION) {
            const versionInfo = DICTS.VERSION;
            Plugins.LogInfo(`字典版本: ${versionInfo.version || 'Unknown'}`);
            if (versionInfo.files) {
                const fileCount = Object.keys(versionInfo.files).length;
                Plugins.LogInfo(`已加载 ${fileCount} 个字典文件`);
            }
        }
    }
}

// ========== 配置管理 ==========

const CONFIG_FILE = `${BASE}/config.json`

// 加载用户配置
const loadUserConfig = async () => {
    try {
        if (await Plugins.FileExists(CONFIG_FILE)) {
            const content = await Plugins.ReadFile(CONFIG_FILE)
            return JSON.parse(content)
        }
    } catch (error) {
        Plugins.LogError(`加载用户配置失败: ${error}`)
    }
    return {}
}

// 保存用户配置
const saveUserConfig = async (config) => {
    try {
        await ensureDir(BASE)
        // 自动附加当前版本号
        const version = Plugin.version || Plugin.manifest?.version || '1.0.0'
        const configWithVersion = { ...config, version }
        const content = JSON.stringify(configWithVersion, null, 2)
        await Plugins.WriteFile(CONFIG_FILE, content)
        Plugins.LogInfo(`用户配置已保存 (v${version})`)
        return true
    } catch (error) {
        Plugins.LogError(`保存用户配置失败: ${error}`)
        return false
    }
}

// 合并配置：用户配置 > Plugin.config（默认配置）
const mergeConfig = async () => {
    const userConfig = await loadUserConfig()
    const defaultConfig = Plugin.config || {}
    const currentVersion = Plugin.version || Plugin.manifest?.version || '1.0.0'

    // 默认的全量字段映射
    const allKnownKeys = ['flag', 'region', 'city', 'line', 'mult', 'path', 'exit', 'tags'];

    // 初始化或迁移 fieldOrder
    let rawOrder = userConfig.fieldOrder || defaultConfig.fieldOrder || [...allKnownKeys];

    // 强制补全缺失的字段（对比 allKnownKeys）
    const currentKeys = rawOrder.map(f => typeof f === 'string' ? f : f.key);
    allKnownKeys.forEach(k => {
        if (!currentKeys.includes(k)) {
            rawOrder.push(k);
        }
    });

    const fieldOrder = rawOrder.map(f => {
        if (typeof f === 'string') {
            // V1 字符串数组兼容逻辑
            const legacyKey = `include${f.charAt(0).toUpperCase() + f.slice(1)}`;
            let isVisible = true;
            if (userConfig[legacyKey] !== undefined) isVisible = userConfig[legacyKey];
            else if (defaultConfig[legacyKey] !== undefined) isVisible = defaultConfig[legacyKey];
            return { key: f, visible: isVisible };
        }
        if (!f || !f.key) return null;
        return f;
    }).filter(Boolean);

    const merged = {
        language: userConfig.language || defaultConfig.language || 'zh',
        fieldOrder,
        separator: userConfig.separator || ' ',
        maxTags: userConfig.maxTags || defaultConfig.maxTags || 3,
        statusLinePolicy: userConfig.statusLinePolicy || defaultConfig.statusLinePolicy || 'hide',
        adPolicy: userConfig.adPolicy || defaultConfig.adPolicy || 'hide',
        version: currentVersion
    }

    return merged
}

// ========== NNS 解析器 ==========

// 提取倍率
const extractMultiplier = (nodeName) => {
    // 匹配 x2, 2x, x1.5, 1.5x 等格式
    const match = nodeName.match(/(?:^|[^\d])([x×]?\s*(\d+(?:\.\d+)?)\s*[x×]?)/i)
    if (match) {
        const num = parseFloat(match[2])
        if (!isNaN(num) && num > 0) {
            return num // 只返回数字，不带 x
        }
    }
    return null
}

// 检查是否是状态行
const isStatusLine = (nodeName) => {
    const patterns = DICTS.KEYWORDS_STATUS?.patterns || []
    return patterns.some(pattern => {
        try {
            const regex = new RegExp(pattern, 'i')
            return regex.test(nodeName)
        } catch {
            return false
        }
    })
}

// 检查是否是广告行
const isAdLine = (nodeName) => {
    const patterns = DICTS.KEYWORDS_AD?.patterns || []
    return patterns.some(pattern => {
        try {
            const regex = new RegExp(pattern, 'i')
            return regex.test(nodeName)
        } catch {
            return false
        }
    })
}

// 规范化文本（用于别名匹配）- 保留中文字符
const normalizeText = (text) => {
    // 只移除空格和标点，保留中文、英文、数字
    return text.toLowerCase()
        .replace(/[\s\-_\.。，,、；;：:！!？?（）()\[\]【】「」『』《》〈〉]/g, '')
}

const matchLineV2 = (tokens) => {
    const aliasMap = DICTS.LINE_ALIAS_MAP || {};
    for (const t of tokens) {
        const normT = v2Normalize(t);
        if (aliasMap[normT]) return aliasMap[normT];
    }
    return null;
};

const matchTagsV2 = (tokens, excluded) => {
    const aliasMap = DICTS.TAG_ALIAS_MAP || {};
    const tags = new Set();
    for (const t of tokens) {
        const normT = v2Normalize(t);
        if (excluded.has(normT)) continue;
        if (/^[x×]\d+(\.\d+)?$|^\d+$/.test(normT)) continue;

        if (/[\u4e00-\u9fa5]/.test(t)) {
            for (const [alias, code] of Object.entries(aliasMap)) {
                if (normT.includes(alias)) {
                    if ([...excluded].some(ex => ex.includes(alias))) continue;
                    tags.add(code);
                }
            }
        } else {
            if (aliasMap[normT]) tags.add(aliasMap[normT]);
        }
    }
    return Array.from(tags).sort();
};

// ========== 智能解析算法 ==========

// 统计先验：常见国家（用于打分）
const COMMON_COUNTRIES = ['US', 'HK', 'SG', 'JP', 'TW', 'KR', 'GB', 'DE'];

// 动态获取连接词模式（从字典加载）
const getConnectorPatterns = () => {
    const connectors = DICTS.KEYWORDS_CONNECTORS || {};

    // 构建正则表达式
    const exitWords = connectors.exit || [];
    const viaWords = connectors.via || [];
    const arrowWords = connectors.arrow || [];

    // 合并箭头和落地词作为"落地标记"
    const exitPatterns = [...exitWords, ...arrowWords].map(w =>
        w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // 转义特殊字符
    );

    const viaPatterns = viaWords.map(w =>
        w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );

    return {
        exit: exitPatterns.length > 0 ? new RegExp(exitPatterns.join('|'), 'i') : null,
        via: viaPatterns.length > 0 ? new RegExp(viaPatterns.join('|'), 'i') : null
    };
};

// 生成所有可能的解析候选方案
const generateCandidates = (matches) => {
    const locations = matches.filter(m => m.category === 'region' || m.category === 'city');

    if (locations.length === 0) {
        return [{ region: null, city: null, path: [], exit: null, exitIndex: -1 }];
    }

    if (locations.length === 1) {
        const loc = locations[0];
        return [{
            region: loc.region || loc.code,
            city: loc.type === 'city' ? loc.code : null,
            path: [],
            exit: loc.region || loc.code,
            exitIndex: 0
        }];
    }

    // 多个地理位置：生成所有可能的"中转-落地"组合
    const candidates = [];
    for (let i = 0; i < locations.length; i++) {
        const exit = locations[i];
        const path = locations.slice(0, i).map(l => l.region || l.code).filter(Boolean);

        candidates.push({
            region: exit.region || exit.code,
            city: exit.type === 'city' ? exit.code : null,
            path: [...new Set(path)], // 去重
            exit: exit.region || exit.code,
            exitIndex: i,
            exitMatch: exit
        });
    }

    return candidates;
};

// 计算候选方案的置信度得分
const calculateScore = (candidate, nodeName, matches) => {
    let score = 0;

    // 1. 位置语义 (40%): 越靠后的地理位置越可能是落地
    const totalLocs = matches.filter(m => m.category === 'region' || m.category === 'city').length;
    if (totalLocs > 0 && candidate.exitIndex >= 0) {
        const positionScore = (candidate.exitIndex + 1) / totalLocs;
        score += positionScore * 40;
    }

    // 2. 上下文连贯性 (25%): 检查连接词
    const connectorPatterns = getConnectorPatterns();
    if (connectorPatterns.exit && connectorPatterns.exit.test(nodeName) && candidate.exitMatch) {
        const connectorMatch = nodeName.match(connectorPatterns.exit);
        if (connectorMatch) {
            const connectorPos = connectorMatch.index;
            // 落地位置在连接词之后
            if (candidate.exitMatch.start > connectorPos) {
                score += 25;
            }
        }
    }

    // 3. 别名长度 (15%): 更长的别名匹配更精确
    if (candidate.exitMatch) {
        const lengthScore = Math.min(candidate.exitMatch.alias.length / 10, 1);
        score += lengthScore * 15;
    }

    // 4. 城市-国家一致性检查
    if (candidate.city && candidate.exitMatch) {
        const cityMatch = matches.find(m => m.code === candidate.city && m.type === 'city');
        if (cityMatch) {
            if (cityMatch.region === candidate.region) {
                score += 25; // 一致性奖励
            } else {
                score -= 50; // 严重惩罚不一致
            }
        }
    }

    // 5. 统计先验 (10%): 常见国家加分
    if (COMMON_COUNTRIES.includes(candidate.region)) {
        score += 10;
    }

    return score;
};

// 解决城市冲突（当 city_alias_map 返回数组时）
const resolveCityConflict = (cityRefs, contextCountries) => {
    if (!Array.isArray(cityRefs) || cityRefs.length === 0) {
        return null;
    }

    if (cityRefs.length === 1) {
        return cityRefs[0];
    }

    // 策略 1: 上下文国家匹配
    for (const ref of cityRefs) {
        const countryCode = ref.split('.')[0];
        if (contextCountries.includes(countryCode)) {
            return ref;
        }
    }

    // 策略 2: 统计先验（美国城市更常见）
    const usCityRef = cityRefs.find(ref => ref.startsWith('US.'));
    if (usCityRef) return usCityRef;

    // 策略 3: 默认取第一个
    return cityRefs[0];
};

// 从线路/标签推断国家（降级策略）
const inferCountryFromContext = (parsed) => {
    // 策略 1: 从线路推断
    const lineInference = {
        'IPLC': 'HK',
        'IEPL': 'HK',
        'BGP': 'CN',
        'CN2': 'CN',
        'GIA': 'CN'
    };

    if (parsed.line && lineInference[parsed.line]) {
        return {
            region: lineInference[parsed.line],
            confidence: 0.3,
            source: 'line_inference'
        };
    }

    // 策略 2: 从标签推断
    const tagInference = {
        'Netflix': 'US',
        'Disney': 'US',
        'ChatGPT': 'US',
        'TikTok': 'SG',
        'Bilibili': 'CN',
        'TVB': 'HK'
    };

    for (const tag of parsed.tags) {
        if (tagInference[tag]) {
            return {
                region: tagInference[tag],
                confidence: 0.25,
                source: 'tag_inference'
            };
        }
    }

    return null;
};

// 解析节点名称 (V2 核心引擎 - Universal Greedy)
const parseNodeName = (nodeName) => {
    const result = {
        original: nodeName,
        region: null, city: null, line: null, mult: null,
        tags: [], path: [], exit: null,
        isStatus: isStatusLine(nodeName),
        isAd: isAdLine(nodeName),
        confidence: 0, // 置信度 0-1
        source: 'parsed' // 来源标记
    };

    if (result.isStatus || result.isAd) return result;

    // 1. 提取倍率 (独立正则)
    result.mult = extractMultiplier(nodeName);

    // 2. 全语义贪婪匹配
    const matches = findMatchesGreedy(nodeName);
    const tagCodes = new Set();
    let lineCode = null;

    matches.forEach(m => {
        if (m.category === 'line') {
            if (!lineCode) lineCode = m.code;
        } else if (m.category === 'tag') {
            tagCodes.add(m.code);
        }
    });

    result.line = lineCode;
    result.tags = Array.from(tagCodes).sort();

    // 3. 智能解析地理位置（使用打分算法）
    const candidates = generateCandidates(matches);

    if (candidates.length > 0 && candidates[0].region) {
        // 对所有候选方案打分
        const scoredCandidates = candidates.map(c => ({
            ...c,
            score: calculateScore(c, nodeName, matches)
        }));

        // 选择得分最高的方案
        const best = scoredCandidates.sort((a, b) => b.score - a.score)[0];

        result.region = best.region;
        result.city = best.city;
        result.path = best.path;
        result.exit = best.exit;

        // 计算置信度（基于得分）
        result.confidence = Math.min(best.score / 100, 1.0);
    }

    // 4. 兼容 V1 手动标签 (最高优先级)
    const v1Matches = [...nodeName.matchAll(/\[(via|exit):([a-zA-Z2]+)\]/gi)];
    if (v1Matches.length > 0) {
        v1Matches.forEach(m => {
            const type = m[1].toLowerCase();
            const code = m[2].toUpperCase();
            if (type === 'via') {
                if (!result.path.includes(code)) result.path.push(code);
            } else if (type === 'exit') {
                result.exit = code;
                result.region = code;
            }
        });
        result.confidence = 1.0; // 手动标记置信度最高
        result.source = 'manual';
    }

    // 5. 降级策略：无国家信息时尝试推断
    if (!result.region) {
        const inferred = inferCountryFromContext(result);
        if (inferred) {
            result.region = inferred.region;
            result.confidence = inferred.confidence;
            result.source = inferred.source;
        }
    }

    // 6. 最终置信度计算
    if (result.region && result.city) {
        result.confidence = Math.max(result.confidence, 0.9);
    } else if (result.region) {
        result.confidence = Math.max(result.confidence, 0.7);
    } else if (result.line || result.mult || result.tags.length) {
        result.confidence = Math.max(result.confidence, 0.2);
    }

    return result;
};

// ========== IP 测算助手 ==========

const IP_CACHE = new Map();

const lookupIPLocation = async (proxy) => {
    const target = proxy.server || proxy.tag || proxy.name;
    if (IP_CACHE.has(target)) return IP_CACHE.get(target);

    try {
        // 默认规范实现 (符合 ip_lookup_spec.md)
        let spec = {
            request: {
                url: 'http://ip-api.com/json/${target}?fields=status,message,countryCode,city,query',
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            },
            response: {
                mapping: {
                    region: 'countryCode',
                    city: 'city',
                    ip: 'query'
                }
            }
        };

        try {
            if (Plugin.customIP) {
                const custom = JSON.parse(Plugin.customIP);
                if (custom && custom.request && custom.request.url) {
                    spec = { ...spec, ...custom };
                }
            }
        } catch (e) {
            Plugins.LogWarning(`解析自定义 IP API 规范失败，使用默认值: ${e}`);
        }

        const kernelApi = Plugins.useKernelApiStore();
        const hasTester = !!kernelApi.proxies["NNS-Tester"];
        let finalUrl;

        if (hasTester) {
            // Method B: 穿透测算 (解决 CDN)
            // 静默切换 NNS-Tester 分组到当前节点
            await Plugins.handleUseProxy(kernelApi.proxies["NNS-Tester"], kernelApi.proxies[proxy.tag || proxy.name]);
            await Plugins.sleep(200); // 等待核心生效
            // 在 Method B 下，如果不填目标，API 通常返回“我的 IP”
            finalUrl = spec.request.url.replace(/\${target}/g, '');
        } else {
            // Method A: 服务器识别 (快速)
            finalUrl = spec.request.url.replace(/\${target}/g, encodeURIComponent(target));
        }

        // 发起请求
        const { body } = await Plugins.HttpGet(finalUrl, spec.request.headers || {});

        // 解析响应数据路径
        const getVal = (path, obj) => {
            if (!path) return obj;
            return path.split('.').reduce((p, c) => p && p[c], obj);
        };

        const resultData = spec.response.dataPath ? getVal(spec.response.dataPath, body) : body;

        if (resultData) {
            const map = spec.response.mapping || {};
            const info = {
                region: resultData[map.region],
                city: resultData[map.city],
                ip: resultData[map.ip]
            };
            if (info.region) {
                IP_CACHE.set(target, info);
                return info;
            }
        }
    } catch (e) {
        Plugins.LogWarning(`IP 探测失败 (${target}): ${e}`);
    }
    return null;
};

// ========== NNS 格式化器 ==========

// 生成标准化节点名称
const formatNodeName = async (parsed, proxy = null) => {
    const config = await mergeConfig();
    const isZh = config.language === 'zh';

    if (parsed.isStatus) return config.statusLinePolicy === 'keep' ? parsed.original : null;
    if (parsed.isAd) return config.adPolicy === 'keep' ? parsed.original : null;

    // 自动测算逻辑：如果识别失败 (置信度低) 且开启了自动测算
    if (config.autoIPLookup && parsed.confidence < 0.5 && proxy) {
        const ipInfo = await lookupIPLocation(proxy);
        if (ipInfo && ipInfo.region) {
            parsed.region = ipInfo.region;
            parsed.city = ipInfo.city || parsed.city;
            parsed.confidence = 1.0;
        }
    }

    if (!parsed.region) return parsed.original;

    const parts = [];

    for (const fieldObj of config.fieldOrder) {
        if (fieldObj.visible === false) continue;
        const field = fieldObj.key;
        switch (field) {
            case 'flag':
                const country = DICTS.COUNTRIES?.[parsed.region];
                if (country?.flag) parts.push(country.flag);
                break;
            case 'region':
                parts.push(parsed.region);
                break;
            case 'city':
                if (parsed.city) {
                    const lookupReg = parsed.exit || parsed.region;
                    const city = (DICTS.CITIES?.[lookupReg] || {})[parsed.city];
                    if (city) parts.push(isZh ? city.name_zh : city.name_en);
                }
                break;
            case 'line':
                if (parsed.line) {
                    const line = DICTS.LINES?.[parsed.line];
                    if (line) parts.push(isZh ? line.display_zh : line.display_en);
                }
                break;
            case 'mult':
                if (parsed.mult) parts.push(`x${parsed.mult}`);
                break;
            case 'path':
                if (parsed.path.length) parts.push(`via ${parsed.path.join(', ')}`);
                break;
            case 'exit':
                if (parsed.exit) parts.push(`→ ${parsed.exit}`);
                break;
            case 'tags':
                if (parsed.tags.length) {
                    parsed.tags.slice(0, config.maxTags).forEach(tagCode => {
                        const tagInfo = DICTS.TAGS?.[tagCode];
                        if (tagInfo) parts.push(`[${isZh ? tagInfo.display_zh : tagInfo.display_en}]`);
                    });
                }
                break;
        }
    }

    return parts.join(config.separator || ' ');
};

// ========== 插件钩子 ==========

const onInstallBefore = async () => {
    // 确保插件数据目录存在
    await ensureDir(BASE);

    // 限制并发下载（修复：避免并发过高）
    Plugins.message.info('开始下载字典文件...')
    await downloadDictsWithLimit(DICT_FILE_LIST, 3)

    // 加载字典到内存
    await loadDictionaries()
};


const onUninstallBefore = async () => {
    // 删除插件数据目录
    await Plugins.RemoveFile(BASE)
    // 删除缓存目录（修复：避免缓存积累）
    await Plugins.RemoveFile(CACHE_DIR)
}

/**
 * 插件钩子：安装按钮 - onInstall
 */
const onInstall = async () => {
    await ensureDictionaries()

    return 0 // 初始状态
};

/**
 * 插件钩子：卸载按钮 - onUninstall
 */
const onUninstall = async () => {
    await onUninstallBefore();
    return 0; // 表示初始状态
};

// ========== 配置 UI Modal ==========

// 字段标签映射
const FIELD_LABELS = {
    flag: '国旗',
    region: '地区',
    city: '城市',
    line: '线路',
    mult: '倍率',
    tags: '标签',
    path: '中转',
    exit: '落地'
}

// 打开配置 Modal
const openConfigModal = async () => {
    const Vue = globalThis.Vue || Plugins?.Vue
    if (!Vue) {
        Plugins.message.error('Vue 不可用')
        return null
    }

    const { ref, computed, defineComponent, h } = Vue

    await ensureDictionaries()

    const merged = await mergeConfig()

    const component = defineComponent({

        template: `
            <div style="max-width:900px;padding:16px 20px;display:flex;flex-direction:column;gap:16px;">
              <div>
                <label style="font-weight:600;display:block;margin-bottom:4px;">显示语言</label>
                <Select v-model="language" :options="languageOptions" style="width:200px;margin-left:0;margin-right:auto;display:block;" />
              </div>

              <div style="display:flex;gap:20px;">
                <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:12px;">
                  <Card title="字段顺序与显隐">
                    <div style="font-size:12px;color:var(--text-color-secondary, #999);margin-bottom:8px;">左侧开关控制显示，右侧箭头控制顺序（地区为必填）</div>
                    <div v-for="(fieldObj, idx) in fieldOrder" :key="fieldObj.key"
                         :style="rowStyle(fieldObj)">
                      <Switch
                        :modelValue="fieldObj.visible !== false"
                        :disabled="fieldObj.key === 'region'"
                        size="small"
                        @change="(val) => toggleVisibleKey(fieldObj.key, val)"
                      />
                      <div style="flex:1;min-width:0;display:flex;align-items:center;gap:6px;">
                        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;">
                          {{ fieldLabels[fieldObj.key] || fieldObj.key }}
                        </span>
                        <Tag v-if="fieldObj.key === 'region'" color="green" size="small">必填</Tag>
                      </div>
                      <div style="display:flex;gap:4px;">
                        <button
                          @click="moveField(idx, -1)"
                          :disabled="idx === 0"
                          :style="idx === 0 ? arrowDisabledStyle : arrowStyle"
                        >↑</button>
                        <button
                          @click="moveField(idx, 1)"
                          :disabled="idx === fieldOrder.length - 1"
                          :style="idx === fieldOrder.length - 1 ? arrowDisabledStyle : arrowStyle"
                        >↓</button>
                      </div>
                    </div>
                  </Card>

                  <Card title="分隔符">
                    <Input vmodel="separator" placeholder="空格" style="width:200px;" />
                  </Card>

                  <Card title="分隔符">
                    <Input v-model="separator" placeholder="空格" style="width:200px;" />
                  </Card>

                  <Card title="过滤策略">
                    <div style="margin:8px 0;">
                      <label style="display:block;margin-bottom:4px;">状态行处理</label>
                      <Select v-model="statusLinePolicy" :options="policyOptions" style="width:200px;margin-left:0;margin-right:auto;display:block;" />
                    </div>
                    <div style="margin:8px 0;">
                      <label style="display:block;margin-bottom:4px;">广告行处理</label>
                      <Select v-model="adPolicy" :options="policyOptions" style="width:200px;margin-left:0;margin-right:auto;display:block;" />
                    </div>
                  </Card>
                </div>

                <div style="flex:1;min-width:0;">
                  <Card title="实时预览">
                    <div style="font-size:12px;color:var(--text-color-secondary, #999);margin-bottom:12px;">根据当前配置实时预览节点名称</div>
                    <Card v-for="node in previewNodes" :key="node.original" style="margin:6px 0;padding:12px;">
                      <div style="font-size:11px;color:var(--text-color-secondary, #999);margin-bottom:6px;word-break:break-all;">{{ node.original }}</div>
                      <div v-if="node.hidden" style="display:flex;align-items:center;gap:6px;">
                        <Tag color="orange" size="small">已隐藏</Tag>
                        <span style="font-size:13px;color:var(--text-color-secondary, #999);">{{ node.reason }}</span>
                      </div>
                      <div v-else style="font-weight:500;font-size:13px;word-break:break-all;">{{ node.formatted }}</div>
                    </Card>
                  </Card>
                </div>
              </div>
            </div>
        `,
        setup() {

            const language = ref(merged.language)
            const fieldOrder = ref(merged.fieldOrder)
            const separator = ref(merged.separator)
            const maxTags = ref(merged.maxTags)
            const statusLinePolicy = ref(merged.statusLinePolicy)
            const adPolicy = ref(merged.adPolicy)

            const fieldLabels = {
                flag: '国旗',
                region: '地区',
                city: '城市',
                line: '线路',
                mult: '倍率',
                tags: '标签',
                path: '中转',
                exit: '落地'
            }

            const languageOptions = [
                { label: '中文', value: 'zh' },
                { label: 'English', value: 'en' }
            ]

            const policyOptions = [
                { label: '隐藏', value: 'hide' },
                { label: '保留原样', value: 'keep' }
            ]

            const toggleVisibleKey = (key, checked) => {
                fieldOrder.value = fieldOrder.value.map(f => {
                    if (f.key === 'region') return { ...f, visible: true }
                    if (f.key !== key) return f
                    return { ...f, visible: !!checked }
                })
            }

            const moveField = (idx, dir) => {
                const arr = [...fieldOrder.value]
                const j = idx + dir
                if (j < 0 || j >= arr.length) return
                    ;[arr[idx], arr[j]] = [arr[j], arr[idx]]
                fieldOrder.value = arr
            }

            const sampleNodes = [
                '🇭🇰 HK IEPL x2 [Netflix,ChatGPT]',
                '日本东京 IPLC x1.5',
                'US-LA-BGP',
                'TG频道 @example 免费节点',
                '剩余流量: 50GB | 到期: 2025-01-01'
            ]

            const previewNodes = computed(() => {
                return sampleNodes.map((name) => {
                    const parsed = parseNodeName(name)

                    if (parsed.isStatus) {
                        return statusLinePolicy.value === 'hide'
                            ? { original: name, hidden: true, reason: '已隐藏状态行' }
                            : { original: name, formatted: name, hidden: false }
                    }

                    if (parsed.isAd) {
                        return adPolicy.value === 'hide'
                            ? { original: name, hidden: true, reason: '已隐藏广告' }
                            : { original: name, formatted: name, hidden: false }
                    }

                    if (!parsed.region) {
                        return { original: name, formatted: name, hidden: false }
                    }

                    const parts = []
                    for (const fieldObj of fieldOrder.value) {
                        if (fieldObj.visible === false) continue
                        const field = fieldObj.key

                        if (field === 'flag' && parsed.region) {
                            const countryInfo = DICTS.COUNTRIES?.[parsed.region]
                            if (countryInfo?.flag) parts.push(countryInfo.flag)
                        } else if (field === 'region' && parsed.region) {
                            parts.push(parsed.region)
                        } else if (field === 'city' && parsed.city) {
                            const lookupReg = parsed.exit || parsed.region
                            const cityInfo = (DICTS.CITIES?.[lookupReg] || {})[parsed.city]
                            if (cityInfo) {
                                const cityName = language.value === 'zh' ? cityInfo.name_zh : cityInfo.name_en
                                parts.push(cityName)
                            }
                        } else if (field === 'line' && parsed.line) {
                            const lineInfo = DICTS.LINES?.[parsed.line]
                            if (lineInfo) {
                                const lineName = language.value === 'zh' ? lineInfo.display_zh : lineInfo.display_en
                                parts.push(lineName)
                            }
                        } else if (field === 'mult' && parsed.mult) {
                            parts.push(`x${parsed.mult}`)
                        } else if (field === 'path' && parsed.path.length > 0) {
                            parts.push(`via ${parsed.path.join(', ')}`)
                        } else if (field === 'exit' && parsed.exit) {
                            parts.push(`→ ${parsed.exit}`)
                        } else if (field === 'tags' && parsed.tags.length > 0) {
                            const displayTags = parsed.tags.slice(0, maxTags.value)
                            for (const tagCode of displayTags) {
                                const tagInfo = DICTS.TAGS?.[tagCode]
                                if (tagInfo) {
                                    const tagName = language.value === 'zh' ? tagInfo.display_zh : tagInfo.display_en
                                    parts.push(`[${tagName}]`)
                                }
                            }
                        }
                    }

                    return { original: name, formatted: parts.join(separator.value || ' ') || name, hidden: false }
                })
            })

            const rowStyle = (fieldObj) => {
                const opacity = fieldObj.visible === false ? 'opacity:0.5;' : ''
                return `display:flex;align-items:center;gap:12px;margin:6px 0;padding:6px 0;${opacity}`
            }

            const arrowStyle = 'padding:2px 8px;cursor:pointer;border:1px solid var(--border-color, rgba(128,128,128,0.4));border-radius:4px;background:transparent;color:var(--text-color, currentColor);'
            const arrowDisabledStyle = 'opacity:0.4;cursor:not-allowed;padding:2px 8px;border:1px solid var(--border-color, rgba(128,128,128,0.4));border-radius:4px;background:transparent;color:var(--text-color, currentColor);'

            const getConfig = () => ({
                language: language.value,
                fieldOrder: fieldOrder.value,
                separator: separator.value,
                maxTags: maxTags.value,
                statusLinePolicy: statusLinePolicy.value,
                adPolicy: adPolicy.value
            })

            return {
                language,
                fieldOrder,
                separator,
                maxTags,
                statusLinePolicy,
                adPolicy,
                fieldLabels,
                languageOptions,
                policyOptions,
                toggleVisibleKey,
                moveField,
                previewNodes,
                rowStyle,
                arrowStyle,
                arrowDisabledStyle,
                getConfig
            }
        }
    })

    return new Promise((resolve) => {
        const modal = Plugins.modal(
            {
                title: 'NNS 节点命名配置',
                submit: true,
                cancel: true,
                submitText: '保存',
                cancelText: '取消',
                maskClosable: true,
                onOk: () => {
                    const instance = modal._instance
                    if (instance && instance.exposed) {
                        resolve({ saved: true, config: instance.exposed.getConfig() })
                    } else {
                        resolve({ saved: false })
                    }
                },
                onCancel: () => {
                    resolve({ saved: false })
                },
                afterClose: () => {
                    modal.destroy()
                }
            },
            {
                default: () => h(component)
            }
        )

        modal.open()
    })
}
// ========== 插件钩子 ==========

/**
 * 插件钩子：节点重命名 - onSubscriptionUserinfo
 * 这个钩子在订阅更新时被调用，可以修改节点名称
 */
const onSubscriptionUserinfo = async (proxies) => {
    // 确保字典已下载并加载 (Pre-flight check)
    await ensureDictionaries()

    const results = []

    for (const proxy of proxies) {
        const parsed = parseNodeName(proxy.name)

        // 生成新名称（传入代理对象以支持自动 IP 探测）
        const newName = await formatNodeName(parsed, proxy)

        // 如果返回 null，说明应该过滤（状态行或广告）
        if (newName === null) {
            continue
        }

        results.push({
            ...proxy,
            name: newName || proxy.name // 如果格式化失败，保持原名
        })
    }

    Plugins.message.success(`已重命名 ${results.length} 个节点`)

    return results
}

/**
 * 插件钩子：手动触发 - onRun
 * 允许用户手动对现有订阅的节点进行重命名
 */
const onRun = async () => {
    const version = Plugin.version || Plugin.manifest?.version || 'Unknown'
    Plugins.LogInfo(`[${Plugin.name}] v${version} 开始执行 (ID: ${Plugin.id})`)

    // 步骤 1: 显示配置 Modal
    const configResult = await openConfigModal()

    if (!configResult || !configResult.saved) {
        Plugins.message.info('已取消')
        return
    }

    // 保存配置到文件
    const saved = await saveUserConfig(configResult.config)
    if (!saved) {
        Plugins.message.error('配置保存失败')
        return
    }

    Plugins.LogInfo('用户配置已保存并生效')

    // 步骤 2: 创建进度 Modal
    const Vue = globalThis.Vue || Plugins?.Vue
    if (!Vue) {
        Plugins.message.error('Vue 不可用，无法显示进度界面')
        Plugins.LogError('Vue API 不可用')
        return
    }

    const { ref, h } = Vue
    if (typeof ref !== 'function' || typeof h !== 'function') {
        Plugins.message.error('Vue.h/ref 不可用')
        Plugins.LogError('Vue.h 或 Vue.ref 函数不可用')
        return
    }
    const progressText = ref('正在初始化...')
    const progressPercent = ref(0)

    // 创建进度 Modal
    const progressModal = Plugins.modal(
        {
            title: 'NNS 节点重命名',
            closable: false,
            maskClosable: false,
            footer: null,
        },
        {
            default: () => {
                return h('div', { style: 'min-width:400px;padding:16px 0;' }, [
                    // 进度文本
                    h('div', {
                        style: 'margin-bottom:12px;font-size:14px;color:#333;'
                    }, progressText.value),

                    // 进度条容器
                    h('div', {
                        style: 'height:8px;background:#eee;border-radius:4px;overflow:hidden;'
                    }, [
                        // 进度条
                        h('div', {
                            style: `
                                height:100%;
                                width:${progressPercent.value}%;
                                background:#409eff;
                                transition: width 0.3s ease;
                            `
                        })
                    ]),

                    // 百分比显示
                    h('div', {
                        style: 'margin-top:8px;text-align:right;font-size:12px;color:#999;'
                    }, `${Math.round(progressPercent.value)}%`)
                ])
            }
        }
    )

    progressModal.open()

    try {
        // 步骤 1: 确保字典已下载并加载 (0-20%)
        progressText.value = '正在初始化字典...'
        progressPercent.value = 5

        try {
            await ensureDictionaries()
            progressPercent.value = 20
            Plugins.LogInfo('字典加载成功')
        } catch (error) {
            progressModal.destroy()
            Plugins.message.error('字典初始化失败，请检查网络连接后重试')
            Plugins.LogError(`字典初始化失败: ${error}`)
            return
        }

        // 步骤 2: 获取所有订阅 (20-30%)
        progressText.value = '正在获取订阅列表...'
        progressPercent.value = 25

        Plugins.LogInfo('开始获取订阅列表')
        const subsStore = Plugins.useSubscribesStore?.()
        if (!subsStore || !subsStore.subscribes) {
            progressModal.destroy()
            Plugins.message.error('无法获取订阅列表')
            Plugins.LogError('subsStore 不可用')
            return
        }

        progressPercent.value = 30
        Plugins.LogInfo(`找到 ${subsStore.subscribes.length} 个订阅`)

        // 步骤 3: 让用户选择要处理的订阅
        const subsList = subsStore.subscribes.map((sub, idx) => ({
            label: sub.name || `订阅 ${idx + 1}`,
            value: sub.id
        }))

        if (subsList.length === 0) {
            progressModal.destroy()
            Plugins.message.warn('没有可用的订阅')
            return
        }

        // 暂时隐藏进度 Modal，显示选择器
        progressModal.destroy()

        Plugins.LogInfo('准备显示选择器')
        let selected
        try {
            selected = await Plugins.picker.multi({
                title: '选择要重命名的订阅',
                message: '请选择一个或多个订阅进行节点重命名',
                options: subsList
            })
            Plugins.LogInfo(`用户选择了 ${selected?.length || 0} 个订阅`)
        } catch (error) {
            Plugins.LogError(`选择器错误: ${error}`)
            Plugins.message.error('选择器出错，请重试')
            return
        }

        if (!selected || selected.length === 0) {
            Plugins.LogInfo('用户取消选择')
            return // 用户取消
        }

        // 重新打开进度 Modal
        progressModal.open()
        progressText.value = `开始处理 ${selected.length} 个订阅...`
        progressPercent.value = 35

        // 步骤 4: 处理选中的订阅 (35-90%)
        let totalRenamed = 0
        const processStep = 55 / selected.length // 每个订阅占用的进度

        for (let i = 0; i < selected.length; i++) {
            const subId = selected[i]
            const sub = subsStore.subscribes.find(s => s.id === subId)
            if (!sub || !sub.proxies) continue

            progressText.value = `[${i + 1}/${selected.length}] 正在处理: ${sub.name}`
            progressPercent.value = 35 + (i * processStep)

            const originalCount = sub.proxies.length
            const renamedProxies = []

            for (const proxy of sub.proxies) {
                const parsed = parseNodeName(proxy.name)
                const newName = await formatNodeName(parsed, proxy)

                // 过滤状态行和广告
                if (newName === null) {
                    continue
                }

                renamedProxies.push({
                    ...proxy,
                    name: newName || proxy.name
                })
            }

            // 更新订阅的节点列表
            sub.proxies = renamedProxies
            totalRenamed += renamedProxies.length

            progressText.value = `✓ ${sub.name}: ${originalCount} → ${renamedProxies.length} 个节点`
            progressPercent.value = 35 + ((i + 1) * processStep)

            // 让进度条动画有时间显示
            await new Promise(resolve => setTimeout(resolve, 100))
        }

        // 步骤 5: 保存订阅数据 (90-100%)
        progressText.value = '正在保存...'
        progressPercent.value = 90

        try {
            await subsStore.saveSubscribes?.()
            progressPercent.value = 100
            progressText.value = `🎉 成功重命名 ${totalRenamed} 个节点！`
            Plugins.LogInfo(`重命名完成，共 ${totalRenamed} 个节点`)

            // 显示成功状态 1.5 秒后关闭
            await new Promise(resolve => setTimeout(resolve, 1500))
            progressModal.destroy()
            Plugins.message.success(`🎉 成功重命名 ${totalRenamed} 个节点！`)
        } catch (error) {
            progressModal.destroy()
            Plugins.message.error('保存失败，请重试')
            Plugins.LogError(`保存订阅失败: ${error}`)
        }

    } catch (error) {
        progressModal.destroy()
        Plugins.message.error('处理过程中出错，请重试')
        Plugins.LogError(`onRun 执行错误: ${error}`)
    }
}

// ========== 生命周期钩子 ==========

/**
 * 插件钩子：应用启动时执行
 * 自动检查字典更新
 */
const onStartup = async () => {
    try {
        Plugins.LogInfo(`[${Plugin.name}] 应用启动，开始检查字典更新...`);

        // 确保字典目录存在
        await ensureDir(DICT_DIR);

        // 检查并更新字典
        await checkAndUpdateDictionaries();

        // 确保字典已加载（如果是首次安装或更新失败）
        await ensureDictionaries();

    } catch (error) {
        Plugins.LogError(`[${Plugin.name}] 启动检查失败: ${error}`);
        // 启动检查失败不应阻止应用运行
    }
}
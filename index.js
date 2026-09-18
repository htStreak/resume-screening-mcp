#!/usr/bin/env node

const SERVER_NAME = "resume-screening-mcp";
const SERVER_VERSION = "0.1.0";

const DEFAULT_CONFIG = {
  trust_threshold: 60,
  high_trust_threshold: 80,
  final_score_priority_threshold: 70,
  final_score_interview_threshold: 50,
  match_weight: 0.6,
  competitiveness_weight: 0.4,
};

const SKILLS = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "PHP",
  "SQL", "MySQL", "PostgreSQL", "Redis", "MongoDB", "Oracle",
  "React", "Vue", "Angular", "Node.js", "Express", "Spring", "Spring Boot",
  "Django", "Flask", "FastAPI", "Linux", "Docker", "Kubernetes", "Git",
  "AWS", "Azure", "GCP", "Spark", "Hadoop", "Flink", "TensorFlow", "PyTorch",
  "NLP", "LLM", "RAG", "Agent", "MCP", "Excel", "Tableau", "Power BI",
  "数据分析", "数据挖掘", "机器学习", "深度学习", "自然语言处理", "大模型",
  "产品设计", "用户研究", "原型设计", "项目管理", "需求分析", "测试", "自动化测试",
  "销售", "运营", "内容运营", "新媒体", "电商", "财务", "人力资源", "招聘"
];

const INDUSTRIES = [
  "互联网", "软件", "人工智能", "大数据", "金融", "银行", "证券", "保险",
  "电商", "教育", "医疗", "制造", "汽车", "游戏", "物流", "零售", "房地产",
  "咨询", "人力资源", "招聘", "SaaS", "ToB", "ToC"
];

const TOP_SCHOOLS = [
  "清华大学", "北京大学", "复旦大学", "上海交通大学", "浙江大学", "南京大学",
  "中国科学技术大学", "哈尔滨工业大学", "西安交通大学", "中国人民大学",
  "同济大学", "北京航空航天大学", "北京理工大学", "武汉大学", "华中科技大学",
  "中山大学", "四川大学", "南开大学", "天津大学", "东南大学", "985", "211", "双一流"
];

const BIG_COMPANIES = [
  "阿里", "腾讯", "百度", "字节", "美团", "京东", "华为", "小米", "网易",
  "滴滴", "快手", "拼多多", "蚂蚁", "微软", "Google", "Amazon", "Meta",
  "Apple", "IBM", "Oracle", "SAP"
];

const POSITIVE_ACTIONS = [
  "主导", "负责", "搭建", "设计", "优化", "落地", "推动", "交付", "管理",
  "提升", "降低", "增长", "完成", "上线", "实现", "建设"
];

const VAGUE_WORDS = [
  "丰富经验", "熟悉相关", "若干", "多个", "大量", "较强", "良好", "优秀",
  "等", "参与相关", "一定经验", "较为熟练"
];

const EXAGGERATION_WORDS = [
  "精通", "专家", "顶级", "全栈全能", "全面负责", "核心负责人", "从0到1",
  "千万级", "亿级", "行业领先", "最佳", "第一"
];

function normalizeText(value) {
  return String(value || "").replace(/\r\n/g, "\n").trim();
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function containsAny(text, terms) {
  return terms.filter((term) => text.toLowerCase().includes(term.toLowerCase()));
}

function evidenceAround(text, keyword, size = 36) {
  const index = text.toLowerCase().indexOf(String(keyword).toLowerCase());
  if (index < 0) return "";
  const start = Math.max(0, index - size);
  const end = Math.min(text.length, index + String(keyword).length + size);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

function extractYears(text) {
  const years = [];
  const patterns = [
    /(\d+(?:\.\d+)?)\s*年(?:以上|左右|经验|工作经验|开发经验|从业经验)?/g,
    /(\d+(?:\.\d+)?)\s*\+\s*年/g,
    /(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/gi,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const value = Number(match[1]);
      if (value > 0 && value <= 50) years.push(value);
    }
  }
  return years.length ? Math.max(...years) : 0;
}

function extractName(text, fileName = "") {
  const namePatterns = [
    /(?:姓名|候选人)[:：\s]*([\u4e00-\u9fa5]{2,5}|[A-Za-z][A-Za-z\s]{1,40})/,
    /^([\u4e00-\u9fa5]{2,5})\s*$/m,
  ];
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  const fromFile = String(fileName || "").replace(/\.(pdf|docx?|txt|md)$/i, "").trim();
  return fromFile || "未知候选人";
}

function extractEducation(text) {
  const degreeOrder = ["博士", "硕士", "研究生", "本科", "大专", "专科", "高中"];
  const degree = degreeOrder.find((item) => text.includes(item)) || "";
  const schoolMatch = text.match(/([\u4e00-\u9fa5A-Za-z]{2,30}(?:大学|学院|学校|University|College))/);
  return {
    education: degree || "未识别",
    school: schoolMatch ? schoolMatch[1] : "",
    is_top_school: containsAny(text, TOP_SCHOOLS).length > 0,
  };
}

function extractNumbers(text) {
  const matches = text.match(/(?:提升|增长|降低|减少|节省|转化率|留存率|GMV|营收|成本|效率|用户|订单|访问量|QPS|DAU|MAU|ROI)?[^。；;\n]{0,18}\d+(?:\.\d+)?\s*(?:%|万|亿|k|K|人|次|元|天|小时|个月|年)?/g);
  return unique(matches || []).slice(0, 20);
}

function extractCurrentPosition(text) {
  const patterns = [
    /(?:当前岗位|应聘岗位|职位|岗位)[:：\s]*([^\n，。；;]{2,30})/,
    /(工程师|开发|产品经理|项目经理|运营|销售|设计师|数据分析师|算法工程师|测试工程师|HR|招聘专员)/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  return "";
}

function parseJd({ job_description }) {
  const text = normalizeText(job_description);
  if (!text) throw new Error("job_description 不能为空");
  const requiredSkills = unique(containsAny(text, SKILLS));
  const requiredIndustry = unique(containsAny(text, INDUSTRIES));
  const years = extractYears(text);
  const preferredItems = [];
  if (/985|211|双一流|名校/.test(text)) preferredItems.push("名校背景");
  if (/大厂|头部公司|知名互联网|大型企业/.test(text)) preferredItems.push("大厂或大型企业经历");
  if (/从0到1|高并发|海量|千万级|亿级|复杂系统/.test(text)) preferredItems.push("稀缺或复杂项目经历");
  if (/管理|带团队|负责人|Leader|主管/.test(text)) preferredItems.push("团队管理或负责人经历");

  const responsibilities = unique(
    text
      .split(/[。；;\n]/)
      .map((line) => line.trim())
      .filter((line) => line.length >= 8 && /(负责|参与|完成|推动|建设|设计|开发|运营|管理)/.test(line))
  ).slice(0, 8);

  return {
    required_years: years,
    required_skills: requiredSkills,
    required_industry: requiredIndustry,
    preferred_items: preferredItems,
    responsibilities,
  };
}

function parseResume({ resume }) {
  const fileName = resume?.file_name || resume?.name || "";
  const text = normalizeText(resume?.text);
  if (!text) throw new Error("resume.text 不能为空");

  const education = extractEducation(text);
  const skills = unique(containsAny(text, SKILLS));
  const industries = unique(containsAny(text, INDUSTRIES));
  const verbs = unique(containsAny(text, POSITIVE_ACTIONS));
  const numberClaims = extractNumbers(text);
  const bigCompanies = unique(containsAny(text, BIG_COMPANIES));

  return {
    file_name: fileName,
    name: extractName(text, fileName),
    total_years: extractYears(text),
    current_position: extractCurrentPosition(text),
    education: education.education,
    school: education.school,
    is_top_school: education.is_top_school,
    skills,
    industries,
    big_companies: bigCompanies,
    work_experiences: extractWorkExperiences(text),
    key_achievements: numberClaims.slice(0, 8),
    all_verbs: verbs,
    number_claims: numberClaims,
  };
}

function extractWorkExperiences(text) {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const expLines = lines.filter((line) =>
    /公司|工作经历|项目经历|实习|负责|主导|参与|任职|20\d{2}|19\d{2}/.test(line)
  );
  return expLines.slice(0, 12).map((line) => ({
    raw: line.slice(0, 220),
    duration_months: inferDurationMonths(line),
    verbs: containsAny(line, POSITIVE_ACTIONS),
    numbers: extractNumbers(line),
  }));
}

function inferDurationMonths(line) {
  const range = line.match(/(20\d{2}|19\d{2})[./年-]?\s*(\d{1,2})?.{0,6}(20\d{2}|19\d{2})?[./年-]?\s*(\d{1,2})?/);
  if (!range) return 0;
  const startYear = Number(range[1]);
  const startMonth = Number(range[2] || 1);
  const endYear = Number(range[3] || new Date().getFullYear());
  const endMonth = Number(range[4] || 12);
  const months = (endYear - startYear) * 12 + (endMonth - startMonth);
  return months > 0 && months < 600 ? months : 0;
}

function matchResumeToJd(candidateInfo, jdInfo) {
  const requiredYears = Number(jdInfo.required_years || 0);
  let yearsScore = 100;
  if (requiredYears > 0) {
    yearsScore = clamp((Number(candidateInfo.total_years || 0) / requiredYears) * 100);
  }

  const requiredSkills = jdInfo.required_skills || [];
  const matchedSkills = requiredSkills.filter((skill) =>
    (candidateInfo.skills || []).some((candidateSkill) => candidateSkill.toLowerCase() === skill.toLowerCase())
  );
  const skillsScore = requiredSkills.length ? (matchedSkills.length / requiredSkills.length) * 100 : 70;

  const requiredIndustry = jdInfo.required_industry || [];
  const matchedIndustry = requiredIndustry.filter((industry) => (candidateInfo.industries || []).includes(industry));
  const industryScore = requiredIndustry.length ? (matchedIndustry.length / requiredIndustry.length) * 100 : 70;

  const matchScore = round1(yearsScore * 0.4 + skillsScore * 0.4 + industryScore * 0.2);
  return {
    match_score: matchScore,
    detail: {
      years_score: round1(yearsScore),
      skills_score: round1(skillsScore),
      industry_score: round1(industryScore),
      required_years: requiredYears,
      candidate_years: candidateInfo.total_years,
      matched_skills: matchedSkills,
      missing_skills: requiredSkills.filter((skill) => !matchedSkills.includes(skill)),
      matched_industry: matchedIndustry,
    },
    conclusion:
      matchScore >= 80 ? "岗位匹配度较高" :
      matchScore >= 60 ? "岗位匹配度中等，建议结合面试核实" :
      "岗位匹配度偏低",
  };
}

function checkResumeTrust(candidateInfo, text) {
  const flags = [];
  let deduction = 0;

  const exaggerations = unique(containsAny(text, EXAGGERATION_WORDS));
  const exaggerationEvidence = exaggerations
    .map((word) => evidenceAround(text, word))
    .filter(Boolean)
    .slice(0, 3);
  if (exaggerations.length) {
    const points = Math.min(24, exaggerations.length * 8);
    deduction += points;
    flags.push({
      type: "疑似夸大表达",
      deduction: points,
      evidence: exaggerationEvidence,
      reason: "出现强结论或高量级描述，建议结合项目细节核实。",
      questions: ["请说明该成果的个人职责边界、数据来源和验证方式。"],
    });
  }

  const vagueWords = unique(containsAny(text, VAGUE_WORDS));
  if (vagueWords.length >= 2) {
    deduction += 10;
    flags.push({
      type: "信息表述偏模糊",
      deduction: 10,
      evidence: vagueWords.slice(0, 4).map((word) => evidenceAround(text, word)).filter(Boolean),
      reason: "存在较多泛化表述，缺少可验证的任务、范围或结果。",
      questions: ["请举一个最能代表能力的具体项目，并说明目标、行动和结果。"],
    });
  }

  if ((candidateInfo.skills || []).length >= 14 && (candidateInfo.number_claims || []).length <= 2) {
    deduction += 10;
    flags.push({
      type: "技能堆砌信号",
      deduction: 10,
      evidence: [`识别到技能数量 ${candidateInfo.skills.length} 个，但量化成果较少。`],
      reason: "技能列表较长但缺少成果支撑，建议核实真实熟练度。",
      questions: ["请按熟练程度对简历中的技能排序，并说明最近一次实际使用场景。"],
    });
  }

  if ((candidateInfo.total_years || 0) <= 2 && /高级|资深|专家|负责人|架构师/.test(text)) {
    deduction += 12;
    flags.push({
      type: "年限与职级疑似不匹配",
      deduction: 12,
      evidence: [`识别工作年限约 ${candidateInfo.total_years || 0} 年，同时出现较高职级描述。`],
      reason: "较短年限与高职级描述之间存在需核实之处。",
      questions: ["请说明获得该职级或负责人角色的时间、团队规模和评估标准。"],
    });
  }

  const trustScore = clamp(100 - deduction);
  const trustLevel = trustScore >= 80 ? "高可信" : trustScore >= 60 ? "中可信" : "低可信";
  return {
    trust_score: trustScore,
    trust_level: trustLevel,
    trust_status: trustScore >= 60 ? "可进入排序" : "建议淘汰",
    flags,
    deduction_detail: flags.map((flag) => ({ type: flag.type, deduction: flag.deduction, reason: flag.reason })),
    questions: flags.flatMap((flag) => flag.questions),
  };
}

function scoreCompetitiveness(candidateInfo) {
  const details = [];
  let score = 50;

  if ((candidateInfo.key_achievements || []).length >= 2) {
    score += 10;
    details.push({ item: "高含金量成就", points: 10, evidence: candidateInfo.key_achievements.slice(0, 3) });
  }
  if (/(高并发|大模型|推荐系统|风控|支付|搜索|分布式|复杂系统)/.test(JSON.stringify(candidateInfo))) {
    score += 8;
    details.push({ item: "稀缺经历", points: 8, evidence: ["识别到复杂系统或稀缺技术关键词"] });
  }
  if (candidateInfo.is_top_school) {
    score += 5;
    details.push({ item: "名校背景", points: 5, evidence: [candidateInfo.school || "简历包含名校相关描述"] });
  }
  if ((candidateInfo.big_companies || []).length) {
    score += 5;
    details.push({ item: "大厂背景", points: 5, evidence: candidateInfo.big_companies.slice(0, 3) });
  }
  if (/初级|中级|高级|资深|负责人|主管|经理|总监/.test(JSON.stringify(candidateInfo))) {
    score += 5;
    details.push({ item: "职级递进", points: 5, evidence: ["简历包含职级或职责递进描述"] });
  }

  return { competitiveness_score: clamp(score), bonus_details: details };
}

function recommendationLabel(trustScore, finalScore) {
  if (trustScore < 60) return "淘汰";
  if (trustScore >= 80 && finalScore >= 70) return "优先联系";
  if (trustScore >= 80 && finalScore >= 50) return "可推进面试";
  if (trustScore >= 60 && finalScore >= 70) return "建议核实（能力优秀，重点追问疑点）";
  if (trustScore >= 60 && finalScore >= 50) return "建议核实";
  return "暂不联系";
}

function analyzeCandidate({ resume, job_description = "", jd_info = null, config = {} }) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...(config || {}) };
  const text = normalizeText(resume?.text);
  if (!text) throw new Error("resume.text 不能为空");
  const candidateInfo = parseResume({ resume });
  const jdInfo = jd_info || (job_description ? parseJd({ job_description }) : null);
  const matchResult = jdInfo ? matchResumeToJd(candidateInfo, jdInfo) : null;
  const checkResult = checkResumeTrust(candidateInfo, text);
  const competitiveness = scoreCompetitiveness(candidateInfo);

  let finalScore = null;
  let label = checkResult.trust_score < mergedConfig.trust_threshold ? "淘汰" : "待补充 JD 后评分";
  if (matchResult && checkResult.trust_score >= mergedConfig.trust_threshold) {
    finalScore = round1(
      matchResult.match_score * mergedConfig.match_weight +
      competitiveness.competitiveness_score * mergedConfig.competitiveness_weight
    );
    label = recommendationLabel(checkResult.trust_score, finalScore);
  }

  return {
    candidate_info: candidateInfo,
    match_result: matchResult,
    check_result: checkResult,
    competitiveness,
    final_score: finalScore,
    recommendation_label: label,
  };
}

function screenResumes({ resumes, job_description, config = {} }) {
  if (!Array.isArray(resumes) || resumes.length === 0) throw new Error("resumes 必须是非空数组");
  if (!normalizeText(job_description)) throw new Error("job_description 不能为空");

  const mergedConfig = { ...DEFAULT_CONFIG, ...(config || {}) };
  const jdInfo = parseJd({ job_description });
  const analyzed = resumes.map((resume) => analyzeCandidate({
    resume,
    jd_info: jdInfo,
    config: mergedConfig,
  }));

  const eliminated = analyzed
    .filter((item) => item.check_result.trust_score < mergedConfig.trust_threshold)
    .map((item) => ({
      candidate: item.candidate_info.name,
      file_name: item.candidate_info.file_name,
      trust_score: item.check_result.trust_score,
      reason: item.check_result.flags.map((flag) => flag.type).join("；") || "可信度低于阈值",
      evidence: item.check_result.flags.flatMap((flag) => flag.evidence).slice(0, 5),
    }));

  const rankedCandidates = analyzed
    .filter((item) => item.check_result.trust_score >= mergedConfig.trust_threshold)
    .sort((a, b) => {
      if ((b.final_score || 0) !== (a.final_score || 0)) return (b.final_score || 0) - (a.final_score || 0);
      return b.check_result.trust_score - a.check_result.trust_score;
    })
    .map((item, index) => ({
      rank: index + 1,
      candidate: item.candidate_info.name,
      file_name: item.candidate_info.file_name,
      total_years: item.candidate_info.total_years,
      final_score: item.final_score,
      match_score: item.match_result?.match_score,
      trust_score: item.check_result.trust_score,
      trust_level: item.check_result.trust_level,
      recommendation_label: item.recommendation_label,
      matched_skills: item.match_result?.detail?.matched_skills || [],
      missing_skills: item.match_result?.detail?.missing_skills || [],
    }));

  const result = {
    version: SERVER_VERSION,
    config: mergedConfig,
    jd_info: jdInfo,
    eliminated,
    ranked_candidates: rankedCandidates,
    risk_questions: analyzed.map((item) => ({
      candidate: item.candidate_info.name,
      questions: item.check_result.questions,
      flags: item.check_result.flags,
    })).filter((item) => item.questions.length || item.flags.length),
    bonus_details: analyzed.map((item) => ({
      candidate: item.candidate_info.name,
      details: item.competitiveness.bonus_details,
    })).filter((item) => item.details.length),
    raw_analysis: analyzed,
  };
  result.summary = `共分析 ${analyzed.length} 份简历，晋级 ${rankedCandidates.length} 人，淘汰 ${eliminated.length} 人。`;
  result.markdown_report = generateReport({ screening_result: result }).markdown;
  return result;
}

function generateReport({ screening_result }) {
  const result = screening_result || {};
  const eliminated = result.eliminated || [];
  const ranked = result.ranked_candidates || [];
  const riskQuestions = result.risk_questions || [];
  const bonusDetails = result.bonus_details || [];

  const lines = [];
  lines.push("## 淘汰名单（可信度低于阈值，不参与排序）");
  if (!eliminated.length) {
    lines.push("暂无。");
  } else {
    lines.push("| 候选人 | 可信度 | 淘汰理由 |");
    lines.push("|---|---:|---|");
    for (const item of eliminated) {
      lines.push(`| ${item.candidate} | ${item.trust_score} | ${item.reason || "可信度低于阈值"} |`);
    }
  }

  lines.push("");
  lines.push("## 晋级排序榜（按综合得分从高到低）");
  if (!ranked.length) {
    lines.push("暂无。");
  } else {
    lines.push("| 排名 | 候选人 | 综合得分 | 匹配度 | 可信度 | 建议标签 |");
    lines.push("|---:|---|---:|---:|---:|---|");
    for (const item of ranked) {
      lines.push(`| ${item.rank} | ${item.candidate}（${item.total_years || 0}年） | ${item.final_score ?? "-"} | ${item.match_score ?? "-"} | ${item.trust_score} | ${item.recommendation_label} |`);
    }
  }

  lines.push("");
  lines.push("## 疑点与追问清单");
  if (!riskQuestions.length) {
    lines.push("暂无明显疑点。");
  } else {
    for (const item of riskQuestions) {
      lines.push(`### ${item.candidate}`);
      for (const flag of item.flags || []) {
        const evidence = (flag.evidence || []).join("；") || "无明确原文片段";
        const question = (flag.questions || []).join("；") || "建议面试核实相关经历。";
        lines.push(`- ${evidence} -> ${flag.type} -> ${flag.reason} -> ${question}`);
      }
    }
  }

  lines.push("");
  lines.push("## 竞争加分明细");
  if (!bonusDetails.length) {
    lines.push("暂无明确竞争加分项。");
  } else {
    for (const item of bonusDetails) {
      lines.push(`### ${item.candidate}`);
      for (const detail of item.details || []) {
        lines.push(`- ${detail.item}：+${detail.points}，依据：${(detail.evidence || []).join("；")}`);
      }
    }
  }

  lines.push("");
  lines.push("## 评估说明");
  lines.push("- 本分析基于简历文本特征与规则引擎生成，仅供招聘初筛参考，不构成对候选人品行或录用结果的定性。");
  lines.push("- 关键数据请以面试核实、作品验证和背景调查为准。");

  return { markdown: lines.join("\n") };
}

const TOOLS = [
  {
    name: "parse_jd",
    description: "从岗位 JD 文本中提取工作年限、技能、行业、职责和加分项要求。",
    inputSchema: {
      type: "object",
      properties: {
        job_description: { type: "string", description: "岗位 JD 原文。" },
      },
      required: ["job_description"],
    },
  },
  {
    name: "analyze_candidate",
    description: "分析单个候选人，输出结构化简历信息、可信度、匹配度、综合得分和面试追问。",
    inputSchema: {
      type: "object",
      properties: {
        resume: {
          type: "object",
          properties: {
            file_name: { type: "string" },
            text: { type: "string" },
          },
          required: ["text"],
        },
        job_description: { type: "string" },
        config: { type: "object" },
      },
      required: ["resume"],
    },
  },
  {
    name: "screen_resumes",
    description: "批量分析多份简历和岗位 JD，输出淘汰名单、晋级排序榜、疑点追问和 Markdown 报告。",
    inputSchema: {
      type: "object",
      properties: {
        resumes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              file_name: { type: "string" },
              text: { type: "string" },
            },
            required: ["text"],
          },
        },
        job_description: { type: "string" },
        config: {
          type: "object",
          properties: {
            trust_threshold: { type: "number" },
            match_weight: { type: "number" },
            competitiveness_weight: { type: "number" },
          },
        },
      },
      required: ["resumes", "job_description"],
    },
  },
  {
    name: "generate_report",
    description: "把 screen_resumes 的结构化结果转换为中文 Markdown 报告。",
    inputSchema: {
      type: "object",
      properties: {
        screening_result: { type: "object" },
      },
      required: ["screening_result"],
    },
  },
];

function callTool(name, args) {
  if (name === "parse_jd") return parseJd(args || {});
  if (name === "analyze_candidate") return analyzeCandidate(args || {});
  if (name === "screen_resumes") return screenResumes(args || {});
  if (name === "generate_report") return generateReport(args || {});
  throw new Error(`未知工具：${name}`);
}

let inputBuffer = Buffer.alloc(0);

process.stdin.on("data", (chunk) => {
  inputBuffer = Buffer.concat([inputBuffer, chunk]);
  processMessages();
});

process.stdin.on("error", () => process.exit(1));

function processMessages() {
  while (true) {
    const headerEnd = inputBuffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) return;

    const header = inputBuffer.slice(0, headerEnd).toString("utf8");
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) {
      inputBuffer = inputBuffer.slice(headerEnd + 4);
      continue;
    }

    const length = Number(match[1]);
    const messageStart = headerEnd + 4;
    const messageEnd = messageStart + length;
    if (inputBuffer.length < messageEnd) return;

    const raw = inputBuffer.slice(messageStart, messageEnd).toString("utf8");
    inputBuffer = inputBuffer.slice(messageEnd);

    try {
      handleMessage(JSON.parse(raw));
    } catch (error) {
      sendError(null, -32700, `解析 MCP 消息失败：${error.message}`);
    }
  }
}

function handleMessage(message) {
  if (!message || typeof message !== "object") return;
  if (message.id === undefined || message.id === null) return;

  try {
    if (message.method === "initialize") {
      sendResult(message.id, {
        protocolVersion: message.params?.protocolVersion || "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      });
      return;
    }

    if (message.method === "tools/list") {
      sendResult(message.id, { tools: TOOLS });
      return;
    }

    if (message.method === "tools/call") {
      const toolName = message.params?.name;
      const args = message.params?.arguments || {};
      const result = callTool(toolName, args);
      sendResult(message.id, {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        structuredContent: result,
      });
      return;
    }

    sendError(message.id, -32601, `不支持的方法：${message.method}`);
  } catch (error) {
    sendError(message.id, -32000, error.message || String(error));
  }
}

function sendResult(id, result) {
  writeMessage({ jsonrpc: "2.0", id, result });
}

function sendError(id, code, message) {
  writeMessage({ jsonrpc: "2.0", id, error: { code, message } });
}

function writeMessage(payload) {
  const json = JSON.stringify(payload);
  const bytes = Buffer.byteLength(json, "utf8");
  process.stdout.write(`Content-Length: ${bytes}\r\n\r\n${json}`);
}

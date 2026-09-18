# Resume Screening MCP

这是为“简历初筛执行器”准备的 MCP 服务。它把简历结构化、岗位匹配、可信度检测、综合评分、候选人排序和报告生成封装成工具，减少 agent 提示词中的复杂规则。

## 工具列表

| 工具名 | 作用 |
|---|---|
| `parse_jd` | 解析岗位 JD，提取年限、技能、行业和加分项 |
| `analyze_candidate` | 分析单个候选人，输出结构化信息、可信度、匹配度和综合得分 |
| `screen_resumes` | 批量分析多份简历，输出淘汰名单、晋级榜、疑点追问和报告 |
| `generate_report` | 将结构化筛选结果转换为中文 Markdown 报告 |

## 在平台中的服务信息

服务名称：

```text
简历初筛MCP
```

描述：

```text
为简历初筛执行器提供岗位JD解析、简历结构化、岗位匹配度计算、可信度检测、综合评分、候选人排序和中文报告生成能力。Agent负责对话和流程调度，MCP负责稳定的规则计算和结构化输出。
```

## MCP 服务配置

如果你已经把这个包发布到 npm，使用：

```json
{
  "mcpServers": {
    "resume-screening-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "resume-screening-mcp"
      ],
      "env": {}
    }
  }
}
```

如果你先在本机测试，使用本地 Node 路径运行：

```json
{
  "mcpServers": {
    "resume-screening-mcp": {
      "command": "node",
      "args": [
        "C:\\Users\\Lenovo\\Documents\\Codex\\2026-09-18\\ge-m\\outputs\\resume-screening-mcp\\src\\index.js"
      ],
      "env": {}
    }
  }
}
```

如果你的平台只支持 `npx`，但还没有发布 npm 包，可以先把本项目上传到 GitHub，然后使用类似配置：

```json
{
  "mcpServers": {
    "resume-screening-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "github:你的用户名/resume-screening-mcp"
      ],
      "env": {}
    }
  }
}
```

## 关键输入示例

调用 `screen_resumes`：

```json
{
  "resumes": [
    {
      "file_name": "张三.pdf",
      "text": "姓名：张三\n本科 清华大学\n5年 Java Spring Boot MySQL Redis 互联网经验，负责订单系统，提升效率30%。"
    }
  ],
  "job_description": "招聘 Java 后端工程师，要求3年以上经验，熟悉 Java、Spring Boot、MySQL，有互联网经验优先。",
  "config": {
    "trust_threshold": 60,
    "match_weight": 0.6,
    "competitiveness_weight": 0.4
  }
}
```

## 本地测试

```bash
npm run test:smoke
```

## 接入建议

原 agent 提示词不需要再写完整评分公式和七步流程，只需要规定：

1. 何时复用已解析简历文本；
2. 何时索要 JD；
3. 何时调用 `screen_resumes`；
4. 不允许绕过 MCP 自行打分；
5. 按 MCP 返回结果整理中文报告。

新版提示词见 `agent-prompt.md`。

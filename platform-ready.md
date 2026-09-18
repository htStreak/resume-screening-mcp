# 简历初筛 MCP 平台填写版

## 一 服务名称

```text
简历初筛MCP
```

说明：平台服务名称限制 30 字以内，这个名称简短、明确，适合直接填写。

## 二 服务描述

```text
为简历初筛执行器提供岗位JD解析、简历结构化、岗位匹配度计算、可信度检测、综合评分、候选人排序和中文报告生成能力。Agent负责对话、文件接收和流程调度，MCP负责稳定的规则计算和结构化输出，避免仅依赖提示词进行打分和排序。
```

## 三 推荐安装方式

推荐选择：

```text
npx
```

原因：当前 MCP 是 Node.js 标准 stdio MCP 服务，最适合通过 `npx` 或 `node` 启动。

## 四 各安装方式说明

| 安装方式 | 是否推荐 | 说明 |
|---|---|---|
| npx | 推荐 | 当前项目是 Node MCP，最适合使用 npx。发布到 npm 或 GitHub 后可以直接配置。 |
| uvx | 不推荐 | uvx 适合 Python MCP 包。本项目不是 Python 包，除非后续重写为 Python 版本。 |
| sse | 暂不推荐 | 适合已经部署成远程 SSE 服务的 MCP。本项目当前是本地 stdio 服务。 |
| streamableHttp | 暂不推荐 | 适合部署成远程 HTTP MCP 服务。本项目当前没有远程 HTTP 地址。 |
| 组件库 | 不推荐 | 适合平台内置组件，不适合这个自定义简历筛选服务。 |

## 五 MCP 服务配置

### 方案 A 本地测试配置

如果平台允许使用 `node` 命令，可以直接填这个：

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

### 方案 B 发布到 npm 后的 npx 配置

如果你把项目发布到 npm，选择 `npx`，配置填写：

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

### 方案 C 上传到 GitHub 后的 npx 配置

如果你暂时不发布 npm，可以先上传到 GitHub，然后配置：

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

使用时把 `你的用户名` 改成你的 GitHub 用户名。

### 方案 D uvx 配置说明

当前不建议填写 uvx。如果平台必须选择 uvx，需要先把 MCP 改写成 Python 包，然后才可以使用类似配置：

```json
{
  "mcpServers": {
    "resume-screening-mcp": {
      "command": "uvx",
      "args": [
        "resume-screening-mcp"
      ],
      "env": {}
    }
  }
}
```

当前生成的项目不是 Python 包，所以不要直接使用这个配置。

### 方案 E sse 配置说明

当前不建议选择 sse。只有当你把 MCP 部署成远程 SSE 服务后，才使用类似配置：

```json
{
  "mcpServers": {
    "resume-screening-mcp": {
      "url": "https://你的域名/sse",
      "env": {}
    }
  }
}
```

### 方案 F streamableHttp 配置说明

当前不建议选择 streamableHttp。只有当你把 MCP 部署成远程 HTTP 服务后，才使用类似配置：

```json
{
  "mcpServers": {
    "resume-screening-mcp": {
      "url": "https://你的域名/mcp",
      "env": {}
    }
  }
}
```

## 六 当前 MCP 工具

| 工具名 | 作用 |
|---|---|
| `parse_jd` | 解析岗位 JD，提取年限、技能、行业、职责和加分项 |
| `analyze_candidate` | 分析单个候选人，输出结构化信息、可信度、匹配度和综合得分 |
| `screen_resumes` | 批量分析多份简历，输出淘汰名单、晋级榜、疑点追问和报告 |
| `generate_report` | 将结构化筛选结果转换为中文 Markdown 报告 |

## 七 推荐填写总结

如果你的平台页面和截图一致，建议这样填：

服务名称：

```text
简历初筛MCP
```

描述：

```text
为简历初筛执行器提供岗位JD解析、简历结构化、岗位匹配度计算、可信度检测、综合评分、候选人排序和中文报告生成能力。Agent负责对话、文件接收和流程调度，MCP负责稳定的规则计算和结构化输出，避免仅依赖提示词进行打分和排序。
```

安装方式：

```text
npx
```

MCP 服务配置：

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

如果你还没有上传 GitHub，就先不要用 GitHub 配置；先使用本地 `node` 配置测试。

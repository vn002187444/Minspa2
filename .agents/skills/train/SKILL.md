# Train — Agent Self-Learning Skill

## Purpose
Teach the agent how to extract lessons from interactions, create tools (MCP servers), and create/update skills automatically.

## Triggers
Apply this skill when the user says any of:
- "train", "học", "learn", "rút bài học", "cập nhật skill", "tạo tool", "tạo skill"
- After any bug fix, configuration fix, or non-trivial code change
- After any investigation that uncovers a root cause

## Workflow

### 1. Detect a Lesson
A lesson should be recorded when any of these happen:
- A bug is found and fixed (root cause identified)
- A configuration issue is resolved (e.g., env vars, Tailwind, TypeScript)
- A non-obvious behavior is discovered (e.g., CSS cascade priority, third-party script behavior)
- A deployment/CI issue is diagnosed

### 2. Update an Existing Skill
When updating a skill like `.agents/skills/minspa/SKILL.md`:
- Add new entries to the **Critical Lessons** section (numbered sequentially)
- Each lesson must include: **Bug/Root Cause**, **Fix**, **Rule** (prevent recurrence)
- Keep the existing numbering consistent — renumber if needed
- Place the new lesson in the appropriate subsection
- Then: `git add`, `git commit -m "docs: add lesson on <topic> to <skill name>"`, `git push`

### 3. Create a New Skill
Create a new skill when:
- A distinct domain/topic appears repeatedly (e.g., deployment, monitoring, a new third-party service)
- The existing minspa skill becomes too large (Critical Lessons > 15 items)
- The user explicitly requests a new skill for a specific topic

New skill structure (in `.agents/skills/<name>/`):
```
SKILL.md              — Required: overview, triggers, rules, conventions
references/           — Optional: reference docs, guides
assets/               — Optional: images, templates
skills/               — Optional: sub-skills, nested skills
```

### 4. Create or Update MCP Tools
Create a new MCP tool entry in `opencode.json` when:
- A new third-party service is integrated that has an MCP server available
- The user asks for browser automation, database management, or external API interaction
- An existing workflow would be significantly faster with a dedicated tool

Format in `opencode.json`:
```json
{
  "mcp": {
    "<tool-name>": {
      "type": "local",
      "command": ["npx", "-y", "<package>"],
      "enabled": true
    }
  }
}
```

After adding: `git add`, `git commit -m "feat: add MCP tool <tool-name> for <purpose>"`, `git push`

### 5. Self-Review Checklist
Before finishing a train session, verify:
- [ ] All bug fixes in this session have corresponding lessons in SKILL.md
- [ ] Skills are renumbered correctly (no duplicates or gaps)
- [ ] `opencode.json` is updated if new MCP tools were added
- [ ] Changes are committed and pushed

## Design Principles
- **One source of truth**: Don't repeat the same lesson in multiple places
- **Actionable rules**: Each lesson must have a concrete "Rule" that prevents recurrence
- **Minimal surface**: Don't create a skill for a one-off topic — add to Critical Lessons first
- **Commit discipline**: Skill/tool changes are real code changes — commit with descriptive messages

## Examples
- See `.agents/skills/minspa/SKILL.md:28-78` for the Critical Lessons section structure
- See `opencode.json` for MCP tool configuration format

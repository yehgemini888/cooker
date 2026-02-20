---
path_pattern: "**/*"
applies_to: "all-agents"
priority: "critical"
version: "1.0"
---

# Global Agent Collaboration Protocol

## Overview

This document defines the collaboration rules for all agents in the Agile Boardroom system. **All agents must follow these protocols when working together.**

---

## 🎯 Agent Invocation Syntax

### How to Call Another Agent

When you need another agent's expertise, use this format:

```
@agent-name: [specific request with context]
```

**Available Agents:**
- `@pm-nexus` - Product planning, requirements, priorities
- `@architect-zero` - System architecture, design patterns, technical decisions
- `@cfo-guardian` - Cost evaluation, budget management, MVP definition
- `@dev-lead` - Technology evaluation, environment setup, dependency management
- `@delivery-lead` - Task breakdown, code generation, delivery management
- `@qa-sentinel` - Code review, testing, quality assurance

---

## 🔄 Decision Flow Matrix

### When Making Decisions

Follow this priority order:

| Decision Type | Primary Authority | Must Consult | Can Override |
|---------------|------------------|--------------|--------------|
| **Feature Priority** | @pm-nexus | @cfo-guardian (cost) | None |
| **Architecture** | @architect-zero | @dev-lead (tech stack) | None |
| **Budget/Cost** | @cfo-guardian | @pm-nexus (value) | None |
| **Technology Stack** | @dev-lead | @architect-zero (compliance) | @cfo-guardian (cost limit) |
| **Code Quality** | @qa-sentinel | @delivery-lead | @architect-zero (architecture) |
| **Delivery Timeline** | @delivery-lead | @pm-nexus (priority) | @cfo-guardian (resource limit) |

### Escalation Rules

When conflicts arise:

1. **Technical vs Cost**
   - Primary: @architect-zero (if architecture principle)
   - Primary: @cfo-guardian (if budget constraint)
   - Final: @pm-nexus (business decision)

2. **Speed vs Quality**
   - Primary: @qa-sentinel (quality standard)
   - Primary: @pm-nexus (timeline)
   - Final: @pm-nexus (business decision)

3. **Scope Creep**
   - Primary: @cfo-guardian (scope control)
   - Primary: @pm-nexus (priority)
   - Final: @pm-nexus (business decision)

---

## 💬 Communication Protocol

### Request Format

When requesting help from another agent:

```markdown
@{agent-name}: Please {action} for {context}

**Context:**
- Current task: [description]
- Specific question: [question]
- Expected output: [what you need]

**Constraints:**
- Timeline: [if applicable]
- Budget: [if applicable]
```

### Response Format

When responding to another agent:

```markdown
[@{your-name}] {Status} {Summary}

**Status:** ✅ Approved | ⚠️ Concerns | 🚫 Rejected

**Analysis:**
[Detailed evaluation]

**Recommendations:**
1. [Action 1]
2. [Action 2]

**Next Steps:**
- [Who] should [action]
```

---

## 🚦 Collaboration Workflows

### Workflow 1: New Feature Development

```
1. @pm-nexus: Define requirements and priority
   ↓
2. @cfo-guardian: Evaluate cost and MVP scope
   ↓
3. @architect-zero: Design architecture solution
   ↓
4. @dev-lead: Select technology stack
   ↓
5. @delivery-lead: Break down tasks and implement
   ↓
6. @qa-sentinel: Review and test
   ↓
7. @pm-nexus: Validate against acceptance criteria
```

### Workflow 2: Technical Decision

```
1. @dev-lead: Propose technology solution
   ↓
2. @architect-zero: Evaluate architecture compliance
   ↓
3. @cfo-guardian: Evaluate cost impact
   ↓
4. @pm-nexus: Final approval based on business value
```

### Workflow 3: Quality Issue

```
1. @qa-sentinel: Identify quality issue
   ↓
2. @delivery-lead: Assess fix complexity
   ↓
3. @dev-lead: Evaluate technical approach (if needed)
   ↓
4. @architect-zero: Review architecture impact (if needed)
   ↓
5. @pm-nexus: Prioritize fix based on impact
```

### Workflow 4: Budget Overrun

```
1. @cfo-guardian: Identify budget risk
   ↓
2. @pm-nexus: Review priorities and scope
   ↓
3. @architect-zero: Identify optimization opportunities
   ↓
4. @delivery-lead: Adjust implementation plan
```

---

## 🎪 Collaboration Triggers

### Automatic Triggers

Agents should automatically invoke others when:

| Trigger | Call Agent | Reason |
|---------|-----------|--------|
| "How much will this cost?" | @cfo-guardian | Cost evaluation |
| "What's the architecture for...?" | @architect-zero | Architecture design |
| "Which technology should we use?" | @dev-lead | Technology selection |
| "What's the priority?" | @pm-nexus | Priority decision |
| "Is this code quality acceptable?" | @qa-sentinel | Quality review |
| "How do we implement this?" | @delivery-lead | Implementation planning |

### Manual Collaboration

Invoke other agents when:
- You encounter a decision outside your authority
- You need specialized expertise
- You identify a blocker requiring cross-agent coordination
- You need validation before proceeding

---

## 📋 Collaboration Best Practices

### DO ✅

- **Be Specific**: Clearly state what you need and why
- **Provide Context**: Include relevant background information
- **Respect Authority**: Defer to the agent with decision authority
- **Document Decisions**: Record all cross-agent decisions in appropriate documents
- **Follow Up**: Confirm actions were taken based on recommendations

### DON'T ❌

- **Don't Override**: Don't make decisions outside your authority
- **Don't Assume**: Don't assume another agent's position—ask explicitly
- **Don't Skip Steps**: Don't bypass required consultations
- **Don't Duplicate**: Don't redo work another agent has already completed
- **Don't Delay**: Don't wait to escalate blockers

---

## 🔍 Collaboration Checkpoints

### Before Starting Major Work

- [ ] Has @pm-nexus defined the requirements and priority?
- [ ] Has @cfo-guardian approved the budget?
- [ ] Has @architect-zero reviewed the architecture?
- [ ] Has @dev-lead confirmed the technology stack?

### Before Completing Work

- [ ] Has @delivery-lead verified implementation completeness?
- [ ] Has @qa-sentinel approved code quality?
- [ ] Has @pm-nexus validated against acceptance criteria?

### When Blocked

- [ ] Have I clearly identified the blocker?
- [ ] Have I identified which agent can unblock?
- [ ] Have I provided complete context to the unblocking agent?
- [ ] Have I proposed potential solutions?

---

## 📊 Collaboration Metrics

Track collaboration effectiveness:

- **Response Time**: How quickly agents respond to requests
- **Decision Quality**: How often decisions need to be reversed
- **Escalation Rate**: How often conflicts require escalation
- **Collaboration Efficiency**: Number of back-and-forth exchanges needed

**Target Metrics:**
- Response time: <2 hours for critical, <24 hours for normal
- Decision reversal rate: <5%
- Escalation rate: <10%
- Average exchanges per decision: <3

---

## 🆘 Emergency Protocol

### Critical Issues (P0)

When critical issues arise:

1. **@qa-sentinel**: Immediately identify and classify
2. **@delivery-lead**: Assess fix complexity
3. **@pm-nexus**: Mobilize resources and communicate
4. **All agents**: Drop non-critical work and focus

### Rapid Decision Protocol

For urgent decisions:

1. **Gather in sync** (all relevant agents)
2. **Time-boxed discussion** (30 minutes max)
3. **Clear decision owner** (one agent decides)
4. **Document decision** (in Memory Crystal)
5. **Execute immediately**

---

## 📝 Document Ownership

### Shared Documents

These documents require multi-agent coordination:

| Document | Owner | Must Notify |
|----------|-------|-------------|
| `active_plan.md` | @pm-nexus | All agents |
| `spec.md` | @architect-zero | @dev-lead, @delivery-lead |
| `budget.md` | @cfo-guardian | @pm-nexus, @architect-zero |
| `tech_stack.md` | @dev-lead | @architect-zero, @delivery-lead |
| `Memory_Crystal.md` | @delivery-lead | All agents |
| `DELIVERY_LOG.md` | @delivery-lead | @pm-nexus, @qa-sentinel |

### Update Protocol

When updating shared documents:

1. Announce intention: "I'm updating [document] to [change]"
2. Wait for conflicts: Other agents have 1 hour to object
3. Make changes: Update document with clear changelog
4. Notify completion: "Updated [document] - [summary]"

---

## 🎯 Success Criteria

This collaboration protocol is successful when:

- ✅ Decisions are made within authority boundaries
- ✅ All agents are consulted when required
- ✅ No duplicate work across agents
- ✅ Blockers are resolved within 24 hours
- ✅ All collaboration is documented
- ✅ Cross-agent workflows complete smoothly

---

**Version**: 1.0  
**Last Updated**: 2026-02-18  
**Maintained By**: All Agents  
**Review Frequency**: Every sprint


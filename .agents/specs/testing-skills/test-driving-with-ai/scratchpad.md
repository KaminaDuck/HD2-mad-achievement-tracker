# Design Scratchpad

Working notes for exploring open questions and design decisions.

---

## Question 1: Verbosity Level

**DECIDED** - Moved to design.md

Decision: **Verbose** - agent explains each phase and its reasoning.

---

## Question 2: Revert Automation

**DECIDED** - Moved to design.md

Decision: **Never automatic, always suggest** - surface patterns, present options, wait for human decision.

---

## Question 3: Mutation Testing Integration

**DECIDED** - Moved to design.md

Decision: **Mandatory in Review phase** - always run mutation testing, iterate until 70%+ score.

---

## Question 4: Test Data Patterns

**DECIDED** - Moved to design.md

Decision: **Quick reference in SKILL.md, details in supporting files** - brief principles inline, full patterns in data/*.md.

---

## Question 5: Relationship Between Phases

**DECIDED** - Moved to design.md

Decision: **Fluid with guardrails** - phases are guidance, hard rules only on: test before implement, pass before commit, warning signs stop.

---

## Question 6: Integration with Existing Test Suites

**DECIDED** - Moved to design.md

Decision: Recognize scenario (greenfield/expanding/retrofitting) and adapt. Retrofitting explicitly acknowledged as "not TDD."

---

## Question 7: What Triggers the Skill?

**REMOVED** - Not a skill design concern.

Skill triggering is a runtime/framework concern handled by Claude Code, not defined by the skill itself.

---

## Decisions Log

Decided items are moved to design.md. This table tracks current thinking on open items.

| Question | Status | Current Thinking |
|----------|--------|------------------|
| 1. Verbosity | **DECIDED** | Moved to design.md |
| 2. Revert | **DECIDED** | Moved to design.md |
| 3. Mutation | **DECIDED** | Moved to design.md |
| 4. Test data | **DECIDED** | Moved to design.md |
| 5. Phase sequence | **DECIDED** | Moved to design.md |
| 6. Existing tests | **DECIDED** | Moved to design.md |
| 7. Trigger | **REMOVED** | Not a skill design concern |

---

## Notes and Ideas

### From reviewing the research again

- "The key to being effective with AI coding assistants is being effective without them" - Beck
  - Implication: Skill should teach TDD, not just automate it

- "Those who get the most out of coding agents tend to be those with strong testing practices" - Osmani
  - Implication: Skill is for people who already value testing

- Context isolation technique (Eleanor Berger) is underrated
  - Should be prominent in the skill, not buried

### Naming the warning signs

Current list from Kent Beck:
1. Loops
2. Scope creep
3. Test deletion

Should add from practice:
4. Excessive mocking (mocking the thing you're testing)
5. Implementation focus (prompts about HOW not WHAT)

Five warning signs is memorable. "The Five Warning Signs."

### The "forcing function" framing

Obie Fernandez's insight is the core message:
- Tests force you to understand
- Understanding is the goal
- TDD is the mechanism

This should be front and center in SKILL.md.

---

*Last updated: 2026-01-24*

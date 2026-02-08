# AI Slop Detection Guide

Use this checklist when reviewing AI-generated content before committing.

## Prohibited Words (2026 List)

These words appear disproportionately in LLM output. Flag any occurrence:

### Filler Adjectives
- essential, vital, crucial, robust, comprehensive
- vibrant, bustling, dynamic, cutting-edge
- meticulous, meticulously
- seamless, ultimate, game-changer

### Corporate Jargon
- utilize (use "use"), facilitate (use "help"), implement (use "start")
- leverage, synergy, optimize, streamline
- enhance, elevate, empower, enable
- navigate, foster, harness, unleash
- ensure (use "make sure"), moves the needle
- has you covered, we've got you covered

### Dramatic Transitions
- delve, embark, journey, dive into
- game changer, paradigm shift
- a testament to, underscores

### Hedging Phrases
- it's important to note, it's worth noting
- it's worth considering, you may want to
- this is not an exhaustive list
- as previously mentioned, that being said

### Vapid Openers
- in today's digital age, in today's fast-paced world
- as technology continues to evolve
- when it comes to, in the realm of

### Overused Nouns
- landscape, tapestry, realm, symphony
- complexities, nuances, intricacies
- labyrinth, crucible, metamorphosis

## Structural Patterns

### 1. Contrast Framing ("It's not X, it's Y")

**AI pattern:**
```
Marketing isn't about selling, it's about connecting.
Success isn't luck, it's preparation.
```

**Problem:** Humans don't speak in constant opposites. One or two is fine; seven in a document is AI.

**Fix:** State the positive directly. "Marketing works through connection." Or just delete.

### 2. Rule of Three/Four (Snappy Triads)

**AI pattern:**
```
Fast, efficient, and reliable.
Think bigger. Act bolder. Move faster.
Rules provide context. Skills provide workflows. Hooks provide enforcement.
```

**Problem:** AI learned this is "good writing" and applies it everywhere. Especially four parallel sentences in a row.

**Fix:** Vary the structure. Combine into one sentence. Or just pick the most important one.

### 3. Cringe Transition Questions

**AI pattern:**
```
The catch?
The kicker?
The brutal truth?
But here's the thing.
Something shifted.
Everything changed.
The truth is...
```

**Problem:** Infomercial language. "But wait, there's more!"

**Fix:** Delete. Just state the information.

### 3b. Mid-Sentence Questions

**AI pattern:**
```
But now? You won't be able to unsee this.
The solution? It's simpler than you think.
The result? A 40% improvement.
```

**Problem:** Cheap rhetorical trick that sounds like a sales pitch.

**Fix:** Just make it a statement. "The solution is simpler than you think."

### 4. Monotonous List Structure

**AI pattern:**
```
**Bold phrase**: explanation sentence.
**Bold phrase**: explanation sentence.
**Bold phrase**: explanation sentence.
**Bold phrase**: explanation sentence.
```

**Problem:** Every item follows identical format. Zero variation.

**Fix:** Mix formats. Some items as questions, some as warnings, some shorter, some with examples inline.

### 5. Present-ing Verbs

**AI pattern:**
```
...highlighting key benefits...
...emphasizing the importance...
...facilitating enhanced collaboration...
```

**Problem:** Sounds like a committee wrote it.

**Fix:** Use active verbs. "This highlights" → "This shows" or just cut it.

### 6. Vague Attribution

**AI pattern:**
```
Research suggests...
Studies have shown...
Experts agree...
```

**Problem:** Which research? Link it or it's weasel words.

**Fix:** Cite specifically or remove the claim.

### 7. Em Dash Overload

**Problem:** Before 2023, em dashes (—) in Reddit comments were rare. Now they're everywhere. AI loves them.

**Fix:** Use commas or split into two sentences. One em dash per page is plenty.

### 8. Everything Is Symbolic

**AI pattern:**
```
This represents a fundamental shift...
It stands as a testament to...
This reflects the deeper truth that...
```

**Problem:** Telling you what things "mean" rather than stating facts.

**Fix:** State what happened. Let readers draw conclusions.

### 9. Academic/Formal Headings

**AI pattern:**
```
## The Accessibility Tree Model
## The Integration Pattern
## Understanding X
## Why X Matters
## How to Use X
```

**Problem:** Overly formal, sounds like a textbook. Humans write more direct headings.

**Fix:** Drop "The" and simplify. "The Accessibility Tree Model" → "Accessibility Tree" or "How Snapshots Work".

### 10. Minimizing Language

**AI pattern:**
```
It isn't just XXX, it's YYY.
Not XXX, but YYY.
Writing that just works.
Quietly building an email list.
Content that actually converts.
```

**Problem:** These qualifiers ("just", "quietly", "actually") are filler that AI uses constantly.

**Fix:** Delete the qualifier. "Writing that works." "Building an email list."

### 11. The Triple (Short Sentence Burst)

**AI pattern:**
```
Logos blur together. Features get copied. Pricing changes. But tone of voice sticks.
Fast. Efficient. Reliable.
Think bigger. Act bolder. Move faster.
```

**Problem:** Three staccato sentences followed by a pivot. AI applies this everywhere.

**Fix:** Combine into one sentence or pick the most important point.

### 12. Uniform List Item Lengths

**AI pattern:**
```
- Complete quarterly report
- Analyze market trends
- Generate new solutions
```

**Problem:** Every item is exactly 3 words. Real humans vary line lengths randomly (3-7 words).

**Fix:** Vary the lengths naturally. Some items 2 words, some 6.

### 13. Generic Examples (Fake Case Studies)

**AI pattern:**
```
Sarah from Marketing increased her productivity by 40%.
A mid-sized company saw 3x growth after implementing this strategy.
```

**Problem:** Who is Sarah? Which company? AI invents plausible-sounding examples.

**Fix:** Use real examples with specifics, or remove the claim entirely.

### 14. Emoji-Led Bullets in Professional Contexts

**AI pattern:**
```
✅ Complete quarterly report
📊 Analyze market trends
💡 Generate innovative solutions
🚀 Launch new features
```

**Problem:** No professional writes work emails with emoji bullets. This is pure AI.

**Fix:** Use plain bullets or numbers.

### 15. Awkward/Generic Metaphors

**AI pattern:**
```
Learning the ukulele is like teaching your fingers to dance again.
Every chord is a puzzle piece that finally clicks into a song.
```

**Problem:** AI metaphors are plausible but generic. Not specific to personal experience or culturally resonant.

**Fix:** Use specific metaphors from real experience, or skip the metaphor entirely.

## Detection Checklist

Before committing AI-assisted content, check:

- [ ] Zero prohibited words from the list above
- [ ] Fewer than 2 contrast frames ("not X, Y") per page
- [ ] No parallel sentence structures of 3+ items (triads/triples)
- [ ] List items have varied formatting and lengths
- [ ] No hedging phrases ("it's worth noting")
- [ ] Specific attribution for any claims (no fake examples)
- [ ] At least one concrete example from real experience
- [ ] Sentence lengths vary (not all medium-length)
- [ ] Some personality or opinion shows through
- [ ] Headings are direct, not academic ("The X Model")
- [ ] No minimizing language ("just", "quietly", "actually")
- [ ] No emoji bullets in professional content
- [ ] Max 1 em dash per page

## Quick Grep Commands

```bash
# Check for prohibited words
rg -i "essential|crucial|vital|robust|comprehensive|delve|embark|journey|landscape|tapestry|realm|leverage|utilize|facilitate|harness|foster|enhance|elevate|navigate|seamless|game.changer" docs/

# Check for hedging phrases
rg -i "it's (important|worth) to|as previously mentioned|that being said|you may want to" docs/

# Check for contrast framing
rg "not .*, (it's|but)" docs/

# Count em dashes per file
rg -c "—" docs/

# Check for academic headings ("The X Model/Pattern")
rg "^##+ The \w+ (Model|Pattern|Framework|Approach)" docs/

# Check for minimizing language
rg -i "\bjust works\b|\bquietly\b|\bactually\b" docs/

# Check for cringe transitions
rg -i "the (catch|kicker|truth is)|but here's the thing|something shifted" docs/
```

## Sources

- [The Field Guide to AI Slop](https://www.ignorance.ai/p/the-field-guide-to-ai-slop) - Charlie Guo, Oct 2025
- [10 Dead Giveaways Your Content Screams "AI Wrote This"](https://writewithai.substack.com/p/10-dead-giveaways-your-content-screams) - Nicolas Cole, Sep 2025
- [How to Humanize ChatGPT Written Content](https://www.creativindie.com/how-to-humanize-chatgpt-written-content-for-better-fiction-and-to-pass-ai-detection/) - Derek Murphy, 2024
- [AI vs Human Writing—How To Tell?](https://empoweredenglish.org/ai-vs-human-writing-how-to-tell/) - Holly, Jan 2026
- [How to Write Long-Form Blogs with AI Without Sounding Like Slop](https://resources.opencraftai.com/blog/how-to-write-long-form-blogs-with-ai-without-sounding-like-slop-2026-guide/) - Narayanan, Jan 2026
- [Wikipedia:Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) - Wikipedia, ongoing

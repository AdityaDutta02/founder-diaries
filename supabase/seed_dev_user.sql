-- Dev admin user seed — Full 3-week test dataset
-- Run this in: Supabase Dashboard → SQL Editor
-- Login: admin@founderdiaries.dev / admin123
--
-- Contains: auth user, profile, 45 diary entries (3 weeks, 2-3/day),
-- 10 answered enrichment Q&As, pre-built persona, 12 generated posts,
-- platform configs, and activity log entries.

DO $$
DECLARE
  uid UUID := 'cdf9c39d-c8fd-44fe-86e6-6b7c4509b66b';
  -- Entry IDs (needed for foreign key refs in generated_posts)
  e01 UUID := 'e0000000-0000-0000-0000-000000000001';
  e02 UUID := 'e0000000-0000-0000-0000-000000000002';
  e03 UUID := 'e0000000-0000-0000-0000-000000000003';
  e04 UUID := 'e0000000-0000-0000-0000-000000000004';
  e05 UUID := 'e0000000-0000-0000-0000-000000000005';
  e06 UUID := 'e0000000-0000-0000-0000-000000000006';
  e07 UUID := 'e0000000-0000-0000-0000-000000000007';
  e08 UUID := 'e0000000-0000-0000-0000-000000000008';
  e09 UUID := 'e0000000-0000-0000-0000-000000000009';
  e10 UUID := 'e0000000-0000-0000-0000-000000000010';
  e11 UUID := 'e0000000-0000-0000-0000-000000000011';
  e12 UUID := 'e0000000-0000-0000-0000-000000000012';
  e13 UUID := 'e0000000-0000-0000-0000-000000000013';
  e14 UUID := 'e0000000-0000-0000-0000-000000000014';
  e15 UUID := 'e0000000-0000-0000-0000-000000000015';
  e16 UUID := 'e0000000-0000-0000-0000-000000000016';
  e17 UUID := 'e0000000-0000-0000-0000-000000000017';
  e18 UUID := 'e0000000-0000-0000-0000-000000000018';
  e19 UUID := 'e0000000-0000-0000-0000-000000000019';
  e20 UUID := 'e0000000-0000-0000-0000-000000000020';
  e21 UUID := 'e0000000-0000-0000-0000-000000000021';
  e22 UUID := 'e0000000-0000-0000-0000-000000000022';
  e23 UUID := 'e0000000-0000-0000-0000-000000000023';
  e24 UUID := 'e0000000-0000-0000-0000-000000000024';
  e25 UUID := 'e0000000-0000-0000-0000-000000000025';
  e26 UUID := 'e0000000-0000-0000-0000-000000000026';
  e27 UUID := 'e0000000-0000-0000-0000-000000000027';
  e28 UUID := 'e0000000-0000-0000-0000-000000000028';
  e29 UUID := 'e0000000-0000-0000-0000-000000000029';
  e30 UUID := 'e0000000-0000-0000-0000-000000000030';
  e31 UUID := 'e0000000-0000-0000-0000-000000000031';
  e32 UUID := 'e0000000-0000-0000-0000-000000000032';
  e33 UUID := 'e0000000-0000-0000-0000-000000000033';
  e34 UUID := 'e0000000-0000-0000-0000-000000000034';
  e35 UUID := 'e0000000-0000-0000-0000-000000000035';
  e36 UUID := 'e0000000-0000-0000-0000-000000000036';
  e37 UUID := 'e0000000-0000-0000-0000-000000000037';
  e38 UUID := 'e0000000-0000-0000-0000-000000000038';
  e39 UUID := 'e0000000-0000-0000-0000-000000000039';
  e40 UUID := 'e0000000-0000-0000-0000-000000000040';
  e41 UUID := 'e0000000-0000-0000-0000-000000000041';
  e42 UUID := 'e0000000-0000-0000-0000-000000000042';
  e43 UUID := 'e0000000-0000-0000-0000-000000000043';
  e44 UUID := 'e0000000-0000-0000-0000-000000000044';
  e45 UUID := 'e0000000-0000-0000-0000-000000000045';
BEGIN

-- ═══════════════════════════════════════════════════════════
-- 1. PROFILE (auth user already exists)
-- ═══════════════════════════════════════════════════════════

INSERT INTO profiles (
  id, email, full_name, industry, niche_keywords,
  onboarding_completed, discovery_unlocked, diary_start_date, timezone
) VALUES (
  uid, 'admin@founderdiaries.dev', 'Aditya', 'SaaS',
  ARRAY['bootstrapped', 'indie hacker', 'AI tools', 'building in public'],
  true, true, NOW() - INTERVAL '21 days', 'Asia/Kolkata'
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  industry = EXCLUDED.industry,
  niche_keywords = EXCLUDED.niche_keywords,
  onboarding_completed = true,
  discovery_unlocked = true,
  diary_start_date = EXCLUDED.diary_start_date,
  timezone = EXCLUDED.timezone;

-- ═══════════════════════════════════════════════════════════
-- 2. DIARY ENTRIES — 3 weeks, 2-3 per day (45 entries)
-- ═══════════════════════════════════════════════════════════

-- Clean existing entries for idempotent re-runs
DELETE FROM diary_entries WHERE user_id = uid;

-- Week 1: The beginning — excitement, first users, learning
INSERT INTO diary_entries (id, user_id, entry_date, text_content, mood, local_id, created_at) VALUES

-- Day 1 (Mon)
(e01, uid, CURRENT_DATE - 20, 'Just shipped the landing page for Founder Diaries. Feels surreal to see it live. The copy is rough but the core idea is there — founders journal daily, AI turns it into content. Spent 14 hours yesterday on the onboarding flow. My eyes hurt but I can''t stop tweaking.', 'energized', 'local-001', (CURRENT_DATE - 20) + TIME '09:15:00'),
(e02, uid, CURRENT_DATE - 20, 'Had a call with Raj from YC batch. He said the idea reminds him of what he wished existed when he was doing his solo founder grind. That validation hit different. He offered to be a beta tester. Small win but I''ll take it.', 'productive', 'local-002', (CURRENT_DATE - 20) + TIME '18:30:00'),

-- Day 2 (Tue)
(e03, uid, CURRENT_DATE - 19, 'First bug report from Raj: the audio recorder crashes on Android when switching apps mid-recording. Classic. Spent 3 hours debugging expo-av permissions. The fix was one line — forgot to request foreground service permission. Lesson: always test on real devices, not just simulators.', 'frustrated', 'local-003', (CURRENT_DATE - 19) + TIME '10:00:00'),
(e04, uid, CURRENT_DATE - 19, 'Thinking about pricing. Every SaaS founder I follow says "charge more" but my gut says free tier first, prove the value, then monetize. The AI costs are real though — each content generation is about 2 cents. At scale that adds up. Need to think about this more.', 'neutral', 'local-004', (CURRENT_DATE - 19) + TIME '21:45:00'),

-- Day 3 (Wed)
(e05, uid, CURRENT_DATE - 18, 'Woke up to 3 signups overnight from the Product Hunt "upcoming" listing. No marketing, just organic. One of them is a founder building an EdTech startup in Bangalore. She sent a DM saying "finally something that doesn''t feel like another content calendar." That made my whole week.', 'energized', 'local-005', (CURRENT_DATE - 18) + TIME '07:30:00'),
(e06, uid, CURRENT_DATE - 18, 'Deep work session on the persona builder. The idea is that after 7 days of journaling, the AI should know your voice well enough to write posts that sound like you, not like ChatGPT. Wrote the confidence scoring system — starts at 0, reaches 0.8 after 50 entries. It''s like training a model on yourself.', 'productive', 'local-006', (CURRENT_DATE - 18) + TIME '14:00:00'),
(e07, uid, CURRENT_DATE - 18, 'Late night reflection: I keep thinking about why I''m building this. It''s not just about content. It''s about giving founders a space to think out loud, and then turning that thinking into something useful. The diary IS the product. The content is a side effect.', 'neutral', 'local-007', (CURRENT_DATE - 18) + TIME '23:15:00'),

-- Day 4 (Thu)
(e08, uid, CURRENT_DATE - 17, 'Implemented the enrichment question system today. Instead of a boring onboarding form, the app asks one meaningful question per day — "What problem were you trying to solve when you started?" "Who''s a mentor that shaped how you work?" It builds the persona gradually. Way more natural than a 20-field form.', 'productive', 'local-008', (CURRENT_DATE - 17) + TIME '11:30:00'),
(e09, uid, CURRENT_DATE - 17, 'Had coffee with Meera who runs a D2C brand. She said she spends 4 hours a week on LinkedIn content and hates every minute of it. "I know what I want to say, I just can''t find the words." That''s exactly the problem. She signed up on the spot.', 'energized', 'local-009', (CURRENT_DATE - 17) + TIME '16:00:00'),

-- Day 5 (Fri)
(e10, uid, CURRENT_DATE - 16, 'Discovery tab is working! After 7 days of journaling, the app scrapes top creators in your niche and builds writing profiles from their content. It''s like having a content strategist who studied the best in your space. The LinkedIn profile analysis is surprisingly good — it picks up hook patterns and CTA styles.', 'energized', 'local-010', (CURRENT_DATE - 16) + TIME '10:00:00'),
(e11, uid, CURRENT_DATE - 16, 'Friday evening brain dump: I need to figure out the content queue. Right now posts are generated but there''s no way to schedule them or reorder. The drag-to-reorder UX needs to feel smooth. Looking at react-native-draggable-flatlist but worried about performance with 20+ cards.', 'neutral', 'local-011', (CURRENT_DATE - 16) + TIME '19:30:00'),

-- Day 6 (Sat)
(e12, uid, CURRENT_DATE - 15, 'Weekend build day. Rebuilt the audio recorder from scratch. It now shows a live waveform that actually looks good — 28 bars animating with staggered timing. The half-sheet modal pattern works beautifully. Small detail but it makes the recording experience feel premium.', 'productive', 'local-012', (CURRENT_DATE - 15) + TIME '12:00:00'),
(e13, uid, CURRENT_DATE - 15, 'My partner asked me what I''d do if this fails. Honestly? I''d go back to freelancing and try again with the next idea. But I don''t think this will fail. The problem is real. Every founder I talk to has the same pain — they know their story matters but they can''t find the time or energy to tell it.', 'neutral', 'local-013', (CURRENT_DATE - 15) + TIME '22:00:00'),

-- Day 7 (Sun)
(e14, uid, CURRENT_DATE - 14, 'First full week done. 8 beta users, 3 of whom journal daily. The persona confidence scores are climbing — Raj''s hit 0.45 already. His generated LinkedIn posts actually sound like him. He texted "wait, did I write this?" — best compliment possible.', 'energized', 'local-014', (CURRENT_DATE - 14) + TIME '10:30:00'),

-- Week 2: Growth pains — feedback, pivots, real users
-- Day 8 (Mon)
(e15, uid, CURRENT_DATE - 13, 'Monday standup with myself: This week I need to nail the content editing flow. Users can generate posts but they can''t easily edit them. The inline TextInput approach feels right — no separate modal, just tap and type. Orange border on focus, character count, hashtag chips that you can tap to remove.', 'productive', 'local-015', (CURRENT_DATE - 13) + TIME '08:00:00'),
(e16, uid, CURRENT_DATE - 13, 'Got harsh feedback from the EdTech founder. She said the generated Instagram captions sound "too LinkedIn-y" even when she selects Instagram. She''s right — the prompts weren''t platform-aware enough. I need to make the reel caption builder much more casual and include concept descriptions for the visual side.', 'stressed', 'local-016', (CURRENT_DATE - 13) + TIME '15:30:00'),

-- Day 9 (Tue)
(e17, uid, CURRENT_DATE - 12, 'Spent the morning rewriting all 5 prompt builders. Each platform now has its own personality: LinkedIn is story-driven with hooks, X is punchy and conversational, Instagram is visual-first with shorter captions. The carousel builder creates 5-7 value-driven slides instead of just dumping text onto images.', 'productive', 'local-017', (CURRENT_DATE - 12) + TIME '11:00:00'),
(e18, uid, CURRENT_DATE - 12, 'Interesting realization: the best diary entries for content generation aren''t the long rambling ones. They''re the ones where founders express a specific emotion about a specific moment. "I was terrified before the investor call but said yes anyway" generates way better content than "had a busy week with lots of meetings."', 'neutral', 'local-018', (CURRENT_DATE - 12) + TIME '20:00:00'),

-- Day 10 (Wed)
(e19, uid, CURRENT_DATE - 11, 'Server costs update: running 5 Supabase edge functions, Claude API for content gen (~$0.01/post), Groq for transcription (free tier), OpenRouter for routing. Total spend this month: $23. Not bad for an AI-powered app. The persona builder is the most expensive call because it processes up to 100 entries.', 'neutral', 'local-019', (CURRENT_DATE - 11) + TIME '09:30:00'),
(e20, uid, CURRENT_DATE - 11, 'Meera just posted her first AI-generated LinkedIn post. 47 likes in 2 hours. Her previous best was 12. She called me screaming "IT WORKS." I''m grinning like an idiot. This is why I build things.', 'energized', 'local-020', (CURRENT_DATE - 11) + TIME '17:00:00'),
(e21, uid, CURRENT_DATE - 11, 'Late night thought: I should add a "based on your diary entry from [date]" link on each generated post. So users can trace back to what inspired the content. It creates a feedback loop — journal more, get better content, see the connection.', 'productive', 'local-021', (CURRENT_DATE - 11) + TIME '23:30:00'),

-- Day 11 (Thu)
(e22, uid, CURRENT_DATE - 10, 'Theme system is finally solid. Dual-mode light/dark, Space Grotesk font throughout, warm earth tones with orange accent. The floating pill tab bar with unicode glyphs looks clean. I ran the accessibility audit — all interactive elements have proper labels and meet 44pt touch targets.', 'productive', 'local-022', (CURRENT_DATE - 10) + TIME '10:00:00'),
(e23, uid, CURRENT_DATE - 10, 'Ran into a gnarly bug: the diary sync was failing silently for users with more than 50 entries because the Supabase upsert was timing out. Fixed by batching syncs in groups of 20. Also added a fire-and-forget embedding step — after sync, we compute vectors for any un-embedded entries. RAG retrieval at generation time.', 'frustrated', 'local-023', (CURRENT_DATE - 10) + TIME '16:30:00'),

-- Day 12 (Fri)
(e24, uid, CURRENT_DATE - 9, 'Shipped the settings redesign. Now organized by: Platforms, Profile (with Industry & Niche), Preferences, Data, and a proper Sign Out + Delete Account flow. The old settings page was a flat list of random rows. This one actually has sections that make sense.', 'productive', 'local-024', (CURRENT_DATE - 9) + TIME '12:00:00'),
(e25, uid, CURRENT_DATE - 9, 'Friday reflection: 2 weeks in, 15 users, 3 paying (donated, technically — I haven''t set up billing yet). The retention is what excites me. 60% daily active rate among the beta group. They''re actually journaling every day. The content is the hook but the diary is the habit.', 'energized', 'local-025', (CURRENT_DATE - 9) + TIME '20:00:00'),

-- Day 13 (Sat)
(e26, uid, CURRENT_DATE - 8, 'Building the content queue today. It''s a scrollable calendar-week view at the top showing which days have approved posts, then a vertical list below. You can drag to reorder and swipe to remove. The approved post cards show platform badge, content type icon, and a text preview.', 'productive', 'local-026', (CURRENT_DATE - 8) + TIME '11:00:00'),

-- Day 14 (Sun)
(e27, uid, CURRENT_DATE - 7, 'Two weeks complete. Had a moment of doubt this morning — am I building something people actually need, or am I just solving my own problem? Then I looked at the numbers: users who journal 3+ times a week generate 2x better content (measured by their own approval rate). The data says it works.', 'neutral', 'local-027', (CURRENT_DATE - 7) + TIME '09:00:00'),
(e28, uid, CURRENT_DATE - 7, 'Recorded an audio entry today while walking. The Whisper transcription is impressively accurate even with street noise. The half-sheet recorder UI with the waveform visualization makes it feel like a real recording studio. Users tell me they prefer audio for morning entries and text for evening reflections.', 'energized', 'local-028', (CURRENT_DATE - 7) + TIME '18:00:00'),

-- Week 3: Momentum — features, scaling, first revenue conversations
-- Day 15 (Mon)
(e29, uid, CURRENT_DATE - 6, 'Started the week by fixing the empty states. The first-time diary view now says "Your story starts here" with a warm illustration. The content tab pre-discovery shows a progress bar counting up to 7 entries. Small touches but they reduce the "blank screen panic" for new users.', 'productive', 'local-029', (CURRENT_DATE - 6) + TIME '08:30:00'),
(e30, uid, CURRENT_DATE - 6, 'Got an email from a VC firm''s content manager asking if Founder Diaries works for "personal brands of investors." I said yes but internally I''m thinking — this is a completely different use case. Investors don''t journal about building, they journal about deal flow and market trends. Need to think about whether to expand scope or stay focused.', 'neutral', 'local-030', (CURRENT_DATE - 6) + TIME '14:00:00'),
(e31, uid, CURRENT_DATE - 6, 'Evening decision: staying focused on founders. The investor content use case is interesting but would require completely different prompt builders, different enrichment questions, different writing profiles. Focus wins. Maybe V2.', 'productive', 'local-031', (CURRENT_DATE - 6) + TIME '21:00:00'),

-- Day 16 (Tue)
(e32, uid, CURRENT_DATE - 5, 'Implemented the Writing Profiles tab in Discovery. Each platform gets its own card showing tone, hook style, typical length, and 3 example hooks extracted from top creators. The always-expanded card layout works better than the collapsible one — users want to see everything at a glance.', 'productive', 'local-032', (CURRENT_DATE - 5) + TIME '10:30:00'),
(e33, uid, CURRENT_DATE - 5, 'Something unexpected: Raj started using the enrichment questions as journaling prompts. Instead of just answering "What was your biggest failure?", he writes 500-word responses. His persona confidence hit 0.82 — the highest of any beta user. And his generated content is noticeably better than everyone else''s.', 'energized', 'local-033', (CURRENT_DATE - 5) + TIME '19:00:00'),

-- Day 17 (Wed)
(e34, uid, CURRENT_DATE - 4, 'The RAG system is working in production. Instead of pulling the last 3 diary entries chronologically, it now embeds the current entry and finds the 5 most semantically similar past entries. A post about hiring challenges pulls in earlier entries about team culture and management struggles. The context is actually relevant now.', 'energized', 'local-034', (CURRENT_DATE - 4) + TIME '09:00:00'),
(e35, uid, CURRENT_DATE - 4, 'Debugging session: one user''s generated X threads were all single tweets because the thread builder wasn''t handling the tool response correctly. The JSON parse was failing silently and falling back to single post mode. Added proper error boundaries and logging. Should have caught this earlier.', 'frustrated', 'local-035', (CURRENT_DATE - 4) + TIME '15:00:00'),
(e36, uid, CURRENT_DATE - 4, 'Three enrichment questions answered today. They asked about my morning routine, my relationship with exercise, and what music I listen to when I focus. Interesting how the system surfaces lifestyle questions after weeks of professional ones — it''s balancing the categories automatically.', 'neutral', 'local-036', (CURRENT_DATE - 4) + TIME '22:00:00'),

-- Day 18 (Thu)
(e37, uid, CURRENT_DATE - 3, 'Big realization about the product: the diary entries themselves are becoming more thoughtful over time. Week 1 entries were surface-level "shipped this, fixed that." Week 3 entries have depth — founders are reflecting on WHY they made decisions, not just WHAT they did. The app is changing their behavior.', 'energized', 'local-037', (CURRENT_DATE - 3) + TIME '10:00:00'),
(e38, uid, CURRENT_DATE - 3, 'Pricing model crystallizing: Free tier (3 entries/week, 1 platform, basic content), Pro at $12/month (unlimited entries, all platforms, RAG retrieval, priority generation). The AI cost per Pro user is about $3/month at current usage patterns. 75% gross margin. Not bad.', 'productive', 'local-038', (CURRENT_DATE - 3) + TIME '16:00:00'),

-- Day 19 (Fri)
(e39, uid, CURRENT_DATE - 2, 'Shipped the Post Detail screen with inline editing. The TextInput is always there — just tap and type. Orange border when focused, character count shows "847 / 3,000" for LinkedIn, red when over limit. Hashtag chips below the text, tappable to remove. Source reference row shows which diary entry inspired the post.', 'productive', 'local-039', (CURRENT_DATE - 2) + TIME '11:00:00'),
(e40, uid, CURRENT_DATE - 2, 'Got a cold DM on LinkedIn from someone asking "how did you write that post about founder loneliness?" It was a generated post from a diary entry about working alone on weekends. They thought I spent hours on it. I spent 2 minutes journaling and 10 seconds approving the AI draft. This is the proof of concept.', 'energized', 'local-040', (CURRENT_DATE - 2) + TIME '18:30:00'),

-- Day 20 (Sat)
(e41, uid, CURRENT_DATE - 1, 'Saturday deep work: rewrote the PostActionBar to have Reject, Regenerate, and Approve buttons. The old Edit button was confusing — editing and regenerating are different things. Regenerate calls the AI again with the same diary entry. Edit lets you tweak the text manually. Clear distinction now.', 'productive', 'local-041', (CURRENT_DATE - 1) + TIME '12:00:00'),
(e42, uid, CURRENT_DATE - 1, 'Thinking about distribution. Building in public on X has been my main channel. 340 followers, 12% engagement rate. The irony is that I''m using Founder Diaries to generate the content about building Founder Diaries. Dogfooding at its finest.', 'neutral', 'local-042', (CURRENT_DATE - 1) + TIME '20:00:00'),

-- Day 21 (Sun — today)
(e43, uid, CURRENT_DATE, 'Three weeks in. 22 beta users, 8 daily actives, 1 user hit 50 diary entries. The persona builder is getting scarily accurate — it picked up that I use parenthetical asides and em dashes in my writing. (Yes, like this.) My generated posts have the same rhythm as my journal entries.', 'energized', 'local-043', CURRENT_DATE + TIME '08:00:00'),
(e44, uid, CURRENT_DATE, 'This week I need to: 1) Set up Stripe billing, 2) Build the export-to-PDF feature, 3) Fix the offline sync indicator, 4) Ship the notification system for "content ready" alerts. Ambitious but doable if I stay focused.', 'productive', 'local-044', CURRENT_DATE + TIME '12:00:00'),
(e45, uid, CURRENT_DATE, 'End of week 3 reflection: I''m not building a content tool. I''m building a thinking tool that happens to produce content. The diary forces founders to process their day. The AI turns that processing into something shareable. The content is the output, but the reflection is the value.', 'neutral', 'local-045', CURRENT_DATE + TIME '21:00:00');

-- ═══════════════════════════════════════════════════════════
-- 3. ENRICHMENT Q&A — 10 answered questions
-- ═══════════════════════════════════════════════════════════

DELETE FROM persona_enrichment_answers WHERE user_id = uid;

INSERT INTO persona_enrichment_answers (user_id, question, question_category, answer, is_answered, asked_at, answered_at) VALUES
(uid, 'What''s the company or project you''re most proud of building?', 'professional',
 'Founder Diaries — it''s the first thing I''ve built that solves a problem I feel every day. Before this I built freelance tools that worked but didn''t excite me. This one keeps me up at night in a good way.',
 true, CURRENT_DATE - 19, CURRENT_DATE - 19),

(uid, 'What problem were you trying to solve when you started your current venture?', 'professional',
 'Founders have incredible stories but no time or energy to tell them. They know LinkedIn and X matter for their brand but content creation feels like a chore. I wanted to make it effortless — just talk about your day, and the AI handles the rest.',
 true, CURRENT_DATE - 17, CURRENT_DATE - 17),

(uid, 'What''s your morning routine when things are going well?', 'personal',
 'Wake up at 6:30, no phone for 30 minutes. Black coffee, 10 minutes of reading (usually a founder memoir or technical blog). Then I open the app and record a quick audio entry about what I want to accomplish today. Coding starts at 7:30.',
 true, CURRENT_DATE - 15, CURRENT_DATE - 15),

(uid, 'Who''s a mentor or role model who shaped how you work?', 'professional',
 'DHH and Jason Fried at Basecamp. Not personally — through their books and writing. The idea that you can build a profitable, sustainable company without VC funding, without burning out, without sacrificing your life. Shape Up changed how I think about product development.',
 true, CURRENT_DATE - 13, CURRENT_DATE - 13),

(uid, 'What does ''doing good work'' mean to you?', 'values',
 'Shipping something that someone actually uses and talks about without being asked. Not perfect code. Not clever architecture. Just... does this thing make someone''s day a little better? If yes, it''s good work.',
 true, CURRENT_DATE - 11, CURRENT_DATE - 11),

(uid, 'What''s something you refuse to compromise on?', 'values',
 'User privacy. I will never sell diary data or use it for training models outside the user''s own persona. These are people''s raw thoughts. That trust is sacred. I''d rather shut down than monetize their vulnerability.',
 true, CURRENT_DATE - 9, CURRENT_DATE - 9),

(uid, 'What''s the moment you decided to go all in on what you''re doing?', 'story',
 'I was freelancing, building someone else''s product, and realized I was journaling about ideas I''d never build. One morning I read back 6 months of journal entries and thought "there are 3 startups in here and I haven''t started any of them." I quit freelancing that week.',
 true, CURRENT_DATE - 7, CURRENT_DATE - 7),

(uid, 'What''s a book or podcast that changed how you think?', 'personal',
 'Company of One by Paul Jarvis. It reframed success for me. Growth isn''t always the answer. Sometimes the best business is one that stays small, stays profitable, and gives you the life you want.',
 true, CURRENT_DATE - 5, CURRENT_DATE - 5),

(uid, 'Are you more of a morning person or night owl?', 'lifestyle',
 'Morning person, aggressively so. My best code happens between 7-11am. After lunch I''m useless for deep work — that''s when I do calls, emails, and admin. Second wind around 9pm for writing and planning.',
 true, CURRENT_DATE - 3, CURRENT_DATE - 3),

(uid, 'What music do you listen to when you need to focus?', 'lifestyle',
 'Lo-fi hip hop or Nils Frahm''s piano albums. Anything without lyrics. Sometimes I''ll put on brown noise if I really need to lock in. Music with words pulls me out of the flow state.',
 true, CURRENT_DATE - 1, CURRENT_DATE - 1);

-- ═══════════════════════════════════════════════════════════
-- 4. USER PERSONA — Pre-built from the 45 entries + 10 Q&As
-- ═══════════════════════════════════════════════════════════

DELETE FROM user_persona WHERE user_id = uid;

INSERT INTO user_persona (
  user_id, company_name, job_title, years_experience,
  personality_traits, communication_style, writing_tone,
  interests, hobbies, values, life_context,
  founder_story, biggest_challenges, proudest_wins,
  content_themes, emotional_range, audience_connection_style,
  confidence_score, last_analyzed_at, entry_count_at_last_analysis
) VALUES (
  uid, 'Founder Diaries', 'Founder & Solo Developer', 4,
  '["analytical", "reflective", "determined", "self-aware", "pragmatic", "empathetic"]',
  'conversational', 'vulnerable',
  '["bootstrapping", "AI product development", "indie hacking", "building in public", "content creation", "personal branding"]',
  '["reading founder memoirs", "morning coffee rituals", "lo-fi music", "walking while thinking"]',
  '["user privacy", "sustainable growth", "shipping over perfection", "founder authenticity"]',
  '{"location": "India", "timezone": "Asia/Kolkata", "work_style": "solo founder, remote", "morning_person": true, "partner": "supportive"}',
  'Aditya is a solo founder building Founder Diaries, an AI-powered app that turns daily founder journals into platform-ready content. After years of freelancing and journaling about startup ideas he never pursued, he quit to build the tool he wished existed — a space where founders think out loud and the AI handles the rest. He believes the best content comes from genuine reflection, not content calendars, and has bet his career on that thesis.',
  '["solo founder isolation", "balancing speed with quality", "AI cost management at scale", "staying focused vs expanding scope", "platform-specific content quality"]',
  '["first beta user saying generated content sounded like them", "60% daily active retention in beta", "building a working RAG system for context retrieval", "shipping a complete app in 3 weeks"]',
  '["building in public", "founder reflections", "AI-assisted creativity", "bootstrapping journey", "product craft", "solo founder life"]',
  'Aditya cycles between focused determination during build sprints and reflective vulnerability during evening journal entries. He is openly honest about doubts and failures, which gives his writing an authentic, relatable quality.',
  'Through vulnerability and specific storytelling — he shares the exact moment, the exact emotion, the exact lesson. He avoids generic advice and instead shows the messy reality of building something from nothing.',
  0.78, NOW(), 45
);

-- ═══════════════════════════════════════════════════════════
-- 5. PLATFORM CONFIGS
-- ═══════════════════════════════════════════════════════════

DELETE FROM platform_configs WHERE user_id = uid;

INSERT INTO platform_configs (user_id, platform, active, weekly_post_quota, preferred_content_types) VALUES
(uid, 'linkedin', true, 5, ARRAY['post', 'carousel']),
(uid, 'x', true, 7, ARRAY['post', 'thread']);

-- ═══════════════════════════════════════════════════════════
-- 5b. CREATOR PROFILES — sample creators for Discover tab
-- ═══════════════════════════════════════════════════════════

DELETE FROM creator_profiles WHERE user_id = uid;

INSERT INTO creator_profiles (user_id, platform, creator_handle, creator_name, follower_count, bio, relevance_score) VALUES
-- LinkedIn
(uid, 'linkedin', 'justinwelsh', 'Justin Welsh', 750000, 'Solo entrepreneur. Built a $5M/year one-person business. Write about systems, leverage, and solopreneurship.', 0.92),
(uid, 'linkedin', 'sahilbloom', 'Sahil Bloom', 1200000, 'Exploring curiosity. Writing about decision-making, frameworks, and the human side of business.', 0.88),
(uid, 'linkedin', 'jaaborisov', 'Jasmin Alic', 420000, 'LinkedIn ghostwriter turned personal branding expert. Teaching founders how to tell better stories.', 0.85),
-- X
(uid, 'x', 'levelsio', 'Pieter Levels', 530000, 'Building 12 startups in 12 months. Nomad. Bootstrapper. Maker.', 0.95),
(uid, 'x', 'marc_louvion', 'Marc Lou', 180000, 'Shipped 7 profitable products. Building in public. SaaS and indie hacking.', 0.90),
(uid, 'x', 'dannypostmaa', 'Danny Postma', 120000, 'Indie maker. Built Headshot Pro to $1M ARR. AI tools and bootstrapping.', 0.88);

-- ═══════════════════════════════════════════════════════════
-- 5c. WRITING PROFILES — for Your Voice tab
-- ═══════════════════════════════════════════════════════════

DELETE FROM content_writing_profiles WHERE user_id = uid;

INSERT INTO content_writing_profiles (user_id, platform, tone_description, vocabulary_notes, format_patterns, structural_patterns, example_hooks, hashtag_strategy, generated_by_model, last_refreshed) VALUES
(uid, 'linkedin',
 'Conversational and reflective. Mixes vulnerability with practical insight. Uses short paragraphs and strategic line breaks for readability. Avoids corporate jargon.',
 'Frequently uses: "here''s the thing", "honestly", parenthetical asides (like this), em dashes. Prefers "shipped" over "launched", "built" over "developed". Writes in first person.',
 '{"openingStyle": "Hook question or bold statement", "paragraphLength": "2-3 sentences max", "useOfLists": "Arrow-prefixed lists (→) for key points", "lineBreaks": "Double line break between sections", "closingStyle": "Reflective one-liner + hashtags"}',
 '{"hookTypes": ["contrarian take", "vulnerable admission", "specific metric + surprise"], "bodyStructure": "hook → context → insight → reflection", "ctaPatterns": ["What''s your take?", "Have you experienced this?", "Drop your thoughts below"], "contentRatio": "60% story, 30% insight, 10% CTA"}',
 ARRAY['My partner asked me what I''d do if this fails.', 'Every SaaS founder says "charge more." But what if your users can''t afford it yet?', 'She called me screaming "IT WORKS." Here''s what happened.'],
 '{"averageCount": 4, "broadToNicheRatio": "60/40", "placement": "end of post", "exampleHashtags": ["#buildinginpublic", "#founderstory", "#startuplife", "#indiehacker", "#saas"]}',
 'anthropic/claude-sonnet-4', NOW()),

(uid, 'x',
 'Punchy and direct. Uses short declarative sentences. Mixes founder wisdom with specific numbers and examples. Conversational but not sloppy.',
 'Prefers short words: "ship" not "deliver", "build" not "construct". Uses colons and em dashes. Avoids hashtags in tweets (uses them sparingly in threads). Numbers always specific, never rounded.',
 '{"openingStyle": "Bold claim or specific number", "paragraphLength": "1-2 sentences", "useOfLists": "Rarely in single tweets, numbered in threads", "lineBreaks": "One line break between thoughts", "closingStyle": "Mic-drop one-liner"}',
 '{"hookTypes": ["specific metric", "contrarian opinion", "mini-story opener"], "bodyStructure": "claim → proof → punchline", "ctaPatterns": ["rarely used — lets content speak"], "contentRatio": "80% insight, 20% story"}',
 ARRAY['Someone DMed me asking "how did you write that post about founder loneliness?" It was AI-generated from a 2-minute diary entry.', 'Shipped semantic retrieval. Context that actually matters > chronological filler.', '2 weeks. 15 users. 60% daily active. The diary IS the engine.'],
 '{"averageCount": 0, "broadToNicheRatio": "N/A", "placement": "none", "exampleHashtags": []}',
 'anthropic/claude-sonnet-4', NOW());

-- ═══════════════════════════════════════════════════════════
-- 6. GENERATED POSTS — 12 posts across platforms
-- ═══════════════════════════════════════════════════════════

DELETE FROM generated_posts WHERE user_id = uid;

INSERT INTO generated_posts (user_id, diary_entry_id, platform, content_type, title, body_text, status, generation_metadata, created_at) VALUES

-- LinkedIn posts
(uid, e13, 'linkedin', 'post', 'The Question That Changed Everything',
'My partner asked me what I''d do if this fails.

I didn''t hesitate: "Go back to freelancing and try again."

But here''s what I didn''t say out loud — I don''t think this will fail. Not because I''m naive, but because the problem is too real.

Every founder I talk to has the same pain:
→ They know their story matters
→ They know LinkedIn and X matter for their brand
→ But content creation feels like a chore

So they don''t do it. Or they do it badly. Or they outsource it and it sounds generic.

What if you could just... talk about your day? And the AI turns that into content that actually sounds like you?

That''s what I''m building.

The diary IS the product. The content is a side effect.

#buildinginpublic #founderstory #startuplife #indiehacker #saas',
'draft',
'{"model": "anthropic/claude-sonnet-4", "tool": "create_linkedin_post", "generatedAt": "2026-03-16T22:30:00Z"}',
CURRENT_DATE - 14),

(uid, e20, 'linkedin', 'post', 'The Text That Made My Week',
'My beta user just posted her first AI-generated LinkedIn post.

47 likes in 2 hours. Her previous best? 12.

She called me screaming "IT WORKS."

Here''s what happened:

She runs a D2C brand. She told me she spends 4 hours a week on LinkedIn content and "hates every minute of it."

Her exact words: "I know what I want to say, I just can''t find the words."

So she started journaling in Founder Diaries. 2 minutes a day. Just talking about her challenges, wins, and learnings.

After 10 days, the AI learned her voice — her tone, her storytelling style, her go-to phrases.

It generated a post about her supply chain struggles that read like she wrote it at midnight after a tough day. Because she did. She just didn''t know it was becoming content.

That''s the unlock: your best content already exists. It''s in the stories you tell yourself every day.

#contentcreation #founderstory #aitools #buildinginpublic #linkedintips',
'approved',
'{"model": "anthropic/claude-sonnet-4", "tool": "create_linkedin_post", "generatedAt": "2026-03-17T17:30:00Z"}',
CURRENT_DATE - 10),

(uid, e25, 'linkedin', 'post', 'Two Weeks In: The Numbers',
'2 weeks building Founder Diaries. Here are the real numbers:

→ 15 beta users
→ 60% daily active rate
→ 3 people voluntarily paying (I haven''t set up billing)
→ Best retention metric: users who journal 3x/week generate 2x better content

The last one is the one that matters.

It proves the core thesis: the more you reflect, the better your content. Not because the AI gets smarter (it does), but because YOU get clearer about what you want to say.

The diary isn''t a feature. It''s the engine.

What surprised me most: users say the journaling itself is valuable — even before any content is generated. They''re processing their day in a way they never did before.

I accidentally built a thinking tool that also produces content.

Honestly? I''ll take it.

#buildinginpublic #saas #metrics #startupmetrics #indiehacker',
'approved',
'{"model": "anthropic/claude-sonnet-4", "tool": "create_linkedin_post", "generatedAt": "2026-03-18T20:30:00Z"}',
CURRENT_DATE - 8),

-- X threads
(uid, e07, 'x', 'thread', 'Why I Build',
'Late night reflection on why I''m building Founder Diaries. It''s not about content. Thread 🧵',
'draft',
'{"model": "anthropic/claude-sonnet-4", "tool": "create_thread", "generatedAt": "2026-03-15T23:45:00Z"}',
CURRENT_DATE - 17),

(uid, e37, 'x', 'thread', 'Week 3 Observation',
'Big realization after 3 weeks of building Founder Diaries: The diary entries themselves are getting better over time. Here''s what I mean 🧵',
'approved',
'{"model": "anthropic/claude-sonnet-4", "tool": "create_thread", "generatedAt": "2026-03-21T10:30:00Z"}',
CURRENT_DATE - 2),

-- X single posts
(uid, e40, 'x', 'post', 'Proof of Concept',
'Someone DMed me on LinkedIn asking "how did you write that post about founder loneliness?"

It was AI-generated from a 2-minute diary entry about working alone on weekends.

They thought I spent hours on it.

That''s the whole product thesis in one DM.',
'approved',
'{"model": "anthropic/claude-sonnet-4", "tool": "create_single_post", "generatedAt": "2026-03-22T19:00:00Z"}',
CURRENT_DATE - 1),

(uid, e34, 'x', 'post', 'RAG in Production',
'Shipped semantic retrieval for Founder Diaries content generation.

Instead of "last 3 entries by date" (random), it now finds the 5 most thematically similar past entries.

A post about hiring pulls in entries about team culture, not yesterday''s lunch.

Context that actually matters > chronological filler.',
'draft',
'{"model": "anthropic/claude-sonnet-4", "tool": "create_single_post", "generatedAt": "2026-03-20T09:30:00Z"}',
CURRENT_DATE - 3),

-- LinkedIn carousel
(uid, e08, 'linkedin', 'carousel', 'Stop Building Onboarding Forms',
'What if your onboarding wasn''t a form? What if it was a conversation that happened over days?',
'draft',
'{"model": "anthropic/claude-sonnet-4", "tool": "create_carousel", "generatedAt": "2026-03-17T12:00:00Z"}',
CURRENT_DATE - 16),

-- Rejected post
(uid, e04, 'linkedin', 'post', 'Pricing Thoughts',
'Every SaaS founder says "charge more." But what if your users can''t afford it yet? Here''s my controversial take on free tiers...',
'rejected',
'{"model": "anthropic/claude-sonnet-4", "tool": "create_linkedin_post", "generatedAt": "2026-03-15T22:00:00Z"}',
CURRENT_DATE - 18);

-- ═══════════════════════════════════════════════════════════
-- 7. ACTIVITY LOG
-- ═══════════════════════════════════════════════════════════

DELETE FROM user_activity_log WHERE user_id = uid;

INSERT INTO user_activity_log (user_id, action, metadata, created_at) VALUES
(uid, 'onboarding_completed', '{"industry": "SaaS", "platforms": ["linkedin", "x"]}', CURRENT_DATE - 20),
(uid, 'discovery_unlocked', '{"uniqueDiaryDays": 7}', CURRENT_DATE - 14),
(uid, 'persona_built', '{"confidenceScore": 0.35, "entryCount": 14}', CURRENT_DATE - 14),
(uid, 'persona_rebuilt', '{"confidenceScore": 0.52, "entryCount": 25}', CURRENT_DATE - 10),
(uid, 'persona_rebuilt', '{"confidenceScore": 0.78, "entryCount": 45}', CURRENT_DATE - 1),
(uid, 'first_post_approved', '{"platform": "linkedin", "postId": "generated"}', CURRENT_DATE - 10),
(uid, 'content_generated', '{"platform": "linkedin", "count": 5}', CURRENT_DATE - 8),
(uid, 'content_generated', '{"platform": "x", "count": 4}', CURRENT_DATE - 5);

END $$;

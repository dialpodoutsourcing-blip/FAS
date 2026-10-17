/* FAS specialist registry: static preview content derived from the build specification. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.FAS = root.FAS || {};
    root.FAS.agents = api;
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var registry = {
    anchor: {
      key: 'anchor', step: 1, name: 'ANCHOR', title: 'Trusted Expert Blueprint', symbol: 'em-anchor', color: '#D9BC7E',
      outcome: 'Set a clear, credible authority position before you build the rest of your system.',
      briefing: 'ANCHOR helps you define the specific people, problem, result, and market position you can credibly own. It draws from your real experience and proof, challenges claims that are too broad, and turns your answers into a focused authority foundation that guides every specialist after it.',
      generates: ['A clear authority arena and priority audience', 'A credible Trusted Expert Statement', 'Positioning boundaries that prevent overclaiming'],
      stages: ['Authority', 'Arena', 'Evidence', 'Position', 'Boundaries', 'Activation'], activeStage: 0,
      messages: [
        'We will define the position you can credibly own—without overclaiming or trying to speak to everyone.',
        'Let’s begin with the people and result you want your authority to be known for.'
      ],
      question: 'Who do you most want to be known by, and what result do you want them to associate with you?',
      hints: ['Who already asks for your help?', 'Which result matters most?'],
      savedFields: [
        { name: 'Authority arena', value: '[The market you choose]' },
        { name: 'Trusted Expert Statement', value: '[Built from your approved answers]' },
        { name: 'Position boundaries', value: '[Claims and audiences you exclude]' }
      ],
      completionLabel: 'Review my Trusted Expert Statement', completionHref: 'review.html?asset=anchor'
    },
    extract: {
      key: 'extract', step: 2, name: 'EXTRACT', title: 'Expertise Extraction Coach', symbol: 'em-extract', color: '#BFD0DF',
      outcome: 'Turn your lived experience, methods, proof, and point of view into an organized Expertise Map.',
      briefing: 'EXTRACT interviews you like a skilled strategist to uncover the knowledge you may use automatically but have never documented. It organizes your experiences, repeatable decisions, client examples, proof, and point of view into a usable intellectual-property map without inventing expertise you did not provide.',
      generates: ['A structured map of your expertise pillars', 'Your repeatable methods, decisions, and proof', 'A documented point of view in your own language'],
      stages: ['Context', 'Origin', 'Timeline', 'Method', 'Proof', 'Point of view', 'Boundaries', 'Synthesis'], activeStage: 3,
      messages: [
        'Here is what we have so far. Tell me if anything is off before we continue.',
        'Now let’s capture how you get results, one concrete example at a time.'
      ],
      question: 'Think of one client you helped recently. What was the very first thing you did with them?',
      hints: ['What did you notice?', 'What did you do next?'],
      savedFields: [
        { name: 'What people ask you for', value: '[Your answer]' },
        { name: 'Your origin story', value: '[Your story, in your words]' },
        { name: 'Your expertise pillars', value: '[Suggestions that need your approval]' }
      ],
      completionLabel: 'Show my Expertise Map', completionHref: 'review.html'
    },
    radar: {
      key: 'radar', step: 3, name: 'RADAR', title: 'Buyer Psychology Tool', symbol: 'em-radar', color: '#5FB597',
      outcome: 'Build one prioritized buyer profile from evidence rather than imagination.',
      briefing: 'RADAR turns customer evidence into a practical picture of the buyer you can serve best. It separates facts from assumptions, identifies urgent problems, desired outcomes, objections, triggers, and real customer language, then flags what still needs research instead of filling gaps with guesswork.',
      generates: ['A prioritized evidence-based buyer profile', 'A buyer psychology and language brief', 'A validation plan for unproven assumptions'],
      stages: ['Market', 'Evidence', 'Current state', 'Desired state', 'Triggers', 'Objections', 'Language', 'Priority', 'Approval'], activeStage: 0,
      messages: [
        'We will choose one buyer you can credibly reach and serve, then separate facts from assumptions.',
        'If you do not have research yet, that is okay. We will create a validation plan instead of inventing certainty.'
      ],
      question: 'Which group of people can you reach and help most credibly right now?',
      hints: ['Who is already in your network?', 'Who has paid for similar help?'],
      savedFields: [
        { name: 'Priority buyer', value: '[One plain-language segment]' },
        { name: 'Evidence available', value: '[Calls, messages, forms, or observed patterns]' },
        { name: 'Assumptions to validate', value: '[Clearly labeled hypotheses]' }
      ],
      completionLabel: 'Review my Buyer Intelligence Brief', completionHref: 'review.html?asset=radar'
    },
    forge: {
      key: 'forge', step: 4, name: 'FORGE', title: 'Brand Identity Generator', symbol: 'em-forge', color: '#E08A5A',
      outcome: 'Create a strategic system name, positioning line, and practical identity brief.',
      briefing: 'FORGE translates your approved authority, buyer, method, and outcome into a distinctive brand system. It develops multiple naming territories, evaluates candidates for clarity and fit, and shapes the selected direction into an identity brief while clearly separating strategic screening from legal clearance.',
      generates: ['Strategic naming territories and candidates', 'A selected system name and positioning line', 'A practical brand identity and screening brief'],
      stages: ['Strategy', 'Territories', 'Candidates', 'Shortlist', 'Stress test', 'Selection', 'Screening', 'Identity brief'], activeStage: 0,
      messages: [
        'We will name the system from your approved buyer, outcome, method, category, and tone.',
        'I can help test clarity and fit, but I will not claim legal or trademark clearance.'
      ],
      question: 'What approved outcome and method must the name help people understand or remember?',
      hints: ['What change does the buyer want?', 'What is distinctive about your method?'],
      savedFields: [
        { name: 'Naming strategy', value: '[Outcome, method, category, and tone]' },
        { name: 'Naming territories', value: '[Three distinct routes]' },
        { name: 'Screening record', value: '[Checks you confirm independently]' }
      ],
      completionLabel: 'Review my Brand Identity Brief', completionHref: 'review.html?asset=forge'
    },
    architect: {
      key: 'architect', step: 5, name: 'ARCHITECT', title: 'Signature System Builder', symbol: 'em-architect', color: '#7A9FDB',
      outcome: 'Turn your expertise into a teachable premium coaching journey with measurable milestones.',
      briefing: 'ARCHITECT converts your expertise into a structured client transformation rather than a pile of lessons. It maps the journey from starting state to observable result, sequences milestones and modules, defines implementation work, and checks the program for overload, gaps, and delivery feasibility.',
      generates: ['A sequenced signature-program curriculum map', 'Measurable milestones, modules, and lessons', 'An implementation and delivery framework'],
      stages: ['Transformation', 'Milestones', 'Phases', 'Modules', 'Lessons', 'Implementation', 'Overload check', 'Delivery check', 'Approval'], activeStage: 0,
      messages: [
        'We will map the client journey before filling it with lessons.',
        'Every module must advance the promised transformation and show evidence of progress.'
      ],
      question: 'What is the client’s starting state, and what observable end state should the core program create?',
      hints: ['What changes by the end?', 'How would the client prove progress?'],
      savedFields: [
        { name: 'Transformation', value: '[Start state → observable end state]' },
        { name: 'Program boundaries', value: '[Duration, delivery, and limits]' },
        { name: 'Milestones', value: '[Three to five changes in sequence]' }
      ],
      completionLabel: 'Review my Curriculum Map', completionHref: 'review.html?asset=architect'
    },
    voice: {
      key: 'voice', step: 6, name: 'VOICE', title: 'Words That Sell Copywriter', symbol: 'em-voice', color: '#AE93D6',
      outcome: 'Turn approved project facts into honest, launch-ready copy in your voice.',
      briefing: 'VOICE turns your approved strategy and evidence into persuasive copy without fabricating proof, urgency, or results. It clarifies the job of each asset, builds a message brief, drafts in sections, and checks every claim against your expert, buyer, brand, program, and boundary decisions.',
      generates: ['A channel-specific message and copy brief', 'Launch-ready copy written in your voice', 'Claims, evidence, and call-to-action checks'],
      stages: ['Input gate', 'Content job', 'Context', 'Gap check', 'Message brief', 'Sectional draft', 'Checks', 'Approval'], activeStage: 1,
      messages: [
        'I will write only from approved expert, buyer, brand, program, proof, and boundary fields.',
        'We will choose one immediate copy job and approve a message brief before drafting long-form copy.'
      ],
      question: 'What do you want to create first: a landing page, sales letter, email, social post, webinar, direct message, or script?',
      hints: ['Where will the reader see it?', 'What single action should they take?'],
      savedFields: [
        { name: 'Immediate copy job', value: '[One channel and format]' },
        { name: 'Audience stage', value: '[What the reader knows now]' },
        { name: 'Call to action', value: '[One approved next action]' }
      ],
      completionLabel: 'Review my Copy Pack', completionHref: 'review.html?asset=voice'
    },
    launch: {
      key: 'launch', step: 7, name: 'LAUNCH', title: 'Million Dollar Rollout Plan', symbol: 'em-launch', color: '#D9768A',
      outcome: 'Convert finished assets into a dated launch plan, calendar, owner map, readiness score, and sales tracker.',
      briefing: 'LAUNCH turns your completed strategic assets into an executable rollout. It works backward from approved dates, matches the plan to your real capacity and channels, assigns responsibilities, exposes readiness blockers, and creates a practical operating view for launch activity and sales tracking.',
      generates: ['A dated rollout plan and launch calendar', 'An owner map with readiness blockers', 'A sales activity and performance tracker'],
      stages: ['Launch type', 'Dates', 'Prerequisites', 'Backward plan', 'Owners', 'Channels', 'Calendar', 'Sales', 'Readiness', 'Review'], activeStage: 0,
      messages: [
        'We will build a launch plan around the channels and capacity you can actually execute.',
        'I may recommend timing, but no deadline becomes approved until you confirm it.'
      ],
      question: 'Which launch type are you planning: beta, live launch, evergreen activation, or another approved approach?',
      hints: ['Is this your first cohort?', 'Will enrollment open and close?'],
      savedFields: [
        { name: 'Launch type', value: '[Your selected rollout]' },
        { name: 'Target dates', value: '[Dates remain unapproved until you confirm]' },
        { name: 'Readiness blockers', value: '[Launch-critical gaps]' }
      ],
      completionLabel: 'Review my Rollout Plan', completionHref: 'launch.html'
    }
  };

  var keys = ['anchor', 'extract', 'radar', 'forge', 'architect', 'voice', 'launch'];

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function resolveKey(key) {
    var normalized = typeof key === 'string' ? key.trim().toLowerCase() : '';
    return Object.prototype.hasOwnProperty.call(registry, normalized) ? normalized : 'extract';
  }
  function normalize(config) {
    var result = clone(config || {});
    result.messages = Array.isArray(result.messages) ? result.messages : [];
    result.hints = Array.isArray(result.hints) ? result.hints : [];
    result.savedFields = Array.isArray(result.savedFields) ? result.savedFields : [];
    result.generates = Array.isArray(result.generates) ? result.generates : [];
    result.stages = Array.isArray(result.stages) ? result.stages : [];
    return result;
  }
  function get(key) { return normalize(registry[resolveKey(key)]); }

  return { keys: keys.slice(), get: get, resolveKey: resolveKey, normalize: normalize };
});

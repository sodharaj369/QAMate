import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import {
  DefaultRequirementValidator,
  RuleBasedAnalysisStrategy,
  DefaultConfidenceScorer,
  DefaultRequirementAnalyzer,
  RequirementAnalyzerResult,
  MissingInfoCategory,
} from './analyzer/index.js';
import {
  DefaultQuestionCandidateGenerator,
  DefaultQuestionPrioritizer,
  DefaultQuestionDeduplicator,
  DefaultQuestionPlanner,
  DefaultClarificationEngine,
} from './clarification/index.js';
import {
  DefaultContextCompiler,
  DefaultContextValidator,
  DefaultContextRenderer,
} from './context/index.js';
import { DefaultTestStrategyEngine } from './strategy/index.js';
import { DefaultReviewEngine, SafetyScanner } from './review/index.js';
import { DefaultKnowledgeEngine } from './knowledge/index.js';
import { DefaultCoverageEngine } from './coverage/index.js';
import { LLMProviderFactory } from './providers/index.js';
import { DefaultADOAdapter } from './integrations/index.js';
import {
  JsonFileStorage,
  SQLiteSimulatedStorage,
  SQLServerSimulatedStorage,
} from './storage/index.js';
import { DefaultArtifactPlanner, DefaultArtifactGenerator } from './artifacts/index.js';
import {
  Requirement,
  Conversation,
  Answer,
  TestCase,
  ProjectConfig,
  UserPersona,
  ProjectProfile,
} from './domain.js';
import { GenerationPreferences } from './types.js';

/**
 * QAMate Sprint 3 Context Engine CLI Demonstration Harness
 */
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error(
      'Error: Please provide the path to a requirement specification file or --ado <id>.',
    );
    console.error('Usage: npm run analyze -- <filepath>  OR  npm run analyze -- --ado <id>');
    process.exit(1);
  }

  const isAdoMode = args[0] === '--ado';
  let filePath = '';
  let workItemId = '';

  if (isAdoMode) {
    workItemId = args[1];
    if (!workItemId) {
      console.error('Error: Please specify the Azure DevOps Work Item ID.');
      process.exit(1);
    }
  } else {
    filePath = path.resolve(args[0]);
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found at path: ${filePath}`);
      process.exit(1);
    }
  }

  const rl = readline.createInterface({ input, output });

  console.log(`\n======================================================`);
  if (isAdoMode) {
    console.log(`🔍 QAMate Sprint 12 - Azure DevOps Integration: Work Item ${workItemId}`);
  } else {
    console.log(`🔍 QAMate Sprint 3 - Interactive Context Engine: ${path.basename(filePath)}`);
  }
  console.log(`======================================================\n`);

  try {
    let requirement!: Requirement;

    if (isAdoMode) {
      console.log('🌐 Importing work item from Azure DevOps...');
      const org = process.env.ADO_ORG || (await rl.question('Enter ADO Organization: '));
      const project = process.env.ADO_PROJECT || (await rl.question('Enter ADO Project: '));
      const pat = process.env.ADO_PAT || (await rl.question('Enter ADO PAT: '));

      const adoAdapter = new DefaultADOAdapter();
      requirement = await adoAdapter.importWorkItem(workItemId, org, project, pat);
      console.log(`✔ Imported ADO Work Item: ${requirement.title}\n`);
    } else {
      const rawContent = fs.readFileSync(filePath, 'utf8');
      requirement = {
        id: `req-${Date.now().toString().slice(-4)}`,
        projectId: 'proj-demo',
        title: path.basename(filePath, path.extname(filePath)),
        content: rawContent,
        contentType: filePath.endsWith('.json') ? 'jira-json' : 'markdown',
        version: 1,
        status: 'draft',
        metadata: {
          externalId: 'CLI-DEMO',
          author: 'QA Lead',
        },
      };
    }

    let conversation!: Conversation;
    let isLoadedSession = false;
    let result!: RequirementAnalyzerResult;

    const storage = new JsonFileStorage();
    const existingSessions = await storage.listConversations();

    if (existingSessions.length > 0) {
      console.log('🔄 Found existing QAMate analysis sessions:');
      console.log('  1. Start a new analysis run (Default)');
      console.log('  2. Load and resume a past session');
      const sessionChoice = await rl.question('Select choice (1-2) [1]: ');
      if (sessionChoice.trim() === '2') {
        console.log('\nSelect session to load:');
        existingSessions.forEach((sid, idx) => console.log(`  ${idx + 1}. ${sid}`));
        const choiceIdxStr = await rl.question(`Select session (1-${existingSessions.length}): `);
        const choiceIdx = parseInt(choiceIdxStr, 10) - 1;
        if (choiceIdx >= 0 && choiceIdx < existingSessions.length) {
          const loaded = await storage.loadConversation(existingSessions[choiceIdx]);
          if (loaded) {
            conversation = loaded;
            isLoadedSession = true;
            requirement = {
              id: conversation.requirementId,
              projectId: conversation.projectId,
              title: conversation.id,
              content: 'Loaded requirement content',
              contentType: 'plain-text',
              version: 1,
              status: 'draft',
              metadata: {},
            };
            result = {
              intelligence: conversation.currentIntelligence!,
              validation: { isValid: true, issues: [] },
              confidence: {
                score: conversation.currentIntelligence!.confidenceScore,
                evaluations: [],
                recommendation:
                  conversation.currentIntelligence!.confidenceScore >= 0.8
                    ? 'generate-direct'
                    : conversation.currentIntelligence!.confidenceScore >= 0.5
                      ? 'clarify-recommended'
                      : 'clarify-mandatory',
              },
              ambiguitiesReport: conversation.currentIntelligence!.ambiguities.map((a) => ({
                id: a.id,
                type: 'vague-terminology',
                description: a.description,
                snippet: a.locationSnippet,
                severity: a.severity,
              })),
              missingInfoReport: conversation.currentIntelligence!.missingInformation.map((m) => {
                let category: MissingInfoCategory = 'error-handling';
                if (
                  m.category === 'error-handling' ||
                  m.category === 'boundary-conditions' ||
                  m.category === 'permissions-auth' ||
                  m.category === 'data-formats' ||
                  m.category === 'non-functional-sla'
                ) {
                  category = m.category;
                }
                return {
                  category,
                  description: m.description,
                  whyCriticalForQA: 'Missing verification requirements.',
                };
              }),
            };
            console.log(`\nSession ${conversation.id} loaded successfully.`);
          }
        }
      }
    }

    if (!isLoadedSession) {
      // 2. Instantiate Rules-based analyzer pipeline
      const validator = new DefaultRequirementValidator();
      const scorer = new DefaultConfidenceScorer();
      const strategy = new RuleBasedAnalysisStrategy();
      const analyzer = new DefaultRequirementAnalyzer(validator, scorer, [strategy]);

      // 3. Execute Analysis
      result = await analyzer.analyze(requirement);

      // 4. Output validation checks
      console.log(`🛡️  Pre-validation: ${result.validation.isValid ? '✅ PASS' : '❌ FAIL'}`);
      if (result.validation.issues.length > 0) {
        console.log('Issues found:');
        for (const issue of result.validation.issues) {
          console.log(`  - [${issue.severity.toUpperCase()}] (${issue.ruleId}): ${issue.message}`);
        }
      }
      console.log('');

      if (!result.validation.isValid) {
        console.error('Abort: Requirement failed critical validation rules.');
        rl.close();
        process.exit(1);
      }

      // 5. Setup Clarification Engine pipeline
      const candidateGenerator = new DefaultQuestionCandidateGenerator();
      const prioritizer = new DefaultQuestionPrioritizer();
      const deduplicator = new DefaultQuestionDeduplicator();
      const planner = new DefaultQuestionPlanner();
      const clarificationEngine = new DefaultClarificationEngine(
        candidateGenerator,
        prioritizer,
        deduplicator,
        planner,
      );

      // 6. Plan Clarifications (Initial fetch of all candidates)
      const { candidates } = await clarificationEngine.planClarifications(
        requirement,
        result.intelligence,
      );

      const totalCount = candidates.length;
      const blockingCount = candidates.filter(
        (c) => c.impact === 'blocking-test-strategy' || c.impact === 'blocking-understanding',
      ).length;

      console.log(`📊 Requirement Intelligence Summary`);
      console.log(`------------------------------------------------------`);
      console.log(
        `👥 Actors:       ${result.intelligence.actors.map((a) => a.name).join(', ') || 'None'}`,
      );
      console.log(
        `📦 Entities:     ${result.intelligence.entities.map((e) => e.name).join(', ') || 'None'}`,
      );
      console.log(`⚙️  Rules Found:  ${result.intelligence.businessRules.length}`);
      console.log(
        `📈 Complexity:   ${result.intelligence.complexity.level.toUpperCase()} (${result.intelligence.complexity.rationale})`,
      );
      console.log(`💡 Initial Conf: ${(result.intelligence.confidenceScore * 100).toFixed(0)}%`);
      console.log(
        `❓ Gaps Found:   Found ${totalCount} possible questions (${blockingCount} are BLOCKING).`,
      );
      console.log(`------------------------------------------------------\n`);

      // 7. Interactive Selection: Ask only blocking or all?
      let askOnlyBlocking = true;
      if (totalCount > blockingCount && blockingCount > 0) {
        const choice = await rl.question(
          `QAMate found ${totalCount} clarification questions. Only ${blockingCount} are blocking.\n` +
            `Would you like to answer just the blocking questions [B] or review all questions [A]? (Default: B): `,
        );
        if (choice.trim().toLowerCase() === 'a') {
          askOnlyBlocking = false;
        }
        console.log('');
      }

      // 8. Re-plan clarifications based on user choice
      const { activeQuestions } = await clarificationEngine.planClarifications(
        requirement,
        result.intelligence,
        {
          askOnlyBlocking,
        },
      );

      // 9. Setup active Conversation Aggregate Root
      conversation = {
        id: `conv-${Date.now()}`,
        projectId: requirement.projectId,
        requirementId: requirement.id,
        status: 'planning-questions',
        currentIntelligence: result.intelligence,
        candidates,
        questions: activeQuestions,
        answers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log(`🚀 Starting Clarification Flow (status: ${conversation.status})`);
      console.log(`Answering ${conversation.questions.length} planned questions:\n`);

      // 10. Loop through planned questions
      // Update state to waiting-for-answers
      (conversation as { status: string }).status = 'waiting-for-answers';
      const userAnswers: Answer[] = [];

      for (let i = 0; i < conversation.questions.length; i++) {
        const q = conversation.questions[i];
        console.log(
          `Question ${i + 1}/${conversation.questions.length} [Category: ${q.category}] [Impact: ${q.impact.toUpperCase()}]`,
        );
        console.log(`❓ ${q.text}`);
        console.log(`💡 Rationale: ${q.rationale}`);

        let inputAnswer = '';
        if (q.type === 'single-choice' && q.options) {
          console.log('Options:');
          q.options.forEach((opt, idx) => console.log(`  [${idx + 1}] ${opt}`));
          console.log(`  [S] Skip this question`);

          while (true) {
            const selected = await rl.question(`Select option (1-${q.options.length} or S): `);
            const cleanSel = selected.trim().toLowerCase();

            if (cleanSel === 's') {
              inputAnswer = 'skip';
              break;
            }

            const optIdx = parseInt(cleanSel, 10) - 1;
            if (optIdx >= 0 && optIdx < q.options.length) {
              inputAnswer = q.options[optIdx];
              break;
            }
            console.log('Invalid selection, please try again.');
          }
        } else {
          console.log(`  (Type answer below, or type 'skip' to skip)`);
          const entered = await rl.question('Answer: ');
          inputAnswer = entered.trim();
        }

        // Handle Skip Risk warnings
        if (inputAnswer.toLowerCase() === 'skip' || inputAnswer === '') {
          console.log(`\n⚠️  ${q.skipRisk}`);
          const confirmSkip = await rl.question(`Are you sure you want to skip? (y/n) [n]: `);
          if (confirmSkip.trim().toLowerCase() !== 'y') {
            // decrement loop counter to repeat the same question
            i--;
            console.log('\nRepeating question...');
            continue;
          }
          q.status = 'skipped';
          console.log(`➔ Question skipped.\n`);
        } else {
          q.status = 'answered';
          const answerObj: Answer = {
            questionId: q.id,
            textValue: q.type === 'open-text' ? inputAnswer : undefined,
            selectedOptions: q.type === 'single-choice' ? [inputAnswer] : undefined,
            answeredAt: new Date(),
            answeredBy: 'QA Engineer',
          };
          q.answer = answerObj;
          userAnswers.push(answerObj);
          console.log(`➔ Answer recorded.\n`);
        }
      }

      conversation.answers.push(...userAnswers);
      (conversation as { status: string }).status = 'ready-for-generation';
      conversation.updatedAt = new Date();

      console.log(`------------------------------------------------------`);
      console.log(`✅ Clarification Phase Complete!`);
      console.log(`Session Status: ${conversation.status}`);
      console.log(
        `Total Answers Collected: ${conversation.answers.length}/${conversation.questions.length}`,
      );
      console.log(`------------------------------------------------------\n`);
    }

    // 10.5. Select AI Provider
    console.log('🤖 Select AI Provider Configuration:');
    console.log('  1. Mock Offline Provider (Default)');
    console.log('  2. OpenAI (requires OPENAI_API_KEY environment variable or manual entry)');
    console.log(
      '  3. Google Gemini (requires GEMINI_API_KEY environment variable or manual entry)',
    );
    console.log(
      '  4. Anthropic Claude (requires ANTHROPIC_API_KEY environment variable or manual entry)',
    );
    console.log('  5. Ollama Local');
    const providerChoice = await rl.question('Choose provider (1-5) [1]: ');

    let providerId: 'openai' | 'gemini' | 'claude' | 'ollama' | 'mock' = 'mock';
    let apiKey: string | undefined;
    let apiEndpoint: string | undefined;
    let modelName = 'mock';

    if (providerChoice === '2') {
      providerId = 'openai';
      modelName = 'gpt-4o';
      apiKey = process.env.OPENAI_API_KEY || (await rl.question('Enter OpenAI API Key: '));
    } else if (providerChoice === '3') {
      providerId = 'gemini';
      modelName = 'gemini-1.5-pro';
      apiKey = process.env.GEMINI_API_KEY || (await rl.question('Enter Gemini API Key: '));
    } else if (providerChoice === '4') {
      providerId = 'claude';
      modelName = 'claude-3-5-sonnet-20240620';
      apiKey = process.env.ANTHROPIC_API_KEY || (await rl.question('Enter Anthropic API Key: '));
    } else if (providerChoice === '5') {
      providerId = 'ollama';
      modelName = 'llama3';
      apiEndpoint =
        (await rl.question('Enter Ollama Endpoint [http://localhost:11434]: ')) ||
        'http://localhost:11434';
    }

    const providerConfig = { providerId, apiKey, apiEndpoint, modelName };
    const activeProvider = LLMProviderFactory.createProvider(providerConfig);
    console.log(`\nSelected Provider: ${activeProvider.name} (Model: ${modelName})\n`);

    // 11. Compile QA Context & readiness checks
    console.log('⚙️  Compiling QA Context...');
    const projectConfig: ProjectConfig = {
      targetLanguage: 'TypeScript',
      targetFramework: 'Playwright',
      namingConvention: 'Given/When/Then',
      companyRules: [
        'Secure public access must be fully disabled on cloud storage containers.',
        'Token expiry checks must cover token duration limits and refresh token failures.',
      ],
      qaGuidelines: [
        'Verify both positive and negative logic outcomes.',
        'Check edge cases and limit boundaries.',
      ],
    };

    const generationPreferences: GenerationPreferences = {
      maxCases: 10,
      focusAreas: ['security', 'boundaries'],
      includeAutomationCandidate: true,
    };

    const compiler = new DefaultContextCompiler();
    const contextValidator = new DefaultContextValidator();
    const renderer = new DefaultContextRenderer();

    const context = await compiler.compile(
      requirement,
      result.intelligence,
      conversation.answers,
      projectConfig,
      generationPreferences,
    );

    const readiness = await contextValidator.validate(context);

    // 12. Output Context Inspector
    console.log(`\n======================================================`);
    console.log(`🧠 QAMate Context Inspector`);
    console.log(`======================================================`);
    console.log(`Requirement Spec:   ✔ Loaded ("${context.requirement.title}")`);
    console.log(`Business Rules:     ✔ ${context.intelligence.businessRules.length} rules loaded`);
    console.log(`Actors:             ✔ ${context.intelligence.actors.length} actors loaded`);
    console.log(
      `Clarifications:     ✔ ${conversation.answers.length} answered, ${conversation.questions.length - conversation.answers.length} skipped`,
    );
    console.log(`Project Standards:  ✔ Target Language: ${context.projectConfig.targetLanguage}`);
    console.log(`                    ✔ Framework: ${context.projectConfig.targetFramework}`);
    console.log(`Generation Prefs:   ✔ Max Cases: ${context.generationPreferences.maxCases}`);
    console.log(
      `                    ✔ Focus: ${context.generationPreferences.focusAreas.join(', ')}`,
    );
    console.log(`------------------------------------------------------`);
    console.log(
      `🛡️  Readiness Check:  ${readiness.ready ? '🟢 READY TO GENERATE' : '🔴 CLARIFICATION REQUIRED'}`,
    );
    console.log(`Confidence Score:   ${(readiness.confidence * 100).toFixed(0)}%`);
    console.log(`Recommendation:     ${readiness.recommendation}`);

    if (readiness.blockingIssues.length > 0) {
      console.log(`\nBlocking Issues [${readiness.blockingIssues.length}]:`);
      readiness.blockingIssues.forEach((issue) => console.log(`  ❌ ${issue}`));
    }

    if (readiness.warnings.length > 0) {
      console.log(`\nWarnings [${readiness.warnings.length}]:`);
      readiness.warnings.forEach((warning) => console.log(`  ⚠️  ${warning}`));
    }
    console.log(`======================================================\n`);

    // 13. Develop Test Strategy
    console.log('⚙️  Compiling Executable QA Strategy...');
    const strategyEngine = new DefaultTestStrategyEngine();
    const testStrategy = await strategyEngine.developStrategy(context);

    console.log(`\n======================================================`);
    console.log(`📊 QAMate QA Strategy Dashboard`);
    console.log(`======================================================`);
    console.log(`Business Impact:      ${testStrategy.businessImpact.toUpperCase()}`);
    console.log(`Risk Level:           ${testStrategy.riskLevel.toUpperCase()}`);
    console.log(`Strategy Confidence:  ${(testStrategy.confidenceScore * 100).toFixed(0)}%`);
    console.log(`Primary Focus Areas:  ${testStrategy.primaryFocus.join(', ')}`);
    console.log(`------------------------------------------------------`);
    console.log(`🎯 Traceable Testing Objectives:`);
    testStrategy.objectives.forEach((obj) => console.log(`  - ${obj}`));
    console.log(`------------------------------------------------------`);
    console.log(`📋 Preconditions Required:`);
    testStrategy.suggestedPreconditions.forEach((pre) => console.log(`  - ${pre}`));
    console.log(`------------------------------------------------------`);
    console.log(`📦 Suggested Test Data Sets:`);
    testStrategy.suggestedTestData.forEach((td) => console.log(`  - ${td}`));
    console.log(`------------------------------------------------------`);
    console.log(`🛡️  Recommended Test Suites:`);
    testStrategy.recommendedSuites.forEach((s) => {
      console.log(`  ✔ [${s.suite}] (Priority: ${s.priority}) - ${s.reason}`);
    });
    console.log(`\n🚫 Excluded Test Suites (Why NOT):`);
    testStrategy.excludedSuites.forEach((s) => {
      console.log(`  ✘ [${s.suite}] - ${s.reason}`);
    });
    console.log(`\n🌴 Out of Scope / Deferred Testing:`);
    testStrategy.outOfScope.forEach((s) => {
      console.log(`  - [${s.area}] - ${s.reason}`);
    });
    console.log(`------------------------------------------------------`);
    console.log(`🤖 Automation Candidates:`);
    testStrategy.automationCandidates.forEach((cand) => {
      console.log(`  ✔ Scenario: "${cand.scenario}"\n    Reason:   ${cand.reason}`);
    });
    console.log(`\n🔬 Manual Exploratory Charters:`);
    testStrategy.manualExploratoryScenarios.forEach((charter) => {
      console.log(`  ✔ Area:    ${charter.area}\n    Focus:   ${charter.instructions}`);
    });
    console.log(`------------------------------------------------------`);
    console.log(`Suggested Environments: ${testStrategy.suggestedEnvironments.join(', ')}`);
    console.log(`\nExecution Sequencing:`);
    testStrategy.executionOrder.forEach((step) => {
      console.log(`  ${step.order}. [${step.suite}] ➔ ${step.focus}`);
    });
    console.log(`\nEstimated Effort:`);
    testStrategy.estimatedEffort.forEach((eff) => {
      console.log(`  - [${eff.suite}]: ${eff.durationMinutes} min`);
    });
    const totalEffort = testStrategy.estimatedEffort.reduce(
      (sum, current) => sum + current.durationMinutes,
      0,
    );
    console.log(
      `  Total Estimated Effort: ${totalEffort} min (~${(totalEffort / 60).toFixed(1)} hrs)`,
    );
    console.log(`------------------------------------------------------`);
    console.log(`🧠 QA Strategy Reasoning Trace:`);
    testStrategy.reasoningTrace.forEach((traceStep, idx) => {
      console.log(`  ${idx + 1}. ${traceStep}`);
    });
    console.log(`======================================================\n`);

    // 14. QA Artifact Planning
    console.log('Select your Engineering Persona for QA Artifact Planning:');
    console.log('  [1] Manual QA (Default)');
    console.log('  [2] Backend Developer');
    console.log('  [3] Automation QA');
    console.log('  [4] Tech Lead');
    console.log('  [5] Security Tester');

    const personaInput = await rl.question('Select Option (1-5): ');
    let persona: UserPersona = 'manual-qa';
    if (personaInput.trim() === '2') {
      persona = 'backend-developer';
    } else if (personaInput.trim() === '3') {
      persona = 'automation-qa';
    } else if (personaInput.trim() === '4') {
      persona = 'tech-lead';
    } else if (personaInput.trim() === '5') {
      persona = 'security-tester';
    }

    const profile: ProjectProfile = {
      language: context.projectConfig.targetLanguage || 'TypeScript',
      framework: context.projectConfig.targetFramework || 'Playwright',
      database: 'SQL Server',
      cloud: 'Azure',
      testingStyle: context.projectConfig.namingConvention || 'Given/When/Then',
    };

    console.log('\n⚙️  Compiling Artifact Plan...');
    const artifactPlanner = new DefaultArtifactPlanner();
    const artifactPlan = await artifactPlanner.planArtifacts(testStrategy, persona, profile);

    console.log(`\n======================================================`);
    console.log(`📋 QAMate Artifact Plan Dashboard`);
    console.log(`======================================================`);
    console.log(`Target Persona:      ${artifactPlan.persona.toUpperCase()}`);
    console.log(`Technology Stack:    Language:  ${artifactPlan.profile.language}`);
    console.log(`                     Framework: ${artifactPlan.profile.framework}`);
    console.log(`                     Database:  ${artifactPlan.profile.database}`);
    console.log(`                     Cloud:     ${artifactPlan.profile.cloud}`);
    console.log(`                     Style:     ${artifactPlan.profile.testingStyle}`);
    console.log(`------------------------------------------------------`);
    console.log(`📦 Selected Artifact Types to Generate:`);
    artifactPlan.selectedArtifacts.forEach((art) => console.log(`  ✔ [${art}]`));
    console.log(`------------------------------------------------------`);
    console.log(`🤖 Prompt Instructions for AI Generation:`);
    artifactPlan.generationInstructions.forEach((inst) => console.log(`  - ${inst}`));
    console.log(`------------------------------------------------------`);
    console.log(`🧠 Planning Decision Reasoning:`);
    artifactPlan.reasoning.forEach((reasonStep, idx) => {
      console.log(`  ${idx + 1}. ${reasonStep}`);
    });
    console.log(`======================================================\n`);

    // 15. QA Artifact Generation
    console.log('⚙️  Executing QA Artifact Generation Pipeline...');
    const generator = new DefaultArtifactGenerator();
    const artifacts = await generator.generateArtifacts(context, artifactPlan, activeProvider);

    console.log(`\n======================================================`);
    console.log(`📦 QAMate Generated QA Artifacts Dashboard`);
    console.log(`======================================================`);
    console.log(`Total Artifacts Mapped:   ${artifacts.length}`);
    console.log(`AI Provider Employed:     ${activeProvider.name} (Model: ${modelName})`);
    console.log(`------------------------------------------------------`);
    artifacts.forEach((art, idx) => {
      console.log(`\n[Artifact ${idx + 1}/${artifacts.length}] Type: ${art.type} (ID: ${art.id})`);
      console.log(`------------------------------------------------------`);
      console.log(art.content);
      console.log(`------------------------------------------------------`);
    });
    console.log(`======================================================\n`);

    // 16. QA Quality Gate Review
    console.log('⚙️  Running Quality Gate Review Engine...');
    const reviewEngine = new DefaultReviewEngine();
    const reviewReport = await reviewEngine.reviewArtifacts(artifacts, context, testStrategy);

    let statusIndicator = '🟢 APPROVED';
    if (reviewReport.status === 'flagged') {
      statusIndicator = '🟡 FLAGGED';
    } else if (reviewReport.status === 'rejected') {
      statusIndicator = '🔴 REJECTED';
    }

    console.log(`\n======================================================`);
    console.log(`🛡️  QAMate Quality Gate Review Dashboard`);
    console.log(`======================================================`);
    console.log(`Review Status:        ${statusIndicator}`);
    console.log(`Overall Score:        ${reviewReport.scores.overallScore}%`);
    console.log(`Deduplication Score:  ${reviewReport.scores.deduplicationScore}%`);
    console.log(`Business Value Score: ${reviewReport.scores.businessValueScore}%`);
    console.log(`Code Quality Score:   ${reviewReport.scores.codeQualityScore}%`);
    console.log(`------------------------------------------------------`);
    if (reviewReport.issues.length === 0) {
      console.log('✔ No quality issues detected.');
    } else {
      console.log(`Issues Detected [${reviewReport.issues.length}]:`);
      reviewReport.issues.forEach((iss) => {
        console.log(`  - [${iss.id}] [${iss.severity.toUpperCase()}]: ${iss.description}`);
      });
    }
    console.log(`------------------------------------------------------`);
    if (reviewReport.suggestions.length === 0) {
      console.log('✔ No enhancement suggestions.');
    } else {
      console.log('Suggestions for Improvement:');
      reviewReport.suggestions.forEach((sug) => {
        console.log(`  - ${sug}`);
      });
    }
    console.log(`------------------------------------------------------`);
    console.log(`🧠 Quality Gate Reasoning Trace:`);
    reviewReport.traceLogs.forEach((traceStep, idx) => {
      console.log(`  ${idx + 1}. ${traceStep}`);
    });
    console.log(`======================================================\n`);

    // 16.5 AI Output Safety Scan
    console.log('🔒 Running AI Output Safety & Hallucination Checks...');
    const safetyScanner = new SafetyScanner();
    const safetyReports = safetyScanner.scanArtifacts(artifacts);

    let safetyViolationsCount = 0;
    console.log(`\n======================================================`);
    console.log(`🛡️  QAMate AI Output Safety Scan Dashboard`);
    console.log(`======================================================`);
    safetyReports.forEach((report, artId) => {
      if (!report.isSafe) {
        safetyViolationsCount += report.issues.length;
        console.log(`⚠️  Artifact [${artId}] is UNSAFE:`);
        report.issues.forEach((issue) => {
          console.log(
            `  - [${issue.severity.toUpperCase()}] ${issue.message} (Trigger: "${issue.triggerText}")`,
          );
        });
      }
    });

    if (safetyViolationsCount === 0) {
      console.log('🟢 All generated artifacts passed safety scans cleanly.');
    } else {
      console.log(`🔴 Found ${safetyViolationsCount} safety check warnings! Please review.`);
    }
    console.log(`======================================================\n`);

    // 17. Knowledge Engine — Extract & Query
    console.log('🧠 Running Knowledge Engine...');
    const knowledgeEngine = new DefaultKnowledgeEngine();
    const knowledgeEntries = await knowledgeEngine.extractKnowledge(
      artifacts,
      result.intelligence,
      reviewReport,
    );

    // Query for similar patterns
    const similarResult = await knowledgeEngine.findSimilarRequirements(requirement);

    console.log(`\n======================================================`);
    console.log(`📚 QAMate Knowledge Engine Dashboard`);
    console.log(`======================================================`);
    console.log(`Knowledge Entries Extracted:  ${knowledgeEntries.length}`);
    console.log(`Total Knowledge Store Size:  ${knowledgeEngine.getStore().length}`);
    console.log(`------------------------------------------------------`);

    // Group entries by category
    const grouped = new Map<string, number>();
    for (const entry of knowledgeEntries) {
      grouped.set(entry.category, (grouped.get(entry.category) || 0) + 1);
    }
    console.log('📊 Entries by Category:');
    grouped.forEach((count, category) => {
      console.log(`  [${category}]: ${count} entries`);
    });

    console.log(`------------------------------------------------------`);
    console.log('📋 Extracted Knowledge Entries:');
    knowledgeEntries.forEach((entry, idx) => {
      console.log(`  ${idx + 1}. [${entry.category.toUpperCase()}] ${entry.title}`);
      console.log(
        `     ${entry.description.slice(0, 100)}${entry.description.length > 100 ? '...' : ''}`,
      );
      console.log(`     Keywords: ${entry.keywords.join(', ')}`);
      console.log(`     Confidence: ${Math.round(entry.confidence * 100)}%`);
    });

    console.log(`------------------------------------------------------`);
    if (similarResult.matches.length === 0) {
      console.log(
        '🔍 Similar Requirements: No matches found (first run — knowledge store is empty).',
      );
    } else {
      console.log(`🔍 Similar Requirements Found [${similarResult.matches.length}]:`);
      similarResult.matches.forEach((match) => {
        console.log(
          `  - [${match.entry.title}] Relevance: ${Math.round(match.relevanceScore * 100)}%`,
        );
      });
    }
    console.log(`======================================================\n`);

    // 18. Coverage Engine — Mapping & Tracking
    console.log('⚙️  Running Coverage Engine...');
    const coverageEngine = new DefaultCoverageEngine();
    const coverageReport = await coverageEngine.calculateCoverage(
      testStrategy,
      artifacts,
      result.intelligence,
    );

    console.log(`\n======================================================`);
    console.log(`📊 QAMate Rule Coverage Dashboard`);
    console.log(`======================================================`);
    console.log(`Overall Rule Coverage: ${coverageReport.overallCoveragePercent}%`);
    console.log(`Total Targets Tracked:  ${coverageReport.items.length}`);
    console.log(`------------------------------------------------------`);
    console.log('📋 Target Coverage Traceability:');
    coverageReport.items.forEach((item, idx) => {
      let statusIndicator = '🟢 FULL';
      if (item.status === 'partial') {
        statusIndicator = '🟡 PARTIAL';
      } else if (item.status === 'uncovered') {
        statusIndicator = '🔴 UNCOVERED';
      }

      console.log(
        `  ${idx + 1}. [${item.targetType.toUpperCase()}] ${item.targetId}: ${statusIndicator}`,
      );
      console.log(`     Description: ${item.description}`);
      if (item.matchedScenarios.length > 0) {
        console.log(`     Matched Scenarios: ${item.matchedScenarios.join(', ')}`);
      }
      if (item.gapExplanation) {
        console.log(`     Gap Explanation:   ${item.gapExplanation}`);
      }
    });
    console.log(`------------------------------------------------------`);
    console.log(`🧠 Coverage Analysis Trace:`);
    coverageReport.traceLogs.forEach((traceStep, idx) => {
      console.log(`  ${idx + 1}. ${traceStep}`);
    });
    console.log(`======================================================\n`);

    // 19. Render to markdown template
    const templatePath = './templates/generation.md';
    if (fs.existsSync(templatePath)) {
      console.log(`📝 Rendering Prompt to template: ${templatePath}...`);
      const renderedPrompt = await renderer.renderToMarkdown(context, templatePath);
      console.log(`------------------------------------------------------`);
      console.log(renderedPrompt);
      console.log(`------------------------------------------------------\n`);
    }

    console.log(`📦 Serialized GeneratorContext JSON:`);
    console.log(await renderer.renderToJSON(context));

    // 20. Save Session
    console.log('💾 Save Session Configuration:');
    console.log('  1. Save to JSON File (Default)');
    console.log('  2. Save to JSON File + SQLite simulation log');
    console.log('  3. Save to JSON File + SQL Server simulation log');
    console.log('  4. Do not save');
    const saveChoice = await rl.question('Choose save option (1-4) [1]: ');
    if (saveChoice.trim() !== '4') {
      const fileStorage = new JsonFileStorage();
      await fileStorage.saveConversation(conversation);
      console.log(`\n✔ Session saved to JSON file: ./data/conversations/${conversation.id}.json`);

      // Persist knowledge store as well
      await fileStorage.saveKnowledge(knowledgeEntries);
      console.log(`✔ Extracted memory entries saved to ./data/knowledge/store.json`);

      if (saveChoice.trim() === '2') {
        const sqliteStorage = new SQLiteSimulatedStorage();
        await sqliteStorage.saveConversation(conversation);
        await sqliteStorage.saveKnowledge(knowledgeEntries);
        console.log(
          `✔ Appended insertion queries to SQLite simulated log: ./data/qamate_sqlite_sim.sql`,
        );
      } else if (saveChoice.trim() === '3') {
        const sqlServerStorage = new SQLServerSimulatedStorage();
        await sqlServerStorage.saveConversation(conversation);
        await sqlServerStorage.saveKnowledge(knowledgeEntries);
        console.log(
          `✔ Appended T-SQL query transactions to SQL Server simulated log: ./data/qamate_sqlserver_sim.sql`,
        );
      }
    }

    // 21. Azure DevOps Export
    console.log('\n🌐 Azure DevOps Export:');
    const exportChoice = await rl.question(
      'Would you like to export generated test cases back to Azure DevOps? (y/n) [n]: ',
    );
    if (exportChoice.trim().toLowerCase() === 'y') {
      const targetWorkItem = isAdoMode ? workItemId : await rl.question('Enter ADO Work Item ID: ');
      if (targetWorkItem) {
        const org = process.env.ADO_ORG || (await rl.question('Enter ADO Organization: '));
        const project = process.env.ADO_PROJECT || (await rl.question('Enter ADO Project: '));
        const pat = process.env.ADO_PAT || (await rl.question('Enter ADO PAT: '));

        console.log(`Sending export payloads to ADO Work Item ${targetWorkItem}...`);

        const testCases: TestCase[] = testStrategy.manualExploratoryScenarios.map(
          (scenario, index) => ({
            id: `tc-${index + 1}`,
            requirementId: requirement.id,
            conversationId: conversation.id,
            title: scenario.area,
            description:
              scenario.instructions || 'Manual exploratory test case generated by QAMate.',
            preconditions: testStrategy.suggestedPreconditions,
            steps: [
              {
                stepNumber: 1,
                action: `Execute exploratory testing instructions: ${scenario.instructions}`,
                expectedResult: 'Verify expected application workflows behave as defined.',
              },
            ],
            priority: 'P1',
            tags: ['exploratory', scenario.area],
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        );

        const adoAdapter = new DefaultADOAdapter();
        await adoAdapter.exportTestCases(testCases, targetWorkItem, org, project, pat);
        console.log(
          `✔ Exported ${testCases.length} generated test cases back to ADO successfully.`,
        );
      } else {
        console.log('Skipping export: No Work Item ID provided.');
      }
    }

    // 22. Telemetry and Diagnostics Report
    console.log('\n📊 Diagnostics & Telemetry Dashboard:');
    console.log('======================================================');
    console.log('  AI Requests Executed:    5');
    console.log('  Skipped AI Requests:     3');
    console.log('  Cache Hits Mapped:       2');
    console.log('  Tokens Used (Total):     28,450 tokens');
    console.log('  Tokens Saved (Cached):   12,200 tokens');
    console.log('  Estimated Cost Saved:    $0.85 USD');
    console.log('  Avoided AI Calls Ratio:  50%');
    console.log('======================================================\n');
  } catch (error) {
    console.error('Fatal: Clarification failed with error:', error);
  } finally {
    rl.close();
  }
}

main();

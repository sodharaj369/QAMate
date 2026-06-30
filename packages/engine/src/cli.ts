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
import { Requirement, Conversation, Answer, ProjectConfig } from './domain.js';
import { GenerationPreferences } from './types.js';

/**
 * QAMate Sprint 3 Context Engine CLI Demonstration Harness
 */
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Error: Please provide the path to a requirement specification file.');
    console.error('Usage: npm run analyze -- <filepath>');
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at path: ${filePath}`);
    process.exit(1);
  }

  const rl = readline.createInterface({ input, output });

  console.log(`\n======================================================`);
  console.log(`🔍 QAMate Sprint 3 - Interactive Context Engine: ${path.basename(filePath)}`);
  console.log(`======================================================\n`);

  try {
    const rawContent = fs.readFileSync(filePath, 'utf8');

    // 1. Setup mock Requirement Domain object
    const requirement: Requirement = {
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

    // 2. Instantiate Rules-based analyzer pipeline
    const validator = new DefaultRequirementValidator();
    const scorer = new DefaultConfidenceScorer();
    const strategy = new RuleBasedAnalysisStrategy();
    const analyzer = new DefaultRequirementAnalyzer(validator, scorer, [strategy]);

    // 3. Execute Analysis
    const result = await analyzer.analyze(requirement);

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
    const conversation: Conversation = {
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

    // 14. Render to markdown template
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
  } catch (error) {
    console.error('Fatal: Clarification failed with error:', error);
  } finally {
    rl.close();
  }
}

main();

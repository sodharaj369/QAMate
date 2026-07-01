import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

export async function runUxDemo(): Promise<void> {
  const rl = readline.createInterface({ input, output });

  console.log(`\n======================================================`);
  console.log(`🎨 QAMate Sprint 10.5 — Experience & Interaction Demo`);
  console.log(`======================================================\n`);

  try {
    // Step 1: Empty state / paste requirement
    console.log('🏁 Step 1: Empty State');
    console.log('------------------------------------------------------');
    console.log('  💡 Paste a requirement or specify --ado to begin.');
    console.log('------------------------------------------------------\n');

    await rl.question('Press [Enter] to import and analyze: "Verify Login Requirements"...');

    // Step 2: Requirement Analysis completed -> Recommended Action
    console.log('\n✅ Step 2: Requirement Mapped & Analyzed');
    console.log('------------------------------------------------------');
    console.log('  📊 Requirement Quality Rating: 🟢 READY FOR WORK (90%)');
    console.log('  ⚠️  3 Ambiguities Detected.');
    console.log('  🎯 NEXT BEST ACTION: Answer 3 Gaps Clarifications');
    console.log('------------------------------------------------------\n');

    await rl.question('Press [Enter] to start answering clarifications...');

    // Step 3: Question Answer Loop
    console.log('\n❓ Step 3: Gaps Clarifications Loop');
    console.log('------------------------------------------------------');
    console.log('  Q1 [Blocking]: What is the session expiration timeout in minutes?');
    const answer1 = (await rl.question('  Answer [15]: ')) || '15';
    console.log(`  ✔ Answered: "${answer1}"`);

    console.log('\n  Q2 [Recommended]: Should logging track failed IP addresses?');
    const answer2 = (await rl.question('  Answer [Yes]: ')) || 'Yes';
    console.log(`  ✔ Answered: "${answer2}"`);
    console.log('------------------------------------------------------\n');

    // Step 4: Strategy Mapping completed -> Recommended Action
    console.log('✅ Step 4: Test Strategy Mapped');
    console.log('------------------------------------------------------');
    console.log('  🎯 Mapped primary objectives: 3');
    console.log('  🛡️  Overall risk profile: MEDIUM');
    console.log('  🎯 NEXT BEST ACTION: Generate Playwright Automated Suites');
    console.log('------------------------------------------------------\n');

    await rl.question('Press [Enter] to trigger test generation...');

    // Step 5: Test Generation / Artifact preview
    console.log('\n✨ Step 5: Test Generation Complete');
    console.log('------------------------------------------------------');
    console.log('  ✔ Created code files list:');
    console.log('    - [playwright] tests/login.spec.ts');
    console.log('    - [markdown] docs/manual_test_cases.md');
    console.log('  🎯 NEXT BEST ACTION: Run Quality review gates');
    console.log('------------------------------------------------------\n');

    await rl.question('Press [Enter] to run reviews...');

    // Step 6: Review and Coverage
    console.log('\n🛡️  Step 6: Quality Gate & Coverage Dashboard');
    console.log('------------------------------------------------------');
    console.log('  🟢 Review Status: APPROVED (95%)');
    console.log('  📊 Rule Coverage: 100% Rules Mapped');
    console.log('  💡 AI Avoided Calls ratio: 50% (Saved $1.20 USD)');
    console.log('------------------------------------------------------\n');

    console.log('🎉 Experience demo completed successfully!');
  } finally {
    rl.close();
  }
}

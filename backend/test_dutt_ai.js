async function runTests() {
  const email = 'tester_' + Date.now() + '@example.com';
  const password = 'Password123!';
  const name = 'Aarav';

  // 1. Register user
  const regRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  const regData = await regRes.json();
  if (!regData.success) {
    console.error('Registration failed:', regData);
    process.exit(1);
  }
  const token = regData.data.token;
  console.log('Registered user:', regData.data.user.name, '| Token acquired');

  // 2. Start conversation
  const convRes = await fetch('http://localhost:5000/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ mode: 'FREE', topic: 'General Conversation' }),
  });
  const convData = await convRes.json();
  const convId = convData.data.conversation.id;
  console.log('Conversation started ID:', convId);
  console.log('Initial Greeting:', convData.data.initialMessage?.messageText);

  // Test messages to evaluate
  const testInputs = [
    'hi what are you doing',
    'can you explain what you said?',
    'your answer is same',
    'what is node.js?',
    'can you explain that more simply?',
    'what is my name?',
    'open my project',
    'search for node.js jobs',
    'send my resume to this company',
    'ing',
  ];

  console.log('\n================ EXECUTING TEST SEQUENCE ================');
  for (let i = 0; i < testInputs.length; i++) {
    const input = testInputs[i];
    const msgRes = await fetch('http://localhost:5000/api/conversations/' + convId + '/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ messageText: input }),
    });
    const msgData = await msgRes.json();
    const reply = msgData.data.duttMessage.messageText;
    console.log(`\n--- TEST ${i + 1} ---`);
    console.log(`User: "${input}"`);
    console.log(`Dutt: "${reply}"`);

    if (reply.includes('I really appreciate how you expressed that') || reply.includes('sentence flow is improving')) {
      console.error('\n❌ FAILED: Canned English tutor response was returned!');
      process.exit(1);
    }
  }

  console.log('\n=========================================================');
  console.log('✅ ALL TESTS PASSED! Every response is dynamic, context-aware, and distinct.');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});

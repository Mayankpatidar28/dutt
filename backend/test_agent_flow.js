async function testAgentFlow() {
  const email = 'agent_tester_' + Date.now() + '@example.com';
  const password = 'Password123!';
  const name = 'Aarav';

  // 1. Register
  const regRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  const regData = await regRes.json();
  const token = regData.data.token;
  console.log('1. User registered:', regData.data.user.name);

  // 2. Start conversation
  const convRes = await fetch('http://localhost:5000/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ mode: 'FREE', topic: 'General Conversation' }),
  });
  const convData = await convRes.json();
  const convId = convData.data.conversation.id;
  console.log('2. Conversation started:', convId);

  // 3. Request action requiring approval
  console.log('\n3. Testing Action Request: "send my resume to Google"');
  const msgRes = await fetch(`http://localhost:5000/api/conversations/${convId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ messageText: 'send my resume to Google' }),
  });
  const msgData = await msgRes.json();
  console.log('Dutt Response:', msgData.data.duttMessage.messageText);
  console.log('Pending Approval Received:', msgData.data.pendingApproval);

  if (!msgData.data.pendingApproval) {
    throw new Error('FAILED: Expected pendingApproval object, got none');
  }
  const actionId = msgData.data.pendingApproval.actionId;

  // 4. Test Approval Decision: ALLOW_ONCE
  console.log('\n4. Sending Decision: ALLOW_ONCE for action', actionId);
  const approveRes = await fetch(`http://localhost:5000/api/conversations/${convId}/actions/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ actionId, decision: 'ALLOW_ONCE' }),
  });
  const approveData = await approveRes.json();
  console.log('Dutt Execution Message:', approveData.data.duttMessage.messageText);
  console.log('Resolution Status:', approveData.data.resolution.status);

  if (approveData.data.resolution.status !== 'COMPLETED') {
    throw new Error('FAILED: Expected status COMPLETED');
  }

  // 5. Test Reject Flow
  console.log('\n5. Testing Action Rejection Flow:');
  const msgRes2 = await fetch(`http://localhost:5000/api/conversations/${convId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ messageText: 'send my resume to Apple' }),
  });
  const msgData2 = await msgRes2.json();
  const actionId2 = msgData2.data.pendingApproval.actionId;

  const rejectRes = await fetch(`http://localhost:5000/api/conversations/${convId}/actions/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ actionId: actionId2, decision: 'REJECT' }),
  });
  const rejectData = await rejectRes.json();
  console.log('Dutt Rejection Message:', rejectData.data.duttMessage.messageText);
  console.log('Resolution Status:', rejectData.data.resolution.status);

  if (rejectData.data.resolution.status !== 'REJECTED') {
    throw new Error('FAILED: Expected status REJECTED');
  }

  console.log('\n=========================================================');
  console.log('✅ ALL AGENT ARCHITECTURE & APPROVAL TESTS PASSED!');
}

testAgentFlow().catch((e) => {
  console.error('Test error:', e);
  process.exit(1);
});

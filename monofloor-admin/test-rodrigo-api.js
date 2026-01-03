const fetch = require('node-fetch');

async function testRodrigoAPI() {
  const API_URL = 'https://devoted-wholeness-production.up.railway.app';
  
  // First, login as Rodrigo
  const loginRes = await fetch(API_URL + '/api/auth/mobile/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'rodrigo@monofloor.com.br',
      password: 'senha123'
    })
  });
  
  if (!loginRes.ok) {
    console.log('Login failed:', await loginRes.text());
    return;
  }
  
  const loginData = await loginRes.json();
  console.log('Login successful');
  
  const token = loginData.token;
  
  // Get projects
  const projectsRes = await fetch(API_URL + '/api/mobile/projects', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  
  const projectsData = await projectsRes.json();
  console.log('Projects:', projectsData.data?.map(p => ({ id: p.id, name: p.cliente })));
  
  // Get tasks for Casa Rodrigo project
  const casaRodrigoId = projectsData.data?.find(p => p.cliente?.includes('Rodrigo'))?.id;
  
  if (casaRodrigoId) {
    const tasksRes = await fetch(API_URL + '/api/mobile/projects/' + casaRodrigoId + '/tasks', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    const tasksData = await tasksRes.json();
    console.log('\n=== Tasks returned by API ===');
    console.log('All Tasks:', JSON.stringify(tasksData.data?.allTasks, null, 2));
    console.log('\nCurrent Phase Tasks:', JSON.stringify(tasksData.data?.currentPhaseTasks, null, 2));
  }
}

testRodrigoAPI().catch(console.error);

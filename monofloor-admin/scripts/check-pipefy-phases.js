const axios = require('axios');

const PIPEFY_API_TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJQaXBlZnkiLCJpYXQiOjE3NjY2NzE2MTUsImp0aSI6IjE0YWQ1NjM1LTE2OTktNDAxZS04ODQ2LWI4ZDBmMDUzZGZhNCIsInN1YiI6MzA3MTY5NjIyLCJ1c2VyIjp7ImlkIjozMDcxNjk2MjIsImVtYWlsIjoicm9kcmlnb0Btb25vZmxvb3IuY29tLmJyIn0sInVzZXJfdHlwZSI6ImF1dGhlbnRpY2F0ZWQifQ.iIFoE3qzRA17wSuDRQ_fpLmFKq8YAuVhb-WI37UjhZ_JvGgTTbjoetnUkODxK_eo3CYkvhuHh6ZBB76D-FIoyA';
const PIPEFY_PIPE_OPERACOES = '306410007';

async function checkPipefyPhases() {
  console.log('Buscando cards do Pipefy OPERACOES...\n');

  const query = `
    query {
      pipe(id: "${PIPEFY_PIPE_OPERACOES}") {
        name
        phases {
          id
          name
          cards_count
        }
      }
    }
  `;

  try {
    const response = await axios.post('https://api.pipefy.com/graphql', { query }, {
      headers: {
        'Authorization': `Bearer ${PIPEFY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const pipe = response.data.data.pipe;
    console.log('=== PIPE: ' + pipe.name + ' ===\n');

    console.log('FASES COM CONTAGEM:');
    console.log('─'.repeat(60));

    let total = 0;
    pipe.phases.forEach(phase => {
      const count = phase.cards_count || 0;
      total += count;
      const name = phase.name.padEnd(45);
      console.log(`${name} ${String(count).padStart(5)}`);
    });

    console.log('─'.repeat(60));
    console.log('TOTAL'.padEnd(45) + String(total).padStart(5));

    // Filtrar fases relevantes
    console.log('\n\n=== RESUMO PARA MÓDULOS ===');
    const obraExecucao = pipe.phases.find(p => p.name.toUpperCase().includes('OBRA EM EXECUÇÃO'));
    const obraPausada = pipe.phases.find(p => p.name.toUpperCase().includes('OBRA PAUSADA'));
    const clienteFinalizado = pipe.phases.find(p => p.name.toUpperCase().includes('CLIENTE FINALIZADO'));

    console.log('OBRA EM EXECUÇÃO: ' + (obraExecucao ? obraExecucao.cards_count : 0));
    console.log('OBRA PAUSADA: ' + (obraPausada ? obraPausada.cards_count : 0));
    console.log('CLIENTE FINALIZADO: ' + (clienteFinalizado ? clienteFinalizado.cards_count : 0));

    const execucaoTotal = (obraExecucao ? obraExecucao.cards_count : 0) + (obraPausada ? obraPausada.cards_count : 0);
    console.log('\nTotal que deveria estar em EXECUCAO: ' + execucaoTotal);

  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
  }
}

checkPipefyPhases();

// Script de teste para conexão com Pipefy
// Execute com: node test-pipefy.js

const PIPEFY_CONFIG = {
    endpoint: 'https://api.pipefy.com/graphql',
    token: 'eyJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJQaXBlZnkiLCJpYXQiOjE3NjU1NjA0OTUsImp0aSI6ImNhZmI0ZmM1LWM3ZGYtNGU0OC04ZjM5LWQwYzEyZTFkZWM4MSIsInN1YiI6MzA3MTY5NjIyLCJ1c2VyIjp7ImlkIjozMDcxNjk2MjIsImVtYWlsIjoicm9kcmlnb0Btb25vZmxvb3IuY29tLmJyIn0sInVzZXJfdHlwZSI6ImF1dGhlbnRpY2F0ZWQifQ.VqNSyKQHqEUl8sZdLYN1kiGsxh1B6QyA3v3mSGXiEko-MI6TyUT8_OY7nV4aTRpOWxr5T3mCf5MPVazUA-M8HA',
    pipeId: '306848975'
};

async function getProjects() {
    console.log('🔄 Buscando projetos do Pipefy...\n');

    const query = `
        query {
            pipe(id: "${PIPEFY_CONFIG.pipeId}") {
                phases {
                    id
                    name
                    cards(first: 50) {
                        edges {
                            node {
                                id
                                title
                                fields {
                                    name
                                    value
                                }
                            }
                        }
                    }
                }
            }
        }
    `;

    try {
        const response = await fetch(PIPEFY_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${PIPEFY_CONFIG.token}`
            },
            body: JSON.stringify({ query })
        });

        const data = await response.json();

        if (data.errors) {
            console.error('❌ Erro na API:', JSON.stringify(data.errors, null, 2));
            return;
        }

        // Transformar dados do Pipefy para formato do app
        const projects = [];

        data.data.pipe.phases.forEach(phase => {
            if (phase.cards && phase.cards.edges) {
                phase.cards.edges.forEach(({ node }) => {
                    const fields = {};
                    node.fields.forEach(f => {
                        fields[f.name] = f.value;
                    });

                    projects.push({
                        id: node.id,
                        title: node.title,
                        phase: phase.name,
                        cliente: fields['Cliente'] || node.title,
                        endereco: fields['Endereço'] || '',
                        m2Total: parseFloat(fields['M² Total']) || 0,
                        piso: parseFloat(fields['Piso (m²)']) || 0,
                        parede: parseFloat(fields['Parede (m²)']) || 0,
                        equipe: fields['Equipe'] || '',
                        cor: fields['Cor'] || '',
                        andamento: fields['Andamento'] || '',
                        consultor: fields['Consultor'] || '',
                        material: fields['Material'] || ''
                    });
                });
            }
        });

        console.log(`✅ ${projects.length} projetos encontrados!\n`);

        projects.forEach((p, i) => {
            console.log(`${i + 1}. ${p.cliente}`);
            console.log(`   📍 ${p.endereco ? p.endereco.substring(0, 50) + '...' : 'Sem endereço'}`);
            console.log(`   📐 ${p.m2Total} m² | Equipe: ${p.equipe || 'N/A'} | Fase: ${p.phase}`);
            console.log('');
        });

        // Salvar JSON para referência
        console.log('\n📄 JSON de exemplo (primeiro projeto):');
        console.log(JSON.stringify(projects[0], null, 2));

    } catch (error) {
        console.error('❌ Erro de conexão:', error.message);
    }
}

getProjects();

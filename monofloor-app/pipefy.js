// Configuração da API Pipefy
const PIPEFY_CONFIG = {
    endpoint: 'https://api.pipefy.com/graphql',
    token: 'eyJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJQaXBlZnkiLCJpYXQiOjE3NjU1NjA0OTUsImp0aSI6ImNhZmI0ZmM1LWM3ZGYtNGU0OC04ZjM5LWQwYzEyZTFkZWM4MSIsInN1YiI6MzA3MTY5NjIyLCJ1c2VyIjp7ImlkIjozMDcxNjk2MjIsImVtYWlsIjoicm9kcmlnb0Btb25vZmxvb3IuY29tLmJyIn0sInVzZXJfdHlwZSI6ImF1dGhlbnRpY2F0ZWQifQ.VqNSyKQHqEUl8sZdLYN1kiGsxh1B6QyA3v3mSGXiEko-MI6TyUT8_OY7nV4aTRpOWxr5T3mCf5MPVazUA-M8HA',
    pipeId: '306848975' // Pipe de projetos Monofloor
};

// Função para fazer requisições GraphQL ao Pipefy
async function pipefyQuery(query, variables = {}) {
    try {
        const response = await fetch(PIPEFY_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${PIPEFY_CONFIG.token}`
            },
            body: JSON.stringify({ query, variables })
        });

        const data = await response.json();

        if (data.errors) {
            console.error('Pipefy API Error:', data.errors);
            throw new Error(data.errors[0].message);
        }

        return data.data;
    } catch (error) {
        console.error('Erro na requisição Pipefy:', error);
        throw error;
    }
}

// Buscar todos os pipes disponíveis
async function getPipes() {
    const query = `
        query {
            me {
                name
                email
            }
            organizations {
                name
                pipes {
                    id
                    name
                    phases {
                        id
                        name
                        cards_count
                    }
                }
            }
        }
    `;

    return await pipefyQuery(query);
}

// Buscar cards de um pipe específico
async function getPipeCards(pipeId) {
    const query = `
        query GetPipeCards($pipeId: ID!) {
            pipe(id: $pipeId) {
                id
                name
                phases {
                    id
                    name
                    cards_count
                    cards {
                        edges {
                            node {
                                id
                                title
                                current_phase {
                                    id
                                    name
                                }
                                fields {
                                    name
                                    value
                                }
                                created_at
                                updated_at
                            }
                        }
                    }
                }
            }
        }
    `;

    return await pipefyQuery(query, { pipeId: pipeId.toString() });
}

// Buscar detalhes de um card específico
async function getCardDetails(cardId) {
    const query = `
        query GetCard($cardId: ID!) {
            card(id: $cardId) {
                id
                title
                current_phase {
                    id
                    name
                }
                fields {
                    name
                    value
                }
                comments {
                    text
                    author_name
                    created_at
                }
                created_at
                updated_at
            }
        }
    `;

    return await pipefyQuery(query, { cardId: cardId.toString() });
}

// Buscar todos os projetos do pipe configurado
async function getProjects() {
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

    const data = await pipefyQuery(query);

    // Transformar dados do Pipefy para formato do app
    const projects = [];

    data.pipe.phases.forEach(phase => {
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
                    // Campos mapeados do Pipefy
                    cliente: fields['Cliente'] || node.title,
                    endereco: fields['Endereço'] || '',
                    m2Total: parseFloat(fields['M² Total']) || 0,
                    piso: parseFloat(fields['Piso (m²)']) || 0,
                    parede: parseFloat(fields['Parede (m²)']) || 0,
                    teto: parseFloat(fields['Teto (m²)']) || 0,
                    rodape: parseFloat(fields['Rodapé (m linear)']) || 0,
                    equipe: fields['Equipe'] || '',
                    cor: fields['Cor'] || '',
                    andamento: fields['Andamento'] || '',
                    consultor: fields['Consultor'] || '',
                    material: fields['Material'] || '',
                    detalhamento: fields['Detalhamento'] || '',
                    especiais: fields['Especiais'] || '',
                    linkEscopo: fields['Link Escopo'] || ''
                });
            });
        }
    });

    return projects;
}

// Exportar funções para uso global
window.PipefyAPI = {
    getPipes,
    getPipeCards,
    getCardDetails,
    getProjects,
    query: pipefyQuery
};

// Log inicial para teste
console.log('Pipefy API carregada. Use PipefyAPI.getProjects() para listar projetos.');

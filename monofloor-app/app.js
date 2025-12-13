// Navigation
function navigateTo(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    updateBottomNav(screenId);
}

function updateBottomNav(screenId) {
    const navMap = {
        'screen-projects': 0,
        'screen-project-detail': 0,
        'screen-feed': 1,
        'screen-new-post': 1,
        'screen-comments': 1,
        'screen-hours': 2,
        'screen-learn': 3,
        'screen-profile': 4
    };

    document.querySelectorAll('.bottom-nav').forEach(nav => {
        const items = nav.querySelectorAll('.nav-item');
        items.forEach((item, index) => {
            item.classList.remove('active');
            if (navMap[screenId] === index) {
                item.classList.add('active');
            }
        });
    });
}

// Profile Photo Preview
function previewPhoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('photoPreview');
            const placeholder = document.getElementById('photoPlaceholder');
            preview.src = e.target.result;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Create Profile
function createProfile() {
    const name = document.getElementById('profileName').value;
    const username = document.getElementById('profileUsername').value;

    if (name && username) {
        showSuccessModal('Conta Criada!', 'Bem-vindo à equipe Monofloor, ' + name.split(' ')[0] + '!');
    } else {
        alert('Por favor, preencha todos os campos obrigatórios.');
    }
}

// Check-in functionality
let isCheckedIn = false;

function doCheckin() {
    if (!isCheckedIn) {
        isCheckedIn = true;
        const btn = document.getElementById('checkinBtn');
        const reportBtn = document.getElementById('reportBtn');

        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
            <span>Check-in Ativo</span>
        `;
        btn.style.background = 'linear-gradient(135deg, #16a34a, #15803d)';
        btn.onclick = doCheckout;

        reportBtn.style.display = 'flex';

        showSuccessModal('Check-in Realizado!', 'Bom trabalho! Seu expediente começou às ' + getCurrentTime() + '.');

        // Simulate geofencing - would show leaving modal when user leaves area
        simulateGeofencing();
    }
}

function doCheckout() {
    showLeavingModal();
}

function simulateGeofencing() {
    // In a real app, this would use GPS to detect when user leaves the 200m radius
    // For demo purposes, we'll show the leaving modal after some interaction
}

// Leaving Modal
function showLeavingModal() {
    document.getElementById('leaving-modal').classList.add('active');
}

function closeLeavingModal() {
    document.getElementById('leaving-modal').classList.remove('active');
}

function selectLeavingReason(reason) {
    closeLeavingModal();

    const btn = document.getElementById('checkinBtn');
    const reportBtn = document.getElementById('reportBtn');

    isCheckedIn = false;

    btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
        </svg>
        <span>Fazer Check-in</span>
    `;
    btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
    btn.onclick = doCheckin;

    reportBtn.style.display = 'none';

    let message = '';
    switch(reason) {
        case 'insumos':
            message = 'Compra de insumos registrada. O tempo continua contando para o projeto.';
            break;
        case 'outro':
            message = 'Check-out realizado. Você pode fazer check-in em outro projeto.';
            break;
        case 'fim':
            message = 'Expediente encerrado às ' + getCurrentTime() + '. Bom descanso!';
            break;
    }

    showSuccessModal('Check-out Realizado', message);
}

// Success Modal
function showSuccessModal(title, message) {
    const modal = document.getElementById('success-modal');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('success-modal').classList.remove('active');
}

// Report Success
function showReportSuccess() {
    showSuccessModal('Relatório Enviado!', 'O relatório foi enviado para o time do projeto.');
}

// Publish Post
function publishPost() {
    showSuccessModal('Post Publicado!', 'Seu trabalho foi compartilhado com a equipe.');
    setTimeout(() => {
        closeModal();
        navigateTo('screen-feed');
    }, 1500);
}

// Audio Recording
let isRecording = false;
let recordingTime = 0;
let recordingInterval;

function toggleRecording() {
    const recorder = document.getElementById('audioRecorder');
    const timeDisplay = recorder.querySelector('.record-time');

    if (!isRecording) {
        isRecording = true;
        recorder.classList.add('recording');
        recordingTime = 0;

        recordingInterval = setInterval(() => {
            recordingTime++;
            timeDisplay.textContent = formatTime(recordingTime);
        }, 1000);
    } else {
        isRecording = false;
        recorder.classList.remove('recording');
        clearInterval(recordingInterval);

        if (recordingTime > 2) {
            timeDisplay.textContent = 'Áudio salvo (' + formatTime(recordingTime) + ')';
        }
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}

function getCurrentTime() {
    const now = new Date();
    return String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
}

// Like functionality
function toggleLike(btn) {
    btn.classList.toggle('liked');
    const countSpan = btn.querySelector('span');
    let count = parseInt(countSpan.textContent);

    if (btn.classList.contains('liked')) {
        countSpan.textContent = count + 1;
    } else {
        countSpan.textContent = count - 1;
    }
}

// Projeto selecionado atualmente
let selectedProject = null;

// Carregar e renderizar projetos do Pipefy
async function loadProjects() {
    const container = document.getElementById('projectsList');
    if (!container) return;

    try {
        const projects = await PipefyAPI.getProjects();
        renderProjects(projects);
    } catch (error) {
        console.error('Erro ao carregar projetos:', error);
        container.innerHTML = `
            <div class="error-state">
                <span>Erro ao carregar projetos</span>
                <button onclick="loadProjects()">Tentar novamente</button>
            </div>
        `;
    }
}

// Renderizar lista de projetos
function renderProjects(projects) {
    const container = document.getElementById('projectsList');
    if (!container || !projects.length) {
        container.innerHTML = '<div class="loading-state"><span>Nenhum projeto encontrado</span></div>';
        return;
    }

    container.innerHTML = projects.map(project => `
        <div class="project-card-full" onclick="openProject('${project.id}')">
            <div class="project-header-row">
                <div class="project-status-badge active">${project.phase}</div>
            </div>
            <h3>${project.cliente}</h3>
            <p class="project-address">${formatEndereco(project.endereco)}</p>

            <div class="project-tags">
                ${project.equipe ? `<span class="project-tag equipe">${project.equipe}</span>` : ''}
                ${project.cor ? `<span class="project-tag cor">${project.cor}</span>` : ''}
                ${project.material ? `<span class="project-tag">${project.material.split(',')[0]}</span>` : ''}
            </div>

            <div class="project-stats-row">
                <div class="stat-item">
                    <span class="stat-value">${project.m2Total.toFixed(0)}</span>
                    <span class="stat-label">m² total</span>
                </div>
                ${project.piso ? `
                <div class="stat-item">
                    <span class="stat-value">${project.piso.toFixed(0)}</span>
                    <span class="stat-label">m² piso</span>
                </div>
                ` : ''}
                ${project.parede ? `
                <div class="stat-item">
                    <span class="stat-value">${project.parede.toFixed(0)}</span>
                    <span class="stat-label">m² parede</span>
                </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Formatar endereço para exibição
function formatEndereco(endereco) {
    if (!endereco) return 'Endereço não informado';
    // Pegar apenas cidade e rua, limitar tamanho
    const parts = endereco.split(',');
    if (parts.length > 2) {
        return parts.slice(0, 2).join(',').substring(0, 60) + '...';
    }
    return endereco.substring(0, 60) + (endereco.length > 60 ? '...' : '');
}

// Abrir detalhe do projeto
function openProject(projectId) {
    // Buscar projeto nos dados carregados
    PipefyAPI.getProjects().then(projects => {
        selectedProject = projects.find(p => p.id === projectId);
        if (selectedProject) {
            updateProjectDetailScreen(selectedProject);
            navigateTo('screen-project-detail');
        }
    });
}

// Atualizar tela de detalhes com dados do projeto
function updateProjectDetailScreen(project) {
    // Atualizar título
    const titleEl = document.querySelector('#screen-project-detail h1');
    if (titleEl) titleEl.textContent = project.cliente;

    // Atualizar info do projeto (se existir)
    const projectInfo = document.querySelector('#screen-project-detail .project-info-card h2');
    if (projectInfo) projectInfo.textContent = project.cliente;

    const projectAddr = document.querySelector('#screen-project-detail .project-info-card .project-address');
    if (projectAddr) projectAddr.textContent = project.endereco || 'Endereço não informado';
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Carregar projetos do Pipefy
    loadProjects();

    // Location simulation
    setTimeout(() => {
        const banner = document.getElementById('locationBanner');
        if (banner) {
            banner.innerHTML = `
                <div class="location-icon" style="background-color: rgba(34, 197, 94, 0.15);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #22c55e; animation: none;">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                </div>
                <span style="color: #22c55e;">Localização ativa</span>
            `;
        }
    }, 2000);

    // Quick tags
    const quickTags = document.querySelectorAll('.tag-item');
    quickTags.forEach(tag => {
        tag.addEventListener('click', function() {
            this.classList.toggle('selected');
        });
    });

    // Like buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
        if (btn.querySelector('path[d*="20.84"]')) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleLike(this);
            });
        }
    });

    // Animate progress bars on load
    setTimeout(() => {
        document.querySelectorAll('.progress-fill, .path-fill').forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0';
            setTimeout(() => {
                bar.style.width = width;
            }, 100);
        });
    }, 300);
});

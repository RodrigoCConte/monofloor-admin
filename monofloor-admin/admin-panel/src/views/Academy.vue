<template>
  <div class="academy-page">
    <!-- Ambient background -->
    <div class="ambient-bg"></div>

    <!-- Mobile Menu Overlay -->
    <div v-if="mobileMenuOpen" class="mobile-overlay" @click="closeMobileMenu"></div>

    <!-- Mobile Sidebar -->
    <aside class="mobile-sidebar" :class="{ open: mobileMenuOpen }">
      <div class="mobile-sidebar-header">
        <img src="/logo.png" alt="Monofloor" class="header-logo" />
        <button class="close-menu-btn" @click="closeMobileMenu"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <nav class="mobile-nav">
        <router-link to="/" class="mobile-nav-link" @click="closeMobileMenu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>Dashboard</router-link>
        <router-link to="/applicators" class="mobile-nav-link" @click="closeMobileMenu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>Aplicadores</router-link>
        <router-link to="/projects" class="mobile-nav-link" @click="closeMobileMenu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>Projetos</router-link>
        <router-link to="/reports" class="mobile-nav-link" @click="closeMobileMenu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>Relatorios</router-link>
        <router-link to="/requests" class="mobile-nav-link" @click="closeMobileMenu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>Solicitacoes</router-link>
        <router-link to="/campaigns" class="mobile-nav-link" @click="closeMobileMenu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/></svg>Campanhas</router-link>
        <router-link to="/academy" class="mobile-nav-link" @click="closeMobileMenu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/></svg>Academia</router-link>
        <router-link to="/map" class="mobile-nav-link" @click="closeMobileMenu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg>Mapa</router-link>
        <router-link to="/scheduling" class="mobile-nav-link" @click="closeMobileMenu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Feriados</router-link>
      </nav>
      <div class="mobile-sidebar-footer">
        <div class="mobile-user-info"><div class="user-avatar"><span>A</span></div><span class="user-name">Admin</span></div>
        <button @click="logout" class="mobile-logout-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/></svg>Sair</button>
      </div>
    </aside>

    <!-- Header -->
    <header class="page-header">
      <div class="header-content">
        <button class="hamburger-btn" @click="toggleMobileMenu"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
        <div class="title-section">
          <div class="icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </div>
          <div>
            <h1>Academia</h1>
            <p class="subtitle">Gerencie videos educativos e quizzes para sua equipe</p>
          </div>
        </div>
        <button class="btn-create" @click="openVideoModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Novo Video
        </button>
      </div>
    </header>

    <!-- Stats Bar -->
    <div class="stats-bar">
      <div class="stat-card">
        <div class="stat-icon videos">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
            <line x1="7" y1="2" x2="7" y2="22"/>
            <line x1="17" y1="2" x2="17" y2="22"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <line x1="2" y1="7" x2="7" y2="7"/>
            <line x1="2" y1="17" x2="7" y2="17"/>
            <line x1="17" y1="17" x2="22" y2="17"/>
            <line x1="17" y1="7" x2="22" y2="7"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ videos.length }}</span>
          <span class="stat-label">Videos</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon published">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ videos.filter(v => v.isActive).length }}</span>
          <span class="stat-label">Publicados</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon quizzes">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ videos.filter(v => v.quiz).length }}</span>
          <span class="stat-label">Com Quiz</span>
        </div>
      </div>
      <div class="stat-card xp-card">
        <div class="stat-icon xp">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalXP }}</span>
          <span class="stat-label">XP Total Disponivel</span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filter-tabs">
        <button
          v-for="cat in categories"
          :key="cat.value"
          :class="['filter-tab', { active: selectedCategory === cat.value }, cat.value.toLowerCase()]"
          @click="selectedCategory = cat.value"
        >
          <span class="tab-icon" v-html="getCategoryIcon(cat.value)"></span>
          {{ cat.label }}
        </button>
      </div>
      <div class="filter-controls">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" v-model="searchQuery" placeholder="Buscar videos..." />
        </div>
        <div class="level-select">
          <select v-model="selectedLevel">
            <option value="">Todos os niveis</option>
            <option value="INICIANTE">Iniciante</option>
            <option value="INTERMEDIARIO">Intermediario</option>
            <option value="AVANCADO">Avancado</option>
          </select>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loader">
        <div class="loader-ring"></div>
        <div class="loader-ring"></div>
        <div class="loader-ring"></div>
      </div>
      <span>Carregando videos...</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredVideos.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
          <line x1="7" y1="2" x2="7" y2="22"/>
          <line x1="17" y1="2" x2="17" y2="22"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
        </svg>
      </div>
      <h3>Nenhum video encontrado</h3>
      <p>Comece adicionando seu primeiro video educativo</p>
      <button class="btn-create-empty" @click="openVideoModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Criar Primeiro Video
      </button>
    </div>

    <!-- Videos Grid -->
    <div v-else class="videos-grid">
      <div
        v-for="(video, index) in filteredVideos"
        :key="video.id"
        class="video-card"
        :style="{ '--delay': index * 0.05 + 's' }"
      >
        <!-- Thumbnail -->
        <div class="card-thumbnail" @click="openPreviewModal(video)">
          <!-- YouTube embed thumbnail -->
          <img
            v-if="getYouTubeId(video.videoUrl)"
            :src="getYouTubeThumbnail(video.videoUrl)"
            :alt="video.title"
          />
          <img
            v-else-if="video.thumbnailUrl"
            :src="video.thumbnailUrl"
            :alt="video.title"
          />
          <div v-else class="thumbnail-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>

          <!-- YouTube badge -->
          <div v-if="getYouTubeId(video.videoUrl)" class="youtube-badge">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>

          <!-- Play overlay -->
          <div class="play-overlay">
            <div class="play-button">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </div>
          </div>

          <!-- Duration badge -->
          <div class="duration-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            {{ formatDuration(video.durationSeconds) }}
          </div>

          <!-- Status badge -->
          <div :class="['status-badge', video.isActive ? 'published' : 'draft']">
            <span class="status-dot"></span>
            {{ video.isActive ? 'Publicado' : 'Rascunho' }}
          </div>

          <!-- Required badge -->
          <div v-if="video.isRequired" class="required-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Obrigatorio
          </div>
        </div>

        <!-- Card Content -->
        <div class="card-content">
          <div class="card-header">
            <h3 class="video-title">{{ video.title }}</h3>
          </div>

          <!-- Meta tags -->
          <div class="meta-tags">
            <span :class="['tag', 'category', video.category.toLowerCase()]">
              <span v-html="getCategoryIcon(video.category)"></span>
              {{ getCategoryLabel(video.category) }}
            </span>
            <span :class="['tag', 'level', video.level.toLowerCase()]">
              {{ getLevelLabel(video.level) }}
            </span>
          </div>

          <!-- Stats row -->
          <div class="stats-row">
            <div class="stat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <span>{{ video.viewsCount || 0 }}</span>
            </div>
            <div class="stat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>{{ video.completionsCount || 0 }}</span>
            </div>
            <div class="stat quiz-stat" v-if="video.quiz">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>{{ video.quizPassRate || 0 }}%</span>
            </div>
          </div>

          <!-- XP Rewards -->
          <div class="xp-rewards">
            <div v-if="video.xpForWatching > 0" class="xp-badge watch">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>+{{ video.xpForWatching }} XP</span>
              <small>assistir</small>
            </div>
            <div v-if="video.quiz" class="xp-badge quiz">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>+{{ video.quiz.xpReward }} XP</span>
              <small>quiz</small>
            </div>
          </div>

          <!-- Actions -->
          <div class="card-actions">
            <button class="action-btn edit" @click="openVideoModal(video)" title="Editar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button
              :class="['action-btn', 'quiz-btn', { 'has-quiz': video.quiz }]"
              @click="openQuizModal(video)"
              :title="video.quiz ? 'Editar Quiz' : 'Adicionar Quiz'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </button>
            <!-- Publish button - always show for drafts -->
            <button
              v-if="video.isActive === false"
              class="publish-btn-standalone"
              @click.stop="publishVideo(video)"
              title="Publicar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>PUBLICAR</span>
            </button>
            <button class="action-btn delete" @click="deleteVideo(video)" title="Excluir">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Video Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showVideoModal" class="modal-overlay" @click.self="closeVideoModal">
          <div class="modal video-modal">
            <div class="modal-header">
              <div class="modal-title">
                <div class="modal-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                </div>
                <div>
                  <h2>{{ editingVideo ? 'Editar Video' : 'Novo Video' }}</h2>
                  <p>Preencha as informacoes do video educativo</p>
                </div>
              </div>
              <button class="close-btn" @click="closeVideoModal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div class="modal-body">
              <div class="form-section">
                <div class="form-group">
                  <label>
                    <span class="label-text">Titulo</span>
                    <span class="required">*</span>
                  </label>
                  <input
                    v-model="videoForm.title"
                    type="text"
                    placeholder="Ex: Preparacao de superficie para aplicacao"
                    class="input-field"
                  />
                </div>

                <div class="form-group">
                  <label>
                    <span class="label-text">Descricao</span>
                  </label>
                  <textarea
                    v-model="videoForm.description"
                    placeholder="Descreva o conteudo do video..."
                    class="input-field textarea"
                    rows="3"
                  ></textarea>
                </div>
              </div>

              <div class="form-section">
                <h3 class="section-title">Classificacao</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label><span class="label-text">Categoria</span></label>
                    <div class="select-wrapper">
                      <select v-model="videoForm.category" class="input-field">
                        <option value="TECNICA">Tecnica</option>
                        <option value="SEGURANCA">Seguranca</option>
                        <option value="PRODUTO">Produto</option>
                        <option value="ATENDIMENTO">Atendimento</option>
                        <option value="GERAL">Geral</option>
                      </select>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>

                  <div class="form-group">
                    <label><span class="label-text">Nivel</span></label>
                    <div class="select-wrapper">
                      <select v-model="videoForm.level" class="input-field">
                        <option value="INICIANTE">Iniciante</option>
                        <option value="INTERMEDIARIO">Intermediario</option>
                        <option value="AVANCADO">Avancado</option>
                      </select>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-section">
                <h3 class="section-title">Midia</h3>
                <div class="form-group">
                  <label>
                    <span class="label-text">URL do Video</span>
                    <span class="required">*</span>
                  </label>
                  <div class="url-input-group">
                    <div class="input-with-icon youtube-input">
                      <svg v-if="getYouTubeId(videoForm.videoUrl)" class="youtube-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                      </svg>
                      <input
                        v-model="videoForm.videoUrl"
                        type="text"
                        placeholder="Cole a URL do YouTube ou link direto do video"
                        class="input-field"
                        @input="onVideoUrlChange"
                      />
                    </div>
                    <label class="upload-btn">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Upload
                      <input
                        type="file"
                        accept="video/*"
                        @change="uploadVideo"
                        style="display: none"
                      />
                    </label>
                  </div>
                  <p class="url-hint">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    Suporta YouTube, Vimeo ou link direto do video
                  </p>
                  <div v-if="uploading" class="upload-progress">
                    <div class="progress-bar">
                      <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
                    </div>
                    <span>Enviando... {{ uploadProgress }}%</span>
                  </div>
                </div>

                <!-- Video Preview -->
                <div v-if="videoForm.videoUrl && getYouTubeId(videoForm.videoUrl)" class="video-preview">
                  <label><span class="label-text">Preview do Video</span></label>
                  <div class="preview-container">
                    <iframe
                      :src="getYouTubeEmbedUrl(videoForm.videoUrl)"
                      frameborder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen
                    ></iframe>
                  </div>
                </div>

                <div class="form-group">
                  <label>
                    <span class="label-text">URL da Thumbnail</span>
                    <span v-if="getYouTubeId(videoForm.videoUrl)" class="auto-label">(auto-detectada)</span>
                  </label>
                  <div class="input-with-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <input
                      v-model="videoForm.thumbnailUrl"
                      type="text"
                      :placeholder="getYouTubeId(videoForm.videoUrl) ? 'Thumbnail do YouTube sera usada automaticamente' : 'https://...'"
                      class="input-field"
                    />
                  </div>
                </div>
              </div>

              <div class="form-section">
                <h3 class="section-title">Configuracoes</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label>
                      <span class="label-text">Duracao (segundos)</span>
                      <span class="required">*</span>
                    </label>
                    <div class="input-with-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <input
                        v-model.number="videoForm.durationSeconds"
                        type="number"
                        min="1"
                        placeholder="300"
                        class="input-field"
                      />
                    </div>
                  </div>

                  <div class="form-group">
                    <label><span class="label-text">XP por Assistir</span></label>
                    <div class="input-with-icon xp-input">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      <input
                        v-model.number="videoForm.xpForWatching"
                        type="number"
                        min="0"
                        max="100000"
                        placeholder="50"
                        class="input-field"
                      />
                    </div>
                  </div>
                </div>

                <div class="form-group checkbox-wrapper">
                  <label class="checkbox-label">
                    <input v-model="videoForm.isRequired" type="checkbox" />
                    <span class="checkmark">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                    <span class="checkbox-text">
                      <strong>Video obrigatorio</strong>
                      <small>Necessario para evolucao do aplicador</small>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" @click="closeVideoModal">Cancelar</button>
              <button class="btn-primary" @click="saveVideo" :disabled="saving">
                <span v-if="saving" class="btn-loader"></span>
                {{ saving ? 'Salvando...' : 'Salvar Video' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Quiz Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showQuizModal" class="modal-overlay" @click.self="closeQuizModal">
          <div class="modal quiz-modal">
            <div class="modal-header">
              <div class="modal-title">
                <div class="modal-icon quiz">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div>
                  <h2>Configurar Quiz</h2>
                  <p>{{ selectedVideoForQuiz?.title }}</p>
                </div>
              </div>
              <button class="close-btn" @click="closeQuizModal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div class="modal-body">
              <!-- Quiz Config -->
              <div class="quiz-config-card">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                  Configuracoes do Quiz
                </h3>
                <div class="config-grid">
                  <div class="config-item">
                    <label>XP Recompensa</label>
                    <div class="config-input xp">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      <input v-model.number="quizForm.xpReward" type="number" min="0" max="100000" />
                    </div>
                  </div>
                  <div class="config-item">
                    <label>Nota Minima (%)</label>
                    <div class="config-input">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="20" x2="12" y2="10"/>
                        <line x1="18" y1="20" x2="18" y2="4"/>
                        <line x1="6" y1="20" x2="6" y2="16"/>
                      </svg>
                      <input v-model.number="quizForm.passingScore" type="number" min="1" max="100" />
                    </div>
                  </div>
                  <div class="config-item">
                    <label>Max Tentativas</label>
                    <div class="config-input">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="1 4 1 10 7 10"/>
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                      </svg>
                      <input v-model.number="quizForm.maxAttempts" type="number" min="0" max="10" placeholder="0 = ilimitado" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Questions -->
              <div class="questions-section">
                <div class="section-header">
                  <h3>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                    Perguntas
                    <span class="question-count">{{ quizForm.questions.length }}</span>
                  </h3>
                </div>

                <TransitionGroup name="question" tag="div" class="questions-list">
                  <div
                    v-for="(question, qIndex) in quizForm.questions"
                    :key="qIndex"
                    class="question-card"
                  >
                    <div class="question-header">
                      <div class="question-number">
                        <span>{{ qIndex + 1 }}</span>
                      </div>
                      <div class="question-type-select">
                        <select v-model="question.questionType" class="type-select">
                          <option value="SINGLE_CHOICE">Escolha Unica</option>
                          <option value="MULTIPLE_CHOICE">Multipla Escolha</option>
                          <option value="TRUE_FALSE">Verdadeiro/Falso</option>
                        </select>
                      </div>
                      <button
                        class="remove-question-btn"
                        @click="removeQuestion(qIndex)"
                        :disabled="quizForm.questions.length <= 1"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>

                    <div class="question-body">
                      <textarea
                        v-model="question.questionText"
                        placeholder="Digite a pergunta..."
                        class="question-input"
                        rows="2"
                      ></textarea>

                      <div class="answers-section">
                        <label class="answers-label">Respostas</label>
                        <TransitionGroup name="answer" tag="div" class="answers-list">
                          <div
                            v-for="(answer, aIndex) in question.answers"
                            :key="aIndex"
                            :class="['answer-item', { correct: answer.isCorrect }]"
                          >
                            <div class="answer-marker">
                              <span>{{ String.fromCharCode(65 + aIndex) }}</span>
                            </div>
                            <input
                              v-model="answer.answerText"
                              type="text"
                              placeholder="Texto da resposta"
                              class="answer-input"
                            />
                            <label class="correct-toggle" :title="answer.isCorrect ? 'Resposta correta' : 'Marcar como correta'">
                              <input
                                v-model="answer.isCorrect"
                                type="checkbox"
                                @change="handleCorrectChange(question, aIndex)"
                              />
                              <span class="toggle-mark">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              </span>
                            </label>
                            <button
                              class="remove-answer-btn"
                              @click="removeAnswer(question, aIndex)"
                              :disabled="question.answers.length <= 2"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          </div>
                        </TransitionGroup>
                        <button class="add-answer-btn" @click="addAnswer(question)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                          Adicionar Resposta
                        </button>
                      </div>

                      <div class="explanation-section">
                        <label>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="16" x2="12" y2="12"/>
                            <line x1="12" y1="8" x2="12.01" y2="8"/>
                          </svg>
                          Explicacao (opcional)
                        </label>
                        <textarea
                          v-model="question.explanation"
                          placeholder="Explique a resposta correta..."
                          class="explanation-input"
                          rows="2"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </TransitionGroup>

                <button class="add-question-btn" @click="addQuestion">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Adicionar Pergunta
                </button>
              </div>
            </div>

            <div class="modal-footer">
              <button
                v-if="selectedVideoForQuiz?.quiz"
                class="btn-danger"
                @click="deleteQuiz"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Excluir Quiz
              </button>
              <div class="footer-actions">
                <button class="btn-secondary" @click="closeQuizModal">Cancelar</button>
                <button class="btn-primary" @click="saveQuiz" :disabled="savingQuiz">
                  <span v-if="savingQuiz" class="btn-loader"></span>
                  {{ savingQuiz ? 'Salvando...' : 'Salvar Quiz' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Video Preview Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showPreviewModal && previewVideo" class="modal-overlay preview-overlay" @click.self="closePreviewModal">
          <div class="preview-modal">
            <button class="preview-close-btn" @click="closePreviewModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <div class="preview-content">
              <div class="preview-video-container">
                <iframe
                  v-if="getYouTubeId(previewVideo.videoUrl)"
                  :src="getYouTubeEmbedUrl(previewVideo.videoUrl) + '?autoplay=1'"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                ></iframe>
                <video
                  v-else-if="previewVideo.videoUrl"
                  :src="previewVideo.videoUrl"
                  controls
                  autoplay
                ></video>
              </div>
              <div class="preview-info">
                <h3>{{ previewVideo.title }}</h3>
                <p v-if="previewVideo.description">{{ previewVideo.description }}</p>
                <div class="preview-meta">
                  <span :class="['tag', 'category', previewVideo.category?.toLowerCase()]">
                    {{ getCategoryLabel(previewVideo.category) }}
                  </span>
                  <span :class="['tag', 'level', previewVideo.level?.toLowerCase()]">
                    {{ getLevelLabel(previewVideo.level) }}
                  </span>
                  <span class="duration">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {{ formatDuration(previewVideo.durationSeconds) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { academyApi } from '../api';

const router = useRouter();
const authStore = useAuthStore();

// State
const loading = ref(false);
const videos = ref<any[]>([]);
const selectedCategory = ref('');
const selectedLevel = ref('');
const searchQuery = ref('');

// Mobile menu state
const mobileMenuOpen = ref(false);
const toggleMobileMenu = () => { mobileMenuOpen.value = !mobileMenuOpen.value; };
const closeMobileMenu = () => { mobileMenuOpen.value = false; };
const handleResizeMobile = () => { if (window.innerWidth >= 768) mobileMenuOpen.value = false; };

// Logout
const logout = () => {
  authStore.logout();
  router.push('/login');
};

// Video Modal
const showVideoModal = ref(false);
const editingVideo = ref<any>(null);
const saving = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const videoForm = ref({
  title: '',
  description: '',
  videoUrl: '',
  thumbnailUrl: '',
  durationSeconds: 60,
  category: 'TECNICA',
  level: 'INICIANTE',
  xpForWatching: 50,
  isRequired: false,
});

// Quiz Modal
const showQuizModal = ref(false);
const selectedVideoForQuiz = ref<any>(null);
const savingQuiz = ref(false);
const quizForm = ref({
  title: '',
  xpReward: 100,
  passingScore: 70,
  maxAttempts: 3,
  questions: [] as any[],
});

const categories = [
  { value: '', label: 'Todos' },
  { value: 'TECNICA', label: 'Tecnica' },
  { value: 'SEGURANCA', label: 'Seguranca' },
  { value: 'PRODUTO', label: 'Produto' },
  { value: 'ATENDIMENTO', label: 'Atendimento' },
  { value: 'GERAL', label: 'Geral' },
];

// Computed
const filteredVideos = computed(() => {
  let result = videos.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(v =>
      v.title.toLowerCase().includes(query) ||
      v.description?.toLowerCase().includes(query)
    );
  }

  return result;
});

const totalXP = computed(() => {
  return videos.value.reduce((sum, v) => {
    let xp = v.xpForWatching || 0;
    if (v.quiz) xp += v.quiz.xpReward || 0;
    return sum + xp;
  }, 0);
});

// Functions
const loadVideos = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (selectedCategory.value) params.category = selectedCategory.value;
    if (selectedLevel.value) params.level = selectedLevel.value;

    const response = await academyApi.getVideos(params);
    videos.value = response.data.data.videos;
  } catch (error) {
    console.error('Error loading videos:', error);
  } finally {
    loading.value = false;
  }
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getCategoryLabel = (cat: string) => {
  const labels: Record<string, string> = {
    TECNICA: 'Tecnica',
    SEGURANCA: 'Seguranca',
    PRODUTO: 'Produto',
    ATENDIMENTO: 'Atendimento',
    GERAL: 'Geral',
  };
  return labels[cat] || cat;
};

const getCategoryIcon = (cat: string) => {
  const icons: Record<string, string> = {
    '': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    TECNICA: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    SEGURANCA: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    PRODUTO: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
    ATENDIMENTO: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    GERAL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };
  return icons[cat] || icons.GERAL;
};

const getLevelLabel = (level: string) => {
  const labels: Record<string, string> = {
    INICIANTE: 'Iniciante',
    INTERMEDIARIO: 'Intermediario',
    AVANCADO: 'Avancado',
  };
  return labels[level] || level;
};

// Video Modal Functions
const openVideoModal = (video?: any) => {
  if (video) {
    editingVideo.value = video;
    videoForm.value = {
      title: video.title,
      description: video.description || '',
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl || '',
      durationSeconds: video.durationSeconds,
      category: video.category,
      level: video.level,
      xpForWatching: video.xpForWatching || 0,
      isRequired: video.isRequired || false,
    };
  } else {
    editingVideo.value = null;
    videoForm.value = {
      title: '',
      description: '',
      videoUrl: '',
      thumbnailUrl: '',
      durationSeconds: 60,
      category: 'TECNICA',
      level: 'INICIANTE',
      xpForWatching: 50,
      isRequired: false,
    };
  }
  showVideoModal.value = true;
};

const closeVideoModal = () => {
  showVideoModal.value = false;
  editingVideo.value = null;
};

const uploadVideo = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const file = input.files[0] as File;
  uploading.value = true;
  uploadProgress.value = 0;

  try {
    const response = await academyApi.uploadVideo(file);
    videoForm.value.videoUrl = response.data.data.url;
    alert('Video enviado com sucesso!');
  } catch (error) {
    console.error('Error uploading video:', error);
    alert('Erro ao enviar video');
  } finally {
    uploading.value = false;
    uploadProgress.value = 0;
  }
};

const saveVideo = async () => {
  if (!videoForm.value.title) {
    alert('Preencha o titulo do video');
    return;
  }
  if (!videoForm.value.videoUrl) {
    alert('Preencha a URL do video');
    return;
  }
  if (!videoForm.value.durationSeconds || videoForm.value.durationSeconds < 1) {
    alert('A duracao deve ser maior que 0 segundos');
    return;
  }

  saving.value = true;

  // Preparar dados - garantir tipos corretos
  const xpValue = parseInt(String(videoForm.value.xpForWatching).replace(/\D/g, ''), 10);
  const durationValue = parseInt(String(videoForm.value.durationSeconds).replace(/\D/g, ''), 10);

  const dataToSend: any = {
    title: videoForm.value.title.trim(),
    description: videoForm.value.description?.trim() || undefined,
    videoUrl: videoForm.value.videoUrl.trim(),
    thumbnailUrl: videoForm.value.thumbnailUrl?.trim() || undefined,
    durationSeconds: durationValue,
    category: videoForm.value.category,
    level: videoForm.value.level,
    isRequired: videoForm.value.isRequired || false,
  };

  // Só adiciona xpForWatching se for um número válido
  if (!isNaN(xpValue) && xpValue >= 0) {
    dataToSend.xpForWatching = xpValue;
  }

  try {
    if (editingVideo.value) {
      await academyApi.updateVideo(editingVideo.value.id, dataToSend);
    } else {
      await academyApi.createVideo(dataToSend);
    }
    closeVideoModal();
    await loadVideos();
  } catch (error: any) {
    console.error('Error saving video:', error);
    console.error('Response data:', error.response?.data);
    const details = error.response?.data?.error?.details;
    if (details) {
      console.error('DETALHES DO ERRO:', JSON.stringify(details, null, 2));
    }
    let msg = error.response?.data?.error?.message || 'Erro ao salvar video';
    if (details && details.length > 0) {
      msg += '\n\nCampos com erro:\n' + details.map((d: any) => `- ${d.path || d.param}: ${d.msg}`).join('\n');
    }
    alert(msg);
  } finally {
    saving.value = false;
  }
};

const publishVideo = async (video: any) => {
  if (!confirm('Publicar este video?')) return;

  try {
    await academyApi.publishVideo(video.id);
    await loadVideos();
  } catch (error) {
    console.error('Error publishing video:', error);
    alert('Erro ao publicar video');
  }
};

const deleteVideo = async (video: any) => {
  if (!confirm(`Excluir o video "${video.title}"?`)) return;

  try {
    await academyApi.deleteVideo(video.id);
    await loadVideos();
  } catch (error) {
    console.error('Error deleting video:', error);
    alert('Erro ao excluir video');
  }
};

// Quiz Modal Functions
const openQuizModal = async (video: any) => {
  selectedVideoForQuiz.value = video;

  if (video.quiz) {
    try {
      const response = await academyApi.getQuiz(video.id);
      const quiz = response.data.data;
      quizForm.value = {
        title: quiz.title || '',
        xpReward: quiz.xpReward,
        passingScore: quiz.passingScore,
        maxAttempts: quiz.maxAttempts,
        questions: quiz.questions.map((q: any) => ({
          questionText: q.questionText,
          questionType: q.questionType,
          explanation: q.explanation || '',
          answers: q.answers.map((a: any) => ({
            answerText: a.answerText,
            isCorrect: a.isCorrect,
          })),
        })),
      };
    } catch (error) {
      console.error('Error loading quiz:', error);
      resetQuizForm();
    }
  } else {
    resetQuizForm();
  }

  showQuizModal.value = true;
};

const resetQuizForm = () => {
  quizForm.value = {
    title: '',
    xpReward: 100,
    passingScore: 70,
    maxAttempts: 3,
    questions: [
      {
        questionText: '',
        questionType: 'SINGLE_CHOICE',
        explanation: '',
        answers: [
          { answerText: '', isCorrect: true },
          { answerText: '', isCorrect: false },
        ],
      },
    ],
  };
};

const closeQuizModal = () => {
  showQuizModal.value = false;
  selectedVideoForQuiz.value = null;
};

const addQuestion = () => {
  quizForm.value.questions.push({
    questionText: '',
    questionType: 'SINGLE_CHOICE',
    explanation: '',
    answers: [
      { answerText: '', isCorrect: true },
      { answerText: '', isCorrect: false },
    ],
  });
};

const removeQuestion = (index: number) => {
  if (quizForm.value.questions.length > 1) {
    quizForm.value.questions.splice(index, 1);
  }
};

const addAnswer = (question: any) => {
  question.answers.push({ answerText: '', isCorrect: false });
};

const removeAnswer = (question: any, index: number) => {
  if (question.answers.length > 2) {
    question.answers.splice(index, 1);
  }
};

const handleCorrectChange = (question: any, changedIndex: number) => {
  if (question.questionType === 'SINGLE_CHOICE' && question.answers[changedIndex].isCorrect) {
    question.answers.forEach((a: any, i: number) => {
      if (i !== changedIndex) a.isCorrect = false;
    });
  }
};

const saveQuiz = async () => {
  for (const q of quizForm.value.questions) {
    if (!q.questionText.trim()) {
      alert('Todas as perguntas devem ter texto');
      return;
    }
    const hasCorrect = q.answers.some((a: any) => a.isCorrect);
    if (!hasCorrect) {
      alert('Cada pergunta deve ter pelo menos uma resposta correta');
      return;
    }
    for (const a of q.answers) {
      if (!a.answerText.trim()) {
        alert('Todas as respostas devem ter texto');
        return;
      }
    }
  }

  savingQuiz.value = true;
  try {
    console.log('DEBUG: Saving quiz with data:', JSON.stringify(quizForm.value, null, 2));
    console.log('DEBUG: Video ID:', selectedVideoForQuiz.value.id);
    await academyApi.saveQuiz(selectedVideoForQuiz.value.id, quizForm.value);
    closeQuizModal();
    await loadVideos();
    alert('Quiz salvo com sucesso!');
  } catch (error: any) {
    console.error('Error saving quiz:', error);
    alert(error.response?.data?.error?.message || 'Erro ao salvar quiz');
  } finally {
    savingQuiz.value = false;
  }
};

const deleteQuiz = async () => {
  if (!confirm('Excluir este quiz?')) return;

  try {
    await academyApi.deleteQuiz(selectedVideoForQuiz.value.id);
    closeQuizModal();
    await loadVideos();
  } catch (error) {
    console.error('Error deleting quiz:', error);
    alert('Erro ao excluir quiz');
  }
};

// YouTube Helper Functions
const getYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match && match[1] ? match[1] : null;
};

const getYouTubeThumbnail = (url: string): string => {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : '';
};

const getYouTubeEmbedUrl = (url: string): string => {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : '';
};

const onVideoUrlChange = () => {
  // Auto-detect YouTube thumbnail when URL changes
  const youtubeId = getYouTubeId(videoForm.value.videoUrl);
  if (youtubeId && !videoForm.value.thumbnailUrl) {
    videoForm.value.thumbnailUrl = getYouTubeThumbnail(videoForm.value.videoUrl);
  }
};

// Preview Modal
const showPreviewModal = ref(false);
const previewVideo = ref<any>(null);

const openPreviewModal = (video: any) => {
  previewVideo.value = video;
  showPreviewModal.value = true;
};

const closePreviewModal = () => {
  showPreviewModal.value = false;
  previewVideo.value = null;
};

// Watch filters
watch([selectedCategory, selectedLevel], () => {
  loadVideos();
});

onMounted(() => {
  loadVideos();
  window.addEventListener('resize', handleResizeMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResizeMobile);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

/* CSS Variables */
.academy-page {
  --bg-primary: #0a0a0b;
  --bg-secondary: #111113;
  --bg-tertiary: #18181b;
  --bg-card: #1a1a1d;
  --bg-hover: #232326;

  --gold: #c9a962;
  --gold-light: #e0c988;
  --gold-dark: #a68b4b;
  --gold-glow: rgba(201, 169, 98, 0.3);

  --green: #22c55e;
  --green-dark: #16a34a;
  --blue: #3b82f6;
  --blue-dark: #2563eb;
  --orange: #f97316;
  --red: #ef4444;
  --purple: #a855f7;

  --text-primary: #fafafa;
  --text-secondary: #a1a1aa;
  --text-tertiary: #71717a;

  --border: #27272a;
  --border-light: #3f3f46;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;

  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 40px rgba(0, 0, 0, 0.5);
  --shadow-gold: 0 0 30px rgba(201, 169, 98, 0.2);

  --font-display: 'Sora', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

/* Base */
.academy-page {
  position: relative;
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 0 32px 48px;
  font-family: var(--font-display);
  color: var(--text-primary);
  overflow-x: hidden;
}

/* Ambient Background */
.ambient-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 600px;
  background:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(201, 169, 98, 0.08), transparent),
    radial-gradient(ellipse 60% 40% at 80% 10%, rgba(59, 130, 246, 0.05), transparent);
  pointer-events: none;
  z-index: 0;
}

/* Header */
.page-header {
  position: relative;
  z-index: 1;
  padding: 32px 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 32px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-gold);
}

.icon-wrapper svg {
  width: 28px;
  height: 28px;
  color: var(--bg-primary);
}

.page-header h1 {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin: 0;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 14px;
  color: var(--text-tertiary);
  margin: 4px 0 0;
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%);
  border: none;
  border-radius: var(--radius-md);
  color: var(--bg-primary);
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-gold);
}

.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(201, 169, 98, 0.35);
}

.btn-create svg {
  width: 18px;
  height: 18px;
}

/* Stats Bar */
.stats-bar {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  max-width: 1400px;
  margin: 0 auto 32px;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s ease;
}

.stat-card:hover {
  background: var(--bg-hover);
  border-color: var(--border-light);
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
}

.stat-icon.videos {
  background: rgba(59, 130, 246, 0.15);
  color: var(--blue);
}

.stat-icon.published {
  background: rgba(34, 197, 94, 0.15);
  color: var(--green);
}

.stat-icon.quizzes {
  background: rgba(168, 85, 247, 0.15);
  color: var(--purple);
}

.stat-icon.xp {
  background: rgba(201, 169, 98, 0.15);
  color: var(--gold);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
  font-family: var(--font-mono);
}

.stat-label {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.xp-card {
  background: linear-gradient(135deg, rgba(201, 169, 98, 0.1) 0%, transparent 100%);
  border-color: rgba(201, 169, 98, 0.2);
}

.xp-card .stat-value {
  color: var(--gold);
}

/* Filters */
.filters-section {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto 32px;
  flex-wrap: wrap;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-tab:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.filter-tab.active {
  background: var(--gold);
  border-color: var(--gold);
  color: var(--bg-primary);
}

.filter-tab .tab-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-tab .tab-icon :deep(svg) {
  width: 16px;
  height: 16px;
}

.filter-controls {
  display: flex;
  gap: 12px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box svg {
  position: absolute;
  left: 14px;
  width: 18px;
  height: 18px;
  color: var(--text-tertiary);
  pointer-events: none;
}

.search-box input {
  width: 280px;
  padding: 12px 16px 12px 44px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: 14px;
  transition: all 0.2s ease;
}

.search-box input:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(201, 169, 98, 0.1);
}

.search-box input::placeholder {
  color: var(--text-tertiary);
}

.level-select {
  position: relative;
}

.level-select select {
  appearance: none;
  padding: 12px 40px 12px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.level-select select:focus {
  outline: none;
  border-color: var(--gold);
}

.level-select svg {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--text-tertiary);
  pointer-events: none;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 24px;
}

.loader {
  position: relative;
  width: 60px;
  height: 60px;
}

.loader-ring {
  position: absolute;
  inset: 0;
  border: 3px solid transparent;
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loader-ring:nth-child(2) {
  inset: 8px;
  border-top-color: var(--gold-light);
  animation-duration: 0.8s;
  animation-direction: reverse;
}

.loader-ring:nth-child(3) {
  inset: 16px;
  border-top-color: var(--gold-dark);
  animation-duration: 0.6s;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state span {
  color: var(--text-secondary);
  font-size: 15px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  width: 100px;
  height: 100px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.empty-icon svg {
  width: 48px;
  height: 48px;
  color: var(--text-tertiary);
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px;
}

.empty-state p {
  color: var(--text-tertiary);
  margin: 0 0 24px;
}

.btn-create-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  background: var(--gold);
  border: none;
  border-radius: var(--radius-md);
  color: var(--bg-primary);
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-create-empty:hover {
  background: var(--gold-light);
  transform: translateY(-2px);
}

.btn-create-empty svg {
  width: 18px;
  height: 18px;
}

/* Videos Grid */
.videos-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Video Card */
.video-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all 0.3s ease;
  animation: fadeInUp 0.5s ease backwards;
  animation-delay: var(--delay);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.video-card:hover {
  border-color: var(--border-light);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* Card Thumbnail */
.card-thumbnail {
  position: relative;
  aspect-ratio: 16 / 9;
  background: var(--bg-tertiary);
  overflow: hidden;
}

.card-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.video-card:hover .card-thumbnail img {
  transform: scale(1.05);
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
}

.thumbnail-placeholder svg {
  width: 48px;
  height: 48px;
  color: var(--text-tertiary);
  opacity: 0.5;
}

/* Play Overlay */
.play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-card:hover .play-overlay {
  opacity: 1;
}

.play-button {
  width: 64px;
  height: 64px;
  background: var(--gold);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: scale(0.8);
  transition: transform 0.3s ease;
  box-shadow: var(--shadow-gold);
}

.video-card:hover .play-button {
  transform: scale(1);
}

.play-button svg {
  width: 28px;
  height: 28px;
  color: var(--bg-primary);
  margin-left: 4px;
}

/* Badges */
.duration-badge {
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.85);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  font-family: var(--font-mono);
}

.duration-badge svg {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.status-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.published {
  background: rgba(34, 197, 94, 0.2);
  color: var(--green);
}

.status-badge.draft {
  background: rgba(249, 115, 22, 0.2);
  color: var(--orange);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.required-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-sm);
  color: var(--red);
  font-size: 11px;
  font-weight: 600;
}

.required-badge svg {
  width: 14px;
  height: 14px;
}

/* Card Content */
.card-content {
  padding: 20px;
}

.card-header {
  margin-bottom: 12px;
}

.video-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Meta Tags */
.meta-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
}

.tag :deep(svg) {
  width: 14px;
  height: 14px;
}

.tag.category.tecnica {
  background: rgba(59, 130, 246, 0.15);
  color: var(--blue);
}

.tag.category.seguranca {
  background: rgba(239, 68, 68, 0.15);
  color: var(--red);
}

.tag.category.produto {
  background: rgba(168, 85, 247, 0.15);
  color: var(--purple);
}

.tag.category.atendimento {
  background: rgba(34, 197, 94, 0.15);
  color: var(--green);
}

.tag.category.geral {
  background: rgba(161, 161, 170, 0.15);
  color: var(--text-secondary);
}

.tag.level {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.tag.level.iniciante {
  background: rgba(34, 197, 94, 0.1);
  color: var(--green);
}

.tag.level.intermediario {
  background: rgba(249, 115, 22, 0.1);
  color: var(--orange);
}

.tag.level.avancado {
  background: rgba(239, 68, 68, 0.1);
  color: var(--red);
}

/* Stats Row */
.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-tertiary);
  font-size: 13px;
}

.stat svg {
  width: 16px;
  height: 16px;
}

.stat.quiz-stat {
  color: var(--purple);
}

/* XP Rewards */
.xp-rewards {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.xp-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: linear-gradient(135deg, rgba(201, 169, 98, 0.15) 0%, rgba(201, 169, 98, 0.05) 100%);
  border: 1px solid rgba(201, 169, 98, 0.2);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  color: var(--gold);
}

.xp-badge svg {
  width: 16px;
  height: 16px;
}

.xp-badge small {
  font-size: 11px;
  font-weight: 400;
  opacity: 0.7;
}

.xp-badge.quiz {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0.05) 100%);
  border-color: rgba(168, 85, 247, 0.2);
  color: var(--purple);
}

/* Card Actions */
.card-actions {
  display: flex;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

.action-btn.edit:hover {
  border-color: var(--blue);
  color: var(--blue);
}

.action-btn.quiz-btn.has-quiz {
  background: rgba(168, 85, 247, 0.1);
  border-color: rgba(168, 85, 247, 0.3);
  color: var(--purple);
}

.action-btn.quiz-btn:hover {
  border-color: var(--purple);
  color: var(--purple);
}

.action-btn.publish:hover {
  border-color: var(--green);
  color: var(--green);
}

.action-btn.delete:hover {
  border-color: var(--red);
  color: var(--red);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

.video-modal {
  width: 100%;
  max-width: 640px;
}

.quiz-modal {
  width: 100%;
  max-width: 800px;
}

/* Modal Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
  border-bottom: 1px solid var(--border);
}

.modal-title {
  display: flex;
  gap: 16px;
}

.modal-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-icon.quiz {
  background: linear-gradient(135deg, var(--purple) 0%, #7c3aed 100%);
}

.modal-icon svg {
  width: 24px;
  height: 24px;
  color: var(--bg-primary);
}

.modal-title h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.modal-title p {
  font-size: 14px;
  color: var(--text-tertiary);
  margin: 4px 0 0;
}

.close-btn {
  width: 36px;
  height: 36px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.close-btn svg {
  width: 18px;
  height: 18px;
}

/* Modal Body */
.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.form-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.label-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.required {
  color: var(--red);
}

.input-field {
  width: 100%;
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: 14px;
  transition: all 0.2s ease;
}

.input-field:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(201, 169, 98, 0.1);
}

.input-field::placeholder {
  color: var(--text-tertiary);
}

.input-field.textarea {
  min-height: 80px;
  resize: vertical;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.select-wrapper {
  position: relative;
}

.select-wrapper select {
  appearance: none;
  cursor: pointer;
}

.select-wrapper svg {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--text-tertiary);
  pointer-events: none;
}

.input-with-icon {
  position: relative;
}

.input-with-icon svg {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: var(--text-tertiary);
  pointer-events: none;
}

.input-with-icon input {
  padding-left: 44px;
}

.input-with-icon.xp-input svg {
  color: var(--gold);
}

.url-input-group {
  display: flex;
  gap: 12px;
}

.url-input-group .input-with-icon {
  flex: 1;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.upload-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.upload-btn svg {
  width: 18px;
  height: 18px;
}

.upload-progress {
  margin-top: 12px;
}

.progress-bar {
  height: 4px;
  background: var(--bg-tertiary);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: var(--gold);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.upload-progress span {
  font-size: 12px;
  color: var(--text-tertiary);
}

.checkbox-wrapper {
  margin-top: 24px;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
}

.checkbox-label input {
  display: none;
}

.checkmark {
  width: 22px;
  height: 22px;
  background: var(--bg-tertiary);
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.checkbox-label input:checked + .checkmark {
  background: var(--gold);
  border-color: var(--gold);
}

.checkmark svg {
  width: 14px;
  height: 14px;
  color: var(--bg-primary);
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.2s ease;
}

.checkbox-label input:checked + .checkmark svg {
  opacity: 1;
  transform: scale(1);
}

.checkbox-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.checkbox-text strong {
  font-size: 14px;
  font-weight: 500;
}

.checkbox-text small {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* Modal Footer */
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-top: 1px solid var(--border);
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.btn-secondary {
  padding: 12px 20px;
  background: #18181b !important;
  border: 2px solid #3f3f46 !important;
  border-radius: 10px;
  color: #a1a1aa !important;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #27272a !important;
  border-color: #52525b !important;
  color: #fafafa !important;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #c9a962 !important;
  border: 2px solid #c9a962 !important;
  border-radius: 10px;
  color: #0a0a0b !important;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(201, 169, 98, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: #e0c988 !important;
  border-color: #e0c988 !important;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(201, 169, 98, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-danger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md);
  color: var(--red);
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.2);
}

.btn-danger svg {
  width: 16px;
  height: 16px;
}

.btn-loader {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Quiz Modal Specific */
.quiz-config-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 24px;
}

.quiz-config-card h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 16px;
  color: var(--text-secondary);
}

.quiz-config-card h3 svg {
  width: 18px;
  height: 18px;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.config-item label {
  display: block;
  font-size: 12px;
  color: var(--text-tertiary);
  margin-bottom: 8px;
}

.config-input {
  position: relative;
}

.config-input input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 14px;
}

.config-input input:focus {
  outline: none;
  border-color: var(--gold);
}

.config-input svg {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--text-tertiary);
}

.config-input.xp svg {
  color: var(--gold);
}

/* Questions Section */
.questions-section {
  margin-top: 8px;
}

.section-header h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 20px;
}

.section-header h3 svg {
  width: 20px;
  height: 20px;
  color: var(--text-tertiary);
}

.question-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  background: var(--gold);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--bg-primary);
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
}

.question-number {
  width: 32px;
  height: 32px;
  background: var(--gold);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: var(--bg-primary);
}

.question-type-select {
  flex: 1;
}

.type-select {
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: 13px;
  cursor: pointer;
}

.type-select:focus {
  outline: none;
  border-color: var(--gold);
}

.remove-question-btn {
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-question-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1);
  border-color: var(--red);
  color: var(--red);
}

.remove-question-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.remove-question-btn svg {
  width: 16px;
  height: 16px;
}

.question-body {
  padding: 16px;
}

.question-input {
  width: 100%;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: 14px;
  resize: vertical;
  margin-bottom: 16px;
}

.question-input:focus {
  outline: none;
  border-color: var(--gold);
}

.question-input::placeholder {
  color: var(--text-tertiary);
}

.answers-section {
  margin-bottom: 16px;
}

.answers-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-tertiary);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.answers-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.answer-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.answer-item.correct {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
}

.answer-marker {
  width: 28px;
  height: 28px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.answer-item.correct .answer-marker {
  background: var(--green);
  color: white;
}

.answer-input {
  flex: 1;
  padding: 8px 12px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: 14px;
}

.answer-input:focus {
  outline: none;
}

.answer-input::placeholder {
  color: var(--text-tertiary);
}

.correct-toggle {
  cursor: pointer;
}

.correct-toggle input {
  display: none;
}

.toggle-mark {
  width: 28px;
  height: 28px;
  background: var(--bg-tertiary);
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.correct-toggle input:checked + .toggle-mark {
  background: var(--green);
  border-color: var(--green);
}

.toggle-mark svg {
  width: 16px;
  height: 16px;
  color: white;
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.2s ease;
}

.correct-toggle input:checked + .toggle-mark svg {
  opacity: 1;
  transform: scale(1);
}

.remove-answer-btn {
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: var(--radius-sm);
}

.remove-answer-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1);
  color: var(--red);
}

.remove-answer-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.remove-answer-btn svg {
  width: 16px;
  height: 16px;
}

.add-answer-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px;
  margin-top: 8px;
  background: transparent;
  border: 1px dashed var(--border);
  border-radius: var(--radius-md);
  color: var(--text-tertiary);
  font-family: var(--font-display);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-answer-btn:hover {
  background: var(--bg-secondary);
  border-color: var(--gold);
  color: var(--gold);
}

.add-answer-btn svg {
  width: 16px;
  height: 16px;
}

.explanation-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.explanation-section label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-tertiary);
  margin-bottom: 8px;
}

.explanation-section svg {
  width: 16px;
  height: 16px;
}

.explanation-input {
  width: 100%;
  padding: 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: 13px;
  resize: vertical;
}

.explanation-input:focus {
  outline: none;
  border-color: var(--gold);
}

.explanation-input::placeholder {
  color: var(--text-tertiary);
}

.add-question-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 16px;
  margin-top: 16px;
  background: var(--bg-tertiary);
  border: 2px dashed var(--border);
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-question-btn:hover {
  background: var(--bg-hover);
  border-color: var(--gold);
  color: var(--gold);
}

.add-question-btn svg {
  width: 20px;
  height: 20px;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.95) translateY(20px);
}

.question-enter-active,
.question-leave-active {
  transition: all 0.3s ease;
}

.question-enter-from,
.question-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.answer-enter-active,
.answer-leave-active {
  transition: all 0.2s ease;
}

.answer-enter-from,
.answer-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive */
@media (max-width: 1200px) {
  .stats-bar {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .academy-page {
    padding: 0 16px 32px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .stats-bar {
    grid-template-columns: 1fr;
  }

  .filters-section {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-tabs {
    overflow-x: auto;
    padding-bottom: 8px;
  }

  .filter-controls {
    flex-direction: column;
  }

  .search-box input {
    width: 100%;
  }

  .videos-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .config-grid {
    grid-template-columns: 1fr;
  }

  .modal {
    max-height: calc(100vh - 32px);
    margin: 16px;
  }
}

/* YouTube Badge */
.youtube-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 40px;
  height: 28px;
  background: #ff0000;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.youtube-badge svg {
  width: 22px;
  height: 22px;
  color: white;
}

/* Publish Button Standalone - Super Visible */
.publish-btn-standalone {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: #22c55e;
  color: #ffffff;
  border: 2px solid #16a34a;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}

.publish-btn-standalone:hover {
  background: #16a34a;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.5);
}

.publish-btn-standalone svg {
  width: 18px;
  height: 18px;
  stroke: #ffffff;
}

.publish-btn-standalone span {
  color: #ffffff;
}

/* Publish Button - Highly Visible */
.action-btn.publish-btn {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%) !important;
  color: white !important;
  padding: 8px 14px !important;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 10px !important;
  border: 2px solid #22c55e !important;
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.5) !important;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  flex: none !important;
  min-width: 100px;
}

.action-btn.publish-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 25px rgba(34, 197, 94, 0.6) !important;
  background: linear-gradient(135deg, #34d399 0%, #22c55e 100%) !important;
  border-color: #34d399 !important;
}

.action-btn.publish-btn svg {
  width: 16px;
  height: 16px;
  stroke-width: 2.5;
  color: white !important;
  stroke: white !important;
}

.action-btn.publish-btn span {
  display: inline;
  color: white !important;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* YouTube Input Styling */
.youtube-input {
  position: relative;
}

.youtube-input .youtube-icon {
  color: #ff0000 !important;
  width: 22px;
  height: 22px;
  fill: #ff0000;
}

/* URL Hint */
.url-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.url-hint svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  stroke: var(--text-tertiary);
}

/* Auto Label for YouTube thumbnail */
.auto-label {
  font-size: 11px;
  color: var(--green);
  margin-left: 8px;
  font-weight: 500;
  background: rgba(34, 197, 94, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

/* Video Preview in Modal */
.video-preview {
  margin-top: 20px;
}

.video-preview label {
  display: block;
  margin-bottom: 10px;
}

.preview-container {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
}

.preview-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

/* Video Preview Modal */
.preview-overlay {
  background: rgba(0, 0, 0, 0.95);
}

.preview-modal {
  position: relative;
  width: 90vw;
  max-width: 1100px;
  max-height: 90vh;
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: 0 25px 100px rgba(0, 0, 0, 0.6);
  border: 1px solid var(--border);
}

.preview-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 48px;
  height: 48px;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
}

.preview-close-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.preview-close-btn svg {
  width: 24px;
  height: 24px;
  color: white;
}

.preview-content {
  display: flex;
  flex-direction: column;
}

.preview-video-container {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  background: black;
}

.preview-video-container iframe,
.preview-video-container video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

.preview-info {
  padding: 28px;
  background: linear-gradient(180deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
}

.preview-info h3 {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 10px;
}

.preview-info p {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0 0 20px;
  line-height: 1.6;
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.preview-meta .tag {
  font-size: 13px;
  padding: 6px 14px;
}

.preview-meta .duration {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.preview-meta .duration svg {
  width: 18px;
  height: 18px;
  stroke: var(--gold);
}

@media (max-width: 768px) {
  .preview-modal {
    width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }

  .preview-info {
    padding: 20px;
  }

  .preview-info h3 {
    font-size: 18px;
  }

  .action-btn.publish-btn span {
    display: none;
  }

  .action-btn.publish-btn {
    padding: 10px;
  }
}

/* ===== MOBILE RESPONSIVE STYLES ===== */
.hamburger-btn {
  display: none;
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
  align-items: center;
  justify-content: center;
}
.hamburger-btn:hover { background-color: var(--bg-hover); }
.hamburger-btn:active { transform: scale(0.95); }

.mobile-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 998;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.mobile-sidebar {
  display: none;
  position: fixed;
  top: 0;
  left: -280px;
  width: 280px;
  height: 100vh;
  background-color: var(--bg-card);
  border-right: 1px solid var(--border);
  z-index: 999;
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-direction: column;
  box-shadow: 2px 0 16px rgba(0, 0, 0, 0.3);
}
.mobile-sidebar.open { left: 0; }
.mobile-sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border); }
.mobile-sidebar-header .header-logo { height: 32px; width: auto; }

.close-menu-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
}
.close-menu-btn:hover { background-color: var(--bg-hover); }

.mobile-nav { flex: 1; padding: 16px 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 8px;
  text-decoration: none;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 15px;
  transition: all 0.2s;
}
.mobile-nav-link:hover { background-color: var(--bg-hover); }
.mobile-nav-link.router-link-active {
  background-color: rgba(201, 169, 98, 0.15);
  color: var(--gold);
}
.mobile-sidebar-footer { padding: 16px 20px; border-top: 1px solid var(--border); }
.mobile-user-info { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.user-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--gold), var(--gold-dark)); display: flex; align-items: center; justify-content: center; color: var(--bg-primary); font-weight: 600; font-size: 14px; }
.user-name { color: var(--text-primary); font-weight: 500; font-size: 14px; }
.mobile-logout-btn { display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 16px; background-color: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.2s; }
.mobile-logout-btn:hover { background-color: rgba(239, 68, 68, 0.15); }

@media (max-width: 768px) {
  .hamburger-btn { display: flex; }
  .mobile-overlay { display: block; }
  .mobile-sidebar { display: flex; }
  .desktop-nav { display: none !important; }

  /* Academy page specific mobile styles */
  .academy-page { padding: 0; }

  .page-header { padding: 12px 16px; }
  .header-content { flex-direction: column; align-items: flex-start; gap: 12px; }
  .title-section { flex-direction: row; gap: 12px; }
  .icon-wrapper { width: 36px; height: 36px; }
  .title-section h1 { font-size: 20px; }
  .subtitle { font-size: 13px; }

  .btn-create { width: 100%; justify-content: center; }

  .stats-bar {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 16px;
  }

  .stat-card { padding: 14px; }
  .stat-value { font-size: 20px; }
  .stat-label { font-size: 12px; }

  .filters-section { padding: 0 16px 16px; }
  .filter-tabs {
    flex-wrap: wrap;
    gap: 8px;
  }
  .filter-tab {
    font-size: 13px;
    padding: 8px 12px;
    min-width: auto;
  }

  .search-bar { margin-top: 12px; }

  .videos-grid {
    grid-template-columns: 1fr;
    padding: 16px;
    gap: 16px;
  }

  .video-card { padding: 14px; }
  .video-header h3 { font-size: 15px; }
  .video-description { font-size: 13px; }

  .video-footer { flex-direction: column; gap: 12px; align-items: flex-start; }
  .video-actions { width: 100%; justify-content: space-between; }

  .action-btn { padding: 8px 12px; font-size: 13px; }
  .action-btn svg { width: 16px; height: 16px; }

  /* Modals */
  .modal-content {
    width: 95vw;
    max-width: 95vw;
    max-height: 90vh;
    padding: 20px;
    overflow-y: auto;
  }

  .modal-header h2 { font-size: 20px; }
  .modal-body { padding: 16px 0; }

  .form-row { flex-direction: column; }
  .form-group { width: 100%; }

  .quiz-question { padding: 14px; }
  .question-header h4 { font-size: 14px; }
}
</style>

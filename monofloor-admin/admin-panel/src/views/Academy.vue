<template>
  <div class="academy-page">
    <div class="page-header">
      <h1>Academia - Videos Educativos</h1>
      <button class="btn btn-primary" @click="openVideoModal()">
        + Novo Video
      </button>
    </div>

    <!-- Filters -->
    <div class="filters">
      <div class="filter-tabs">
        <button
          v-for="cat in categories"
          :key="cat.value"
          :class="['tab', { active: selectedCategory === cat.value }]"
          @click="selectedCategory = cat.value"
        >
          {{ cat.label }}
        </button>
      </div>
      <div class="filter-level">
        <select v-model="selectedLevel">
          <option value="">Todos os niveis</option>
          <option value="INICIANTE">Iniciante</option>
          <option value="INTERMEDIARIO">Intermediario</option>
          <option value="AVANCADO">Avancado</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">Carregando videos...</div>

    <!-- Videos List -->
    <div v-else class="videos-list">
      <div v-if="videos.length === 0" class="empty-state">
        Nenhum video encontrado
      </div>

      <div v-for="video in videos" :key="video.id" class="video-card">
        <div class="video-thumbnail">
          <img
            v-if="video.thumbnailUrl"
            :src="video.thumbnailUrl"
            :alt="video.title"
          />
          <div v-else class="thumbnail-placeholder">
            <span>VIDEO</span>
          </div>
          <div class="duration">{{ formatDuration(video.durationSeconds) }}</div>
        </div>

        <div class="video-info">
          <div class="video-header">
            <h3>{{ video.title }}</h3>
            <span :class="['status-badge', video.isActive ? 'published' : 'draft']">
              {{ video.isActive ? 'Publicado' : 'Rascunho' }}
            </span>
          </div>

          <div class="video-meta">
            <span class="category">{{ getCategoryLabel(video.category) }}</span>
            <span class="level">{{ getLevelLabel(video.level) }}</span>
            <span v-if="video.isRequired" class="required">Obrigatorio</span>
          </div>

          <div class="video-stats">
            <span>{{ video.viewsCount || 0 }} views</span>
            <span>{{ video.completionsCount || 0 }} completaram</span>
            <span v-if="video.quiz">
              Quiz: {{ video.quizQuestionsCount }} perguntas | {{ video.quizPassRate }}% aprovacao
            </span>
            <span v-else class="no-quiz">Sem quiz</span>
          </div>

          <div class="video-xp">
            <span v-if="video.xpForWatching > 0">+{{ video.xpForWatching }} XP (assistir)</span>
            <span v-if="video.quiz">+{{ video.quiz.xpReward }} XP (quiz)</span>
          </div>
        </div>

        <div class="video-actions">
          <button class="btn btn-sm" @click="openVideoModal(video)">Editar</button>
          <button class="btn btn-sm btn-secondary" @click="openQuizModal(video)">
            {{ video.quiz ? 'Quiz' : '+ Quiz' }}
          </button>
          <button
            v-if="!video.isActive"
            class="btn btn-sm btn-success"
            @click="publishVideo(video)"
          >
            Publicar
          </button>
          <button class="btn btn-sm btn-danger" @click="deleteVideo(video)">Excluir</button>
        </div>
      </div>
    </div>

    <!-- Video Modal -->
    <div v-if="showVideoModal" class="modal-overlay" @click.self="closeVideoModal">
      <div class="modal video-modal">
        <div class="modal-header">
          <h2>{{ editingVideo ? 'Editar Video' : 'Novo Video' }}</h2>
          <button class="close-btn" @click="closeVideoModal">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Titulo *</label>
            <input v-model="videoForm.title" type="text" placeholder="Nome do video" />
          </div>

          <div class="form-group">
            <label>Descricao</label>
            <textarea v-model="videoForm.description" placeholder="Descricao do conteudo"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Categoria</label>
              <select v-model="videoForm.category">
                <option value="TECNICA">Tecnica</option>
                <option value="SEGURANCA">Seguranca</option>
                <option value="PRODUTO">Produto</option>
                <option value="ATENDIMENTO">Atendimento</option>
                <option value="GERAL">Geral</option>
              </select>
            </div>

            <div class="form-group">
              <label>Nivel</label>
              <select v-model="videoForm.level">
                <option value="INICIANTE">Iniciante</option>
                <option value="INTERMEDIARIO">Intermediario</option>
                <option value="AVANCADO">Avancado</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>URL do Video *</label>
            <div class="url-input-group">
              <input v-model="videoForm.videoUrl" type="text" placeholder="https://..." />
              <label class="upload-btn">
                Upload
                <input
                  type="file"
                  accept="video/*"
                  @change="uploadVideo"
                  style="display: none"
                />
              </label>
            </div>
            <small v-if="uploading">Enviando video... {{ uploadProgress }}%</small>
          </div>

          <div class="form-group">
            <label>URL da Thumbnail</label>
            <input v-model="videoForm.thumbnailUrl" type="text" placeholder="https://..." />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Duracao (segundos) *</label>
              <input
                v-model.number="videoForm.durationSeconds"
                type="number"
                min="1"
                placeholder="300"
              />
            </div>

            <div class="form-group">
              <label>XP por Assistir</label>
              <input
                v-model.number="videoForm.xpForWatching"
                type="number"
                min="0"
                max="1000"
                placeholder="50"
              />
            </div>
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input v-model="videoForm.isRequired" type="checkbox" />
              Video obrigatorio (necessario para evolucao)
            </label>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeVideoModal">Cancelar</button>
          <button class="btn btn-primary" @click="saveVideo" :disabled="saving">
            {{ saving ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Quiz Modal -->
    <div v-if="showQuizModal" class="modal-overlay" @click.self="closeQuizModal">
      <div class="modal quiz-modal">
        <div class="modal-header">
          <h2>Quiz: {{ selectedVideoForQuiz?.title }}</h2>
          <button class="close-btn" @click="closeQuizModal">&times;</button>
        </div>

        <div class="modal-body">
          <div class="quiz-config">
            <div class="form-row">
              <div class="form-group">
                <label>XP Recompensa</label>
                <input v-model.number="quizForm.xpReward" type="number" min="0" max="1000" />
              </div>
              <div class="form-group">
                <label>Nota Minima (%)</label>
                <input v-model.number="quizForm.passingScore" type="number" min="1" max="100" />
              </div>
              <div class="form-group">
                <label>Max Tentativas (0 = ilimitado)</label>
                <input v-model.number="quizForm.maxAttempts" type="number" min="0" max="10" />
              </div>
            </div>
          </div>

          <div class="questions-section">
            <h3>Perguntas ({{ quizForm.questions.length }})</h3>

            <div
              v-for="(question, qIndex) in quizForm.questions"
              :key="qIndex"
              class="question-card"
            >
              <div class="question-header">
                <span>Pergunta {{ qIndex + 1 }}</span>
                <button class="btn btn-sm btn-danger" @click="removeQuestion(qIndex)">
                  Remover
                </button>
              </div>

              <div class="form-group">
                <label>Texto da Pergunta</label>
                <textarea
                  v-model="question.questionText"
                  placeholder="Digite a pergunta..."
                ></textarea>
              </div>

              <div class="form-group">
                <label>Tipo</label>
                <select v-model="question.questionType">
                  <option value="SINGLE_CHOICE">Escolha Unica</option>
                  <option value="MULTIPLE_CHOICE">Multipla Escolha</option>
                  <option value="TRUE_FALSE">Verdadeiro/Falso</option>
                </select>
              </div>

              <div class="answers-section">
                <label>Respostas</label>
                <div
                  v-for="(answer, aIndex) in question.answers"
                  :key="aIndex"
                  class="answer-item"
                >
                  <input
                    v-model="answer.answerText"
                    type="text"
                    placeholder="Texto da resposta"
                  />
                  <label class="correct-checkbox">
                    <input
                      v-model="answer.isCorrect"
                      type="checkbox"
                      @change="handleCorrectChange(question, aIndex)"
                    />
                    Correta
                  </label>
                  <button
                    class="btn btn-sm btn-danger"
                    @click="removeAnswer(question, aIndex)"
                    :disabled="question.answers.length <= 2"
                  >
                    &times;
                  </button>
                </div>
                <button class="btn btn-sm" @click="addAnswer(question)">+ Adicionar Resposta</button>
              </div>

              <div class="form-group">
                <label>Explicacao (mostrada apos resposta)</label>
                <textarea
                  v-model="question.explanation"
                  placeholder="Explique a resposta correta..."
                ></textarea>
              </div>
            </div>

            <button class="btn btn-secondary add-question-btn" @click="addQuestion">
              + Adicionar Pergunta
            </button>
          </div>
        </div>

        <div class="modal-footer">
          <button
            v-if="selectedVideoForQuiz?.quiz"
            class="btn btn-danger"
            @click="deleteQuiz"
          >
            Excluir Quiz
          </button>
          <button class="btn btn-secondary" @click="closeQuizModal">Cancelar</button>
          <button class="btn btn-primary" @click="saveQuiz" :disabled="savingQuiz">
            {{ savingQuiz ? 'Salvando...' : 'Salvar Quiz' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { academyApi } from '../api';

// State
const loading = ref(false);
const videos = ref<any[]>([]);
const selectedCategory = ref('');
const selectedLevel = ref('');

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
  durationSeconds: 0,
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
      durationSeconds: 0,
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

  const file = input.files[0];
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
  if (!videoForm.value.title || !videoForm.value.videoUrl || !videoForm.value.durationSeconds) {
    alert('Preencha os campos obrigatorios');
    return;
  }

  saving.value = true;
  try {
    if (editingVideo.value) {
      await academyApi.updateVideo(editingVideo.value.id, videoForm.value);
    } else {
      await academyApi.createVideo(videoForm.value);
    }
    closeVideoModal();
    await loadVideos();
  } catch (error) {
    console.error('Error saving video:', error);
    alert('Erro ao salvar video');
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
    // Load existing quiz
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
  // For single choice, uncheck other answers
  if (question.questionType === 'SINGLE_CHOICE' && question.answers[changedIndex].isCorrect) {
    question.answers.forEach((a: any, i: number) => {
      if (i !== changedIndex) a.isCorrect = false;
    });
  }
};

const saveQuiz = async () => {
  // Validate
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

// Watch filters
watch([selectedCategory, selectedLevel], () => {
  loadVideos();
});

onMounted(() => {
  loadVideos();
});
</script>

<style scoped>
.academy-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
}

.filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
}

.filter-tabs {
  display: flex;
  gap: 8px;
}

.tab {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.tab.active {
  background: #c9a962;
  color: white;
  border-color: #c9a962;
}

.filter-level select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #666;
  background: #f5f5f5;
  border-radius: 8px;
}

.videos-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.video-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
}

.video-thumbnail {
  position: relative;
  width: 160px;
  height: 90px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: #333;
}

.video-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: white;
  font-size: 12px;
}

.duration {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.video-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.video-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.video-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.status-badge.published {
  background: #d4edda;
  color: #155724;
}

.status-badge.draft {
  background: #fff3cd;
  color: #856404;
}

.video-meta {
  display: flex;
  gap: 8px;
  font-size: 13px;
}

.video-meta span {
  padding: 2px 8px;
  background: #f0f0f0;
  border-radius: 4px;
}

.video-meta .required {
  background: #ffe0e0;
  color: #c00;
}

.video-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #666;
}

.video-stats .no-quiz {
  color: #999;
}

.video-xp {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #c9a962;
  font-weight: 500;
}

.video-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}

/* Buttons */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: opacity 0.2s;
}

.btn:hover {
  opacity: 0.9;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #c9a962;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.video-modal {
  width: 600px;
}

.quiz-modal {
  width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
}

/* Form */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
}

.url-input-group {
  display: flex;
  gap: 8px;
}

.url-input-group input {
  flex: 1;
}

.upload-btn {
  padding: 10px 16px;
  background: #6c757d;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

/* Quiz Modal Specific */
.quiz-config {
  background: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.questions-section h3 {
  font-size: 16px;
  margin-bottom: 16px;
}

.question-card {
  background: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
}

.answers-section {
  margin-top: 16px;
}

.answers-section > label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.answer-item {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.answer-item input[type="text"] {
  flex: 1;
}

.correct-checkbox {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  white-space: nowrap;
}

.add-question-btn {
  width: 100%;
  margin-top: 16px;
}
</style>

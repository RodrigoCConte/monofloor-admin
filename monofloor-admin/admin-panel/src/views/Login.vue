<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const showPassword = ref(false);

const handleSubmit = async () => {
  const success = await authStore.login(email.value, password.value);
  if (success) {
    router.push('/comercial');
  }
};
</script>

<template>
  <div class="login-page">
    <!-- Sky Background -->
    <div class="sky">
      <!-- Sun - Pixel Circle with Gradient Stripes (More Red/Vibrant) -->
      <svg class="sun" viewBox="0 0 32 32" fill="none">
        <!-- Row 1 - Top (deep red) -->
        <rect x="10" y="2" width="12" height="2" fill="#c94040"/>

        <!-- Row 2 -->
        <rect x="6" y="4" width="20" height="2" fill="#d64545"/>

        <!-- Row 3 -->
        <rect x="4" y="6" width="24" height="2" fill="#e25050"/>

        <!-- Row 4 (coral red) -->
        <rect x="2" y="8" width="28" height="2" fill="#e86058"/>

        <!-- Row 5 -->
        <rect x="2" y="10" width="28" height="2" fill="#ed7050"/>

        <!-- Row 6 (orange-red) -->
        <rect x="0" y="12" width="32" height="2" fill="#f08048"/>

        <!-- Row 7 -->
        <rect x="0" y="14" width="32" height="2" fill="#f49040"/>

        <!-- Row 8 (orange) -->
        <rect x="0" y="16" width="32" height="2" fill="#f8a038"/>

        <!-- Row 9 -->
        <rect x="0" y="18" width="32" height="2" fill="#fab030"/>

        <!-- Row 10 (yellow-orange) -->
        <rect x="2" y="20" width="28" height="2" fill="#fcc028"/>

        <!-- Row 11 -->
        <rect x="2" y="22" width="28" height="2" fill="#fdd020"/>

        <!-- Row 12 -->
        <rect x="4" y="24" width="24" height="2" fill="#fee018"/>

        <!-- Row 13 -->
        <rect x="6" y="26" width="20" height="2" fill="#ffe810"/>

        <!-- Row 14 - Bottom (bright yellow) -->
        <rect x="10" y="28" width="12" height="2" fill="#fff020"/>
      </svg>

      <!-- Saturn - PNG Image -->
      <img class="saturn" src="/images/saturn.png" alt="Saturn" />

      <!-- Clouds -->
      <div class="cloud cloud-1">
        <div class="cloud-part"></div>
        <div class="cloud-part"></div>
        <div class="cloud-part"></div>
      </div>
      <div class="cloud cloud-2">
        <div class="cloud-part"></div>
        <div class="cloud-part"></div>
        <div class="cloud-part"></div>
      </div>
      <div class="cloud cloud-3">
        <div class="cloud-part"></div>
        <div class="cloud-part"></div>
      </div>
      <div class="cloud cloud-4">
        <div class="cloud-part"></div>
        <div class="cloud-part"></div>
        <div class="cloud-part"></div>
      </div>
      <div class="cloud cloud-5">
        <div class="cloud-part"></div>
        <div class="cloud-part"></div>
      </div>
      <div class="cloud cloud-6">
        <div class="cloud-part"></div>
        <div class="cloud-part"></div>
        <div class="cloud-part"></div>
      </div>
    </div>

    <!-- UFO Abduction Scene -->
    <div class="ufo-scene">
      <!-- UFO with Alien - Pixel Style -->
      <div class="ufo">
        <svg viewBox="0 0 40 24" fill="none">
          <!-- UFO dome -->
          <rect x="14" y="0" width="12" height="2" fill="#88ddff"/>
          <rect x="12" y="2" width="16" height="2" fill="#88ddff"/>
          <rect x="10" y="4" width="20" height="2" fill="#aaeeff"/>
          <!-- Alien head -->
          <rect x="16" y="2" width="8" height="2" fill="#90EE90"/>
          <rect x="14" y="4" width="12" height="2" fill="#90EE90"/>
          <!-- Alien eyes -->
          <rect x="15" y="3" width="2" height="2" fill="#000"/>
          <rect x="23" y="3" width="2" height="2" fill="#000"/>
          <!-- UFO body -->
          <rect x="6" y="6" width="28" height="2" fill="#aaa"/>
          <rect x="4" y="8" width="32" height="2" fill="#888"/>
          <rect x="2" y="10" width="36" height="2" fill="#777"/>
          <rect x="6" y="12" width="28" height="2" fill="#666"/>
          <!-- Lights -->
          <rect x="6" y="10" width="4" height="2" fill="#ff0" class="ufo-light"/>
          <rect x="14" y="12" width="4" height="2" fill="#ff0" class="ufo-light"/>
          <rect x="22" y="12" width="4" height="2" fill="#ff0" class="ufo-light"/>
          <rect x="30" y="10" width="4" height="2" fill="#ff0" class="ufo-light"/>
        </svg>
        <!-- Tractor Beam - Classic Alien Green Light Cone -->
        <div class="tractor-beam"></div>
      </div>

      <!-- Cow - Pixel Style -->
      <div class="cow">
        <svg viewBox="0 0 24 16" fill="none">
          <!-- Body -->
          <rect x="4" y="6" width="14" height="6" fill="#fff"/>
          <rect x="6" y="4" width="10" height="2" fill="#fff"/>
          <!-- Spots -->
          <rect x="6" y="6" width="4" height="4" fill="#222"/>
          <rect x="12" y="8" width="4" height="2" fill="#222"/>
          <!-- Head -->
          <rect x="16" y="4" width="6" height="6" fill="#fff"/>
          <rect x="18" y="2" width="2" height="2" fill="#fff"/>
          <!-- Ears -->
          <rect x="16" y="2" width="2" height="2" fill="#ffaaaa"/>
          <rect x="22" y="2" width="2" height="2" fill="#ffaaaa"/>
          <!-- Eyes -->
          <rect x="18" y="5" width="2" height="2" fill="#000"/>
          <rect x="20" y="5" width="2" height="2" fill="#000"/>
          <!-- Nose -->
          <rect x="18" y="8" width="4" height="2" fill="#ffaaaa"/>
          <!-- Legs -->
          <rect x="6" y="12" width="2" height="4" fill="#fff"/>
          <rect x="10" y="12" width="2" height="4" fill="#fff"/>
          <rect x="14" y="12" width="2" height="4" fill="#fff"/>
          <!-- Hooves -->
          <rect x="6" y="14" width="2" height="2" fill="#222"/>
          <rect x="10" y="14" width="2" height="2" fill="#222"/>
          <rect x="14" y="14" width="2" height="2" fill="#222"/>
          <!-- Tail -->
          <rect x="2" y="8" width="2" height="2" fill="#222"/>
          <rect x="0" y="10" width="2" height="2" fill="#222"/>
        </svg>
      </div>
    </div>

    <!-- Ground/Desert -->
    <div class="ground">
      <!-- Cactus 1 - Pixel Style -->
      <svg class="cactus cactus-1" viewBox="0 0 32 64" fill="#2d5a27">
        <!-- Main body -->
        <rect x="12" y="16" width="8" height="48"/>
        <!-- Left arm -->
        <rect x="4" y="28" width="8" height="4"/>
        <rect x="4" y="20" width="4" height="12"/>
        <!-- Right arm -->
        <rect x="20" y="36" width="8" height="4"/>
        <rect x="24" y="28" width="4" height="12"/>
      </svg>

      <!-- Cactus 2 - Pixel Style -->
      <svg class="cactus cactus-2" viewBox="0 0 28 56" fill="#3d7a37">
        <!-- Main body -->
        <rect x="10" y="12" width="8" height="44"/>
        <!-- Left arm -->
        <rect x="2" y="24" width="8" height="4"/>
        <rect x="2" y="16" width="4" height="12"/>
        <!-- Right arm -->
        <rect x="18" y="20" width="8" height="4"/>
        <rect x="22" y="12" width="4" height="12"/>
      </svg>

      <!-- Cactus 3 (small) - Pixel Style -->
      <svg class="cactus cactus-3" viewBox="0 0 20 40" fill="#4a8a42">
        <!-- Main body -->
        <rect x="6" y="8" width="8" height="32"/>
        <!-- Left arm -->
        <rect x="0" y="18" width="6" height="4"/>
        <!-- Right arm -->
        <rect x="14" y="14" width="6" height="4"/>
      </svg>

      <!-- Cactus 4 - Pixel Style -->
      <svg class="cactus cactus-4" viewBox="0 0 32 64" fill="#2d5a27">
        <!-- Main body -->
        <rect x="12" y="16" width="8" height="48"/>
        <!-- Right arm only -->
        <rect x="20" y="32" width="8" height="4"/>
        <rect x="24" y="24" width="4" height="12"/>
      </svg>
    </div>

    <!-- Background Train Animation -->
    <div class="train-bg">
      <svg class="train-track" viewBox="0 0 1200 180" preserveAspectRatio="xMidYMid slice">
        <defs>
          <path id="trackPath" d="M-100,105 L1300,105"/>
        </defs>

        <!-- Track Ties/Sleepers -->
        <g fill="#5c4a32">
          <rect x="0" y="138" width="20" height="6"/>
          <rect x="40" y="138" width="20" height="6"/>
          <rect x="80" y="138" width="20" height="6"/>
          <rect x="120" y="138" width="20" height="6"/>
          <rect x="160" y="138" width="20" height="6"/>
          <rect x="200" y="138" width="20" height="6"/>
          <rect x="240" y="138" width="20" height="6"/>
          <rect x="280" y="138" width="20" height="6"/>
          <rect x="320" y="138" width="20" height="6"/>
          <rect x="360" y="138" width="20" height="6"/>
          <rect x="400" y="138" width="20" height="6"/>
          <rect x="440" y="138" width="20" height="6"/>
          <rect x="480" y="138" width="20" height="6"/>
          <rect x="520" y="138" width="20" height="6"/>
          <rect x="560" y="138" width="20" height="6"/>
          <rect x="600" y="138" width="20" height="6"/>
          <rect x="640" y="138" width="20" height="6"/>
          <rect x="680" y="138" width="20" height="6"/>
          <rect x="720" y="138" width="20" height="6"/>
          <rect x="760" y="138" width="20" height="6"/>
          <rect x="800" y="138" width="20" height="6"/>
          <rect x="840" y="138" width="20" height="6"/>
          <rect x="880" y="138" width="20" height="6"/>
          <rect x="920" y="138" width="20" height="6"/>
          <rect x="960" y="138" width="20" height="6"/>
          <rect x="1000" y="138" width="20" height="6"/>
          <rect x="1040" y="138" width="20" height="6"/>
          <rect x="1080" y="138" width="20" height="6"/>
          <rect x="1120" y="138" width="20" height="6"/>
          <rect x="1160" y="138" width="20" height="6"/>
        </g>

        <!-- Rails -->
        <line x1="0" y1="136" x2="1200" y2="136" stroke="#1a1a1a" stroke-width="4"/>
        <line x1="0" y1="146" x2="1200" y2="146" stroke="#1a1a1a" stroke-width="4"/>

        <!-- Animated Train -->
        <g>
          <animateMotion dur="10s" repeatCount="indefinite">
            <mpath href="#trackPath"/>
          </animateMotion>
          <g transform="scale(-1.2, 1.2) translate(-55, -5)">
            <!-- "Piuiiii" text - flipped back to read correctly -->
            <g transform="scale(-1, 1)">
              <text x="-45" y="-5" font-family="monospace" font-size="8" font-weight="bold" fill="#1a1a1a">
                <animate attributeName="opacity" values="0;0;1;1;1;0;0;0;0;0" dur="10s" repeatCount="indefinite"/>
                Piuiiii!
              </text>
            </g>

            <!-- Smoke particles -->
            <circle cx="20" cy="-5" r="4" fill="#666">
              <animate attributeName="r" values="4;8;12" dur="0.8s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.6;0.3;0" dur="0.8s" repeatCount="indefinite"/>
              <animate attributeName="cy" values="-5;-20;-40" dur="0.8s" repeatCount="indefinite"/>
            </circle>
            <circle cx="16" cy="-8" r="3" fill="#888">
              <animate attributeName="r" values="3;6;10" dur="0.7s" repeatCount="indefinite" begin="0.2s"/>
              <animate attributeName="opacity" values="0.5;0.2;0" dur="0.7s" repeatCount="indefinite" begin="0.2s"/>
              <animate attributeName="cy" values="-8;-25;-45" dur="0.7s" repeatCount="indefinite" begin="0.2s"/>
            </circle>
            <circle cx="24" cy="-3" r="3" fill="#aaa">
              <animate attributeName="r" values="3;5;9" dur="0.9s" repeatCount="indefinite" begin="0.4s"/>
              <animate attributeName="opacity" values="0.4;0.2;0" dur="0.9s" repeatCount="indefinite" begin="0.4s"/>
              <animate attributeName="cy" values="-3;-18;-38" dur="0.9s" repeatCount="indefinite" begin="0.4s"/>
            </circle>

            <!-- Chimney -->
            <rect x="18" y="0" width="6" height="8" fill="#1a1a1a"/>
            <!-- Boiler -->
            <rect x="12" y="6" width="24" height="14" rx="2" fill="#1a1a1a"/>
            <!-- Cabin -->
            <rect x="36" y="2" width="14" height="18" fill="#1a1a1a"/>
            <rect x="38" y="4" width="4" height="4" fill="#FFE566"/>
            <rect x="44" y="4" width="4" height="4" fill="#FFE566"/>
            <!-- Wheels - Circles -->
            <circle cx="18" cy="22" r="5" fill="#1a1a1a"/>
            <circle cx="18" cy="22" r="2" fill="#c9a962"/>
            <circle cx="30" cy="22" r="5" fill="#1a1a1a"/>
            <circle cx="30" cy="22" r="2" fill="#c9a962"/>
            <circle cx="44" cy="22" r="4" fill="#1a1a1a"/>
            <circle cx="44" cy="22" r="1.5" fill="#c9a962"/>
            <!-- Light -->
            <rect x="8" y="10" width="4" height="6" rx="1" fill="#FFE566"/>
            <!-- Gold stripes -->
            <rect x="14" y="12" width="20" height="2" fill="#c9a962"/>
            <rect x="36" y="16" width="14" height="2" fill="#c9a962"/>
          </g>
        </g>
      </svg>
    </div>

    <!-- Login Card -->
    <div class="login-container">
      <div class="login-card">
        <!-- Header with Logo -->
        <div class="login-header">
          <!-- Train + Monofloor Logo -->
          <div class="logo-row">
            <!-- Pixel Train with Smoke Animation -->
            <div class="pixel-train">
              <svg class="train-svg" viewBox="0 0 64 40" fill="none">
                <g transform="translate(64,0) scale(-1,1)">
                  <!-- Smoke particles -->
                  <circle class="smoke smoke-1" cx="20" cy="8" r="3" fill="#666"/>
                  <circle class="smoke smoke-2" cx="14" cy="5" r="2.5" fill="#888"/>
                  <circle class="smoke smoke-3" cx="8" cy="3" r="2" fill="#aaa"/>
                  <circle class="smoke smoke-4" cx="24" cy="4" r="2" fill="#777"/>
                  <!-- Chimney -->
                  <rect x="18" y="12" width="6" height="8" fill="#1a1a1a"/>
                  <!-- Boiler -->
                  <rect x="12" y="18" width="24" height="14" rx="2" fill="#1a1a1a"/>
                  <!-- Cabin -->
                  <rect x="36" y="14" width="14" height="18" fill="#1a1a1a"/>
                  <rect x="38" y="16" width="4" height="4" fill="#FFE566"/>
                  <rect x="44" y="16" width="4" height="4" fill="#FFE566"/>
                  <!-- Wheels -->
                  <circle cx="18" cy="34" r="5" fill="#1a1a1a"/>
                  <circle cx="18" cy="34" r="2" fill="#c9a962"/>
                  <circle cx="30" cy="34" r="5" fill="#1a1a1a"/>
                  <circle cx="30" cy="34" r="2" fill="#c9a962"/>
                  <circle cx="44" cy="34" r="4" fill="#1a1a1a"/>
                  <circle cx="44" cy="34" r="1.5" fill="#c9a962"/>
                  <!-- Front light -->
                  <rect x="8" y="22" width="4" height="6" rx="1" fill="#FFE566"/>
                  <!-- Details -->
                  <rect x="14" y="24" width="20" height="2" fill="#c9a962"/>
                  <rect x="36" y="28" width="14" height="2" fill="#c9a962"/>
                </g>
              </svg>
            </div>

            <!-- Monofloor Logo SVG -->
            <svg class="monofloor-logo" viewBox="0 0 268 32" fill="#1a1a1a">
              <!-- m -->
              <rect x="0" y="8" width="4" height="24"/>
              <rect x="4" y="6" width="2" height="4"/>
              <rect x="6" y="4" width="2" height="4"/>
              <rect x="8" y="2" width="2" height="4"/>
              <rect x="10" y="0" width="6" height="4"/>
              <rect x="16" y="2" width="2" height="4"/>
              <rect x="18" y="4" width="2" height="4"/>
              <rect x="20" y="6" width="2" height="4"/>
              <rect x="22" y="8" width="4" height="24"/>
              <rect x="26" y="6" width="2" height="4"/>
              <rect x="28" y="4" width="2" height="4"/>
              <rect x="30" y="2" width="2" height="4"/>
              <rect x="32" y="0" width="6" height="4"/>
              <rect x="38" y="2" width="2" height="4"/>
              <rect x="40" y="4" width="2" height="4"/>
              <rect x="42" y="6" width="2" height="4"/>
              <rect x="44" y="8" width="4" height="24"/>
              <!-- o -->
              <rect x="56" y="4" width="2" height="2"/>
              <rect x="58" y="2" width="2" height="2"/>
              <rect x="60" y="0" width="8" height="4"/>
              <rect x="68" y="2" width="2" height="2"/>
              <rect x="70" y="4" width="2" height="2"/>
              <rect x="54" y="6" width="4" height="20"/>
              <rect x="70" y="6" width="4" height="20"/>
              <rect x="56" y="26" width="2" height="2"/>
              <rect x="58" y="28" width="2" height="2"/>
              <rect x="60" y="28" width="8" height="4"/>
              <rect x="68" y="28" width="2" height="2"/>
              <rect x="70" y="26" width="2" height="2"/>
              <!-- n -->
              <rect x="82" y="8" width="4" height="24"/>
              <rect x="86" y="6" width="2" height="4"/>
              <rect x="88" y="4" width="2" height="4"/>
              <rect x="90" y="2" width="2" height="4"/>
              <rect x="92" y="0" width="8" height="4"/>
              <rect x="100" y="2" width="2" height="4"/>
              <rect x="102" y="4" width="2" height="4"/>
              <rect x="104" y="6" width="2" height="4"/>
              <rect x="106" y="8" width="4" height="24"/>
              <!-- o -->
              <rect x="118" y="4" width="2" height="2"/>
              <rect x="120" y="2" width="2" height="2"/>
              <rect x="122" y="0" width="8" height="4"/>
              <rect x="130" y="2" width="2" height="2"/>
              <rect x="132" y="4" width="2" height="2"/>
              <rect x="116" y="6" width="4" height="20"/>
              <rect x="132" y="6" width="4" height="20"/>
              <rect x="118" y="26" width="2" height="2"/>
              <rect x="120" y="28" width="2" height="2"/>
              <rect x="122" y="28" width="8" height="4"/>
              <rect x="130" y="28" width="2" height="2"/>
              <rect x="132" y="26" width="2" height="2"/>
              <!-- f -->
              <rect x="146" y="4" width="2" height="2"/>
              <rect x="148" y="2" width="2" height="2"/>
              <rect x="150" y="0" width="10" height="4"/>
              <rect x="144" y="6" width="4" height="26"/>
              <rect x="144" y="14" width="12" height="4"/>
              <!-- l -->
              <rect x="164" y="0" width="4" height="26"/>
              <rect x="168" y="24" width="2" height="4"/>
              <rect x="170" y="26" width="2" height="4"/>
              <rect x="172" y="28" width="8" height="4"/>
              <!-- o -->
              <rect x="186" y="4" width="2" height="2"/>
              <rect x="188" y="2" width="2" height="2"/>
              <rect x="190" y="0" width="8" height="4"/>
              <rect x="198" y="2" width="2" height="2"/>
              <rect x="200" y="4" width="2" height="2"/>
              <rect x="184" y="6" width="4" height="20"/>
              <rect x="200" y="6" width="4" height="20"/>
              <rect x="186" y="26" width="2" height="2"/>
              <rect x="188" y="28" width="2" height="2"/>
              <rect x="190" y="28" width="8" height="4"/>
              <rect x="198" y="28" width="2" height="2"/>
              <rect x="200" y="26" width="2" height="2"/>
              <!-- o -->
              <rect x="214" y="4" width="2" height="2"/>
              <rect x="216" y="2" width="2" height="2"/>
              <rect x="218" y="0" width="8" height="4"/>
              <rect x="226" y="2" width="2" height="2"/>
              <rect x="228" y="4" width="2" height="2"/>
              <rect x="212" y="6" width="4" height="20"/>
              <rect x="228" y="6" width="4" height="20"/>
              <rect x="214" y="26" width="2" height="2"/>
              <rect x="216" y="28" width="2" height="2"/>
              <rect x="218" y="28" width="8" height="4"/>
              <rect x="226" y="28" width="2" height="2"/>
              <rect x="228" y="26" width="2" height="2"/>
              <!-- r -->
              <rect x="240" y="8" width="4" height="24"/>
              <rect x="244" y="6" width="2" height="4"/>
              <rect x="246" y="4" width="2" height="4"/>
              <rect x="248" y="2" width="2" height="4"/>
              <rect x="250" y="0" width="8" height="4"/>
              <rect x="258" y="2" width="2" height="4"/>
              <rect x="260" y="4" width="2" height="4"/>
              <!-- ® -->
              <rect x="264" y="0" width="1" height="1"/>
              <rect x="265" y="0" width="2" height="1"/>
              <rect x="267" y="0" width="1" height="1"/>
              <rect x="263" y="1" width="1" height="1"/>
              <rect x="268" y="1" width="1" height="1"/>
              <rect x="263" y="2" width="1" height="2"/>
              <rect x="268" y="2" width="1" height="2"/>
              <rect x="263" y="4" width="1" height="1"/>
              <rect x="268" y="4" width="1" height="1"/>
              <rect x="264" y="5" width="1" height="1"/>
              <rect x="265" y="5" width="2" height="1"/>
              <rect x="267" y="5" width="1" height="1"/>
              <rect x="265" y="1" width="1" height="3"/>
              <rect x="266" y="1" width="1" height="1"/>
              <rect x="266" y="2" width="1" height="1"/>
              <rect x="267" y="3" width="1" height="2"/>
            </svg>
          </div>

          <div class="subtitle-badge">COMERCIAL</div>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleSubmit" class="login-form">
          <div class="form-group">
            <label for="email">EMAIL</label>
            <div class="input-wrapper">
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="seu@email.com"
                required
                :disabled="authStore.loading"
                autocomplete="email"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="password">SENHA</label>
            <div class="input-wrapper">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="********"
                required
                :disabled="authStore.loading"
                autocomplete="current-password"
              />
              <button
                type="button"
                class="toggle-password"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
          </div>

          <div v-if="authStore.error" class="error-message">
            {{ authStore.error }}
          </div>

          <button type="submit" class="login-button" :disabled="authStore.loading">
            <span v-if="!authStore.loading">ENTRAR</span>
            <span v-else class="loading-text">
              <span class="dot">.</span>
              <span class="dot">.</span>
              <span class="dot">.</span>
            </span>
          </button>
        </form>

        <!-- Footer -->
        <div class="login-footer">
          <div class="footer-line"></div>
          <span class="footer-text">A MAQUINA DE VENDAS</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(to bottom, #87CEEB 0%, #87CEEB 70%, #c9a962 70%, #c9a962 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* Sky */
.sky {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 30%;
  pointer-events: none;
}

/* Sun - Pixel Gradient Circle */
.sun {
  position: absolute;
  top: 25px;
  right: 50px;
  width: 100px;
  height: 100px;
  filter: drop-shadow(0 0 15px rgba(232, 180, 96, 0.5));
  animation: sunPulse 5s ease-in-out infinite;
}

@keyframes sunPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

/* Saturn - PNG Image */
.saturn {
  position: absolute;
  top: 160px;
  left: 135px;
  width: 100px;
  height: auto;
  image-rendering: pixelated;
  animation: saturnFloat 6s ease-in-out infinite;
}

@keyframes saturnFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Clouds - Pixel Style */
.cloud {
  position: absolute;
  display: flex;
  gap: 0;
  animation: floatCloud 20s linear infinite;
}

.cloud-part {
  background: white;
  border: 2px solid #e0e0e0;
}

.cloud-1 {
  top: 60px;
  left: -150px;
  animation-duration: 25s;
}
.cloud-1 .cloud-part:nth-child(1) { width: 24px; height: 24px; margin-top: 12px; }
.cloud-1 .cloud-part:nth-child(2) { width: 36px; height: 36px; margin-left: -8px; }
.cloud-1 .cloud-part:nth-child(3) { width: 28px; height: 28px; margin-left: -8px; margin-top: 8px; }

.cloud-2 {
  top: 120px;
  left: -200px;
  animation-duration: 30s;
  animation-delay: -10s;
}
.cloud-2 .cloud-part:nth-child(1) { width: 20px; height: 20px; margin-top: 10px; }
.cloud-2 .cloud-part:nth-child(2) { width: 32px; height: 32px; margin-left: -6px; }
.cloud-2 .cloud-part:nth-child(3) { width: 24px; height: 24px; margin-left: -6px; margin-top: 8px; }

.cloud-3 {
  top: 80px;
  left: -100px;
  animation-duration: 35s;
  animation-delay: -20s;
}
.cloud-3 .cloud-part:nth-child(1) { width: 18px; height: 18px; margin-top: 8px; }
.cloud-3 .cloud-part:nth-child(2) { width: 28px; height: 28px; margin-left: -6px; }

.cloud-4 {
  top: 150px;
  left: -180px;
  animation-duration: 28s;
  animation-delay: -5s;
}
.cloud-4 .cloud-part:nth-child(1) { width: 22px; height: 22px; margin-top: 10px; }
.cloud-4 .cloud-part:nth-child(2) { width: 32px; height: 32px; margin-left: -8px; }
.cloud-4 .cloud-part:nth-child(3) { width: 20px; height: 20px; margin-left: -6px; margin-top: 12px; }

.cloud-5 {
  top: 40px;
  left: -120px;
  animation-duration: 40s;
  animation-delay: -15s;
}
.cloud-5 .cloud-part:nth-child(1) { width: 16px; height: 16px; margin-top: 6px; }
.cloud-5 .cloud-part:nth-child(2) { width: 24px; height: 24px; margin-left: -5px; }

.cloud-6 {
  top: 180px;
  left: -200px;
  animation-duration: 32s;
  animation-delay: -25s;
}
.cloud-6 .cloud-part:nth-child(1) { width: 20px; height: 20px; margin-top: 8px; }
.cloud-6 .cloud-part:nth-child(2) { width: 30px; height: 30px; margin-left: -7px; }
.cloud-6 .cloud-part:nth-child(3) { width: 18px; height: 18px; margin-left: -5px; margin-top: 10px; }

@keyframes floatCloud {
  0% { transform: translateX(0); }
  100% { transform: translateX(calc(100vw + 300px)); }
}

/* UFO Abduction Scene */
.ufo-scene {
  position: absolute;
  right: 18%;
  bottom: 22%;
  width: 100px;
  height: 350px;
  pointer-events: none;
  z-index: 8;
  overflow: visible;
}

.ufo {
  position: absolute;
  top: -500px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  animation: ufoAnimation 14s ease-out 10s forwards;
}

.ufo svg {
  width: 100%;
  height: auto;
  image-rendering: pixelated;
}

.ufo-light {
  animation: blinkLight 0.2s steps(2) infinite;
}

@keyframes blinkLight {
  0% { opacity: 0.3; }
  100% { opacity: 1; }
}

.tractor-beam {
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 280px;
  background: linear-gradient(
    to bottom,
    rgba(0, 255, 136, 0.95) 0%,
    rgba(0, 255, 170, 0.7) 30%,
    rgba(100, 255, 200, 0.5) 60%,
    rgba(150, 255, 220, 0.3) 100%
  );
  clip-path: polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%);
  opacity: 0;
  animation: beamAppear 14s linear 10s forwards;
  filter: drop-shadow(0 0 15px rgba(0, 255, 136, 0.8)) drop-shadow(0 0 30px rgba(0, 255, 136, 0.4));
}

.tractor-beam::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 12px,
    rgba(255, 255, 255, 0.4) 12px,
    rgba(255, 255, 255, 0.4) 16px
  );
  animation: beamPulse 0.4s ease-in-out infinite alternate;
}

@keyframes beamPulse {
  0% { opacity: 0.4; }
  100% { opacity: 1; }
}

@keyframes beamAppear {
  0%, 24% {
    opacity: 0;
  }
  25%, 64% {
    opacity: 1;
  }
  65%, 100% {
    opacity: 0;
  }
}

.cow {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  animation: cowAbduction 14s ease-in-out 10s forwards;
}

.cow svg {
  width: 100%;
  height: auto;
  image-rendering: pixelated;
}

@keyframes ufoAnimation {
  0% {
    top: -500px;
    left: 50%;
  }
  20% {
    top: 0px;
    left: 50%;
  }
  65% {
    top: 0px;
    left: 50%;
  }
  100% {
    top: -600px;
    left: 300%;
  }
}

@keyframes cowAbduction {
  0%, 30% {
    transform: translateX(-50%) translateY(0) rotate(0deg);
    opacity: 1;
  }
  55% {
    transform: translateX(-50%) translateY(-180px) rotate(360deg);
    opacity: 1;
  }
  70% {
    transform: translateX(-50%) translateY(-220px) rotate(540deg);
    opacity: 0;
  }
  100% {
    transform: translateX(-50%) translateY(-220px) rotate(540deg);
    opacity: 0;
  }
}

/* Ground/Desert */
.ground {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30%;
  background: #c9a962;
  pointer-events: none;
}

/* Cactus - Pixel Style */
.cactus {
  position: absolute;
  bottom: 120px;
}

.cactus-1 {
  left: 8%;
  width: 32px;
  height: 64px;
}

.cactus-2 {
  right: 12%;
  width: 28px;
  height: 56px;
}

.cactus-3 {
  left: 20%;
  width: 20px;
  height: 40px;
  bottom: 115px;
}

.cactus-4 {
  right: 25%;
  width: 30px;
  height: 60px;
}

/* Background Train Animation */
.train-bg {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 180px;
  pointer-events: none;
  z-index: 5;
}

.train-track {
  width: 100%;
  height: 100%;
}

/* Login Container */
.login-container {
  position: relative;
  z-index: 10;
  padding: 20px;
  width: 100%;
  max-width: 520px;
}

/* Login Card - Neobrutalist Style */
.login-card {
  background: #ffffff;
  border: 3px solid #1a1a1a;
  box-shadow: 4px 4px 0 #1a1a1a;
  padding: 48px 40px;
  position: relative;
}

.login-card::before {
  content: '';
  position: absolute;
  top: -8px;
  right: -8px;
  width: 100%;
  height: 100%;
  background: #c9a962;
  border: 3px solid #1a1a1a;
  z-index: -1;
}

/* Header */
.login-header {
  text-align: center;
  margin-bottom: 40px;
}

/* Logo Row - Train + Monofloor */
.logo-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 20px;
}

.pixel-train {
  flex-shrink: 0;
}

.train-svg {
  width: 64px;
  height: 40px;
}

.monofloor-logo {
  height: 28px;
  width: auto;
}

/* Smoke Animation */
.smoke {
  animation: smokeRise 1.5s ease-out infinite;
}

.smoke-1 { animation-delay: 0s; }
.smoke-2 { animation-delay: 0.3s; }
.smoke-3 { animation-delay: 0.6s; }
.smoke-4 { animation-delay: 0.15s; }

@keyframes smokeRise {
  0% {
    opacity: 0.8;
    transform: translateY(0) scale(1);
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 0;
    transform: translateY(-15px) scale(1.5);
  }
}

.subtitle-badge {
  display: inline-block;
  background: #1a1a1a;
  color: #c9a962;
  padding: 8px 24px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 3px;
  border: 2px solid #1a1a1a;
}

/* Form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 2px;
  color: #1a1a1a;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-group input {
  width: 100%;
  background: #ffffff;
  border: 3px solid #1a1a1a;
  padding: 16px;
  font-size: 16px;
  font-weight: 500;
  color: #1a1a1a;
  outline: none;
  transition: box-shadow 0.15s ease;
}

.form-group input:focus {
  box-shadow: 4px 4px 0 #1a1a1a;
}

.form-group input::placeholder {
  color: #999;
}

.form-group input:disabled {
  background: #f0f0f0;
  cursor: not-allowed;
}

.toggle-password {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
}

/* Error Message */
.error-message {
  background: #ffebee;
  border: 2px solid #ef4444;
  color: #c62828;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}

/* Login Button */
.login-button {
  background: #c9a962;
  border: 3px solid #1a1a1a;
  color: #1a1a1a;
  padding: 18px 32px;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 2px;
  cursor: pointer;
  box-shadow: 4px 4px 0 #1a1a1a;
  transition: all 0.15s ease;
  margin-top: 8px;
}

.login-button:hover:not(:disabled) {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 #1a1a1a;
}

.login-button:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 #1a1a1a;
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-text {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.loading-text .dot {
  animation: bounce 1.4s infinite ease-in-out;
  font-size: 24px;
  line-height: 1;
}

.loading-text .dot:nth-child(1) { animation-delay: 0s; }
.loading-text .dot:nth-child(2) { animation-delay: 0.2s; }
.loading-text .dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-8px); }
}

/* Footer */
.login-footer {
  margin-top: 32px;
  text-align: center;
}

.footer-line {
  height: 3px;
  background: #1a1a1a;
  margin-bottom: 16px;
}

.footer-text {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 3px;
  color: #1a1a1a;
}

/* Responsive */
@media (max-width: 520px) {
  .login-card {
    padding: 36px 28px;
  }

  .login-card::before {
    top: -6px;
    right: -6px;
  }

  .logo-row {
    flex-direction: column;
    gap: 12px;
  }

  .train-svg {
    width: 56px;
    height: 35px;
  }

  .monofloor-logo {
    height: 24px;
  }

  .subtitle-badge {
    font-size: 12px;
    padding: 6px 16px;
  }

  .form-group input {
    padding: 14px;
    font-size: 15px;
  }

  .login-button {
    padding: 16px 24px;
    font-size: 14px;
  }
}

@media (max-width: 380px) {
  .login-container {
    padding: 12px;
  }

  .login-card {
    padding: 28px 20px;
  }

  .login-card::before {
    display: none;
  }

  .monofloor-logo {
    height: 20px;
  }
}
</style>

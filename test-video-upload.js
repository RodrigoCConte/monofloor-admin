const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function testVideoUpload() {
    console.log('🎬 Iniciando teste de upload de vídeo...\n');

    const form = new FormData();

    // Adicionar os 3 vídeos
    const videoPaths = [
        '/Users/rodrigoconte/Downloads/WhatsApp Video 2025-12-15 at 08.40.47.mp4',
        '/Users/rodrigoconte/Downloads/WhatsApp Video 2025-12-15 at 08.43.04.mp4',
        '/Users/rodrigoconte/Downloads/WhatsApp Video 2025-12-15 at 08.43.11.mp4'
    ];

    videoPaths.forEach(videoPath => {
        form.append('videos', fs.createReadStream(videoPath));
    });

    // Adicionar dados do formulário
    form.append('projectName', 'Teste Erika Casão');
    form.append('technicianName', 'Rodrigo Conte');
    form.append('visitDate', '2025-12-15');
    form.append('visitPurpose', 'vistoria');
    form.append('maxFrames', '15');
    form.append('outputFormat', 'docx');
    form.append('clientName', 'Erika Casão');
    form.append('address', 'Curitiba - PR');

    try {
        console.log('📤 Enviando 3 vídeos para o backend...');
        videoPaths.forEach((path, i) => {
            console.log(`   Vídeo ${i + 1}:`, path);
            console.log(`   Tamanho: ${(fs.statSync(path).size / 1024 / 1024).toFixed(2)} MB`);
        });
        console.log('');

        const response = await axios.post(
            'http://localhost:3000/api/admin/reports/simple-video-multiple',
            form,
            {
                headers: form.getHeaders(),
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 600000, // 10 minutes
                responseType: 'arraybuffer',
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    process.stdout.write(`\r📊 Upload: ${percentCompleted}%`);
                }
            }
        );

        console.log('\n\n✅ Relatório gerado com sucesso!');
        console.log('   Status:', response.status);
        console.log('   Tipo:', response.headers['content-type']);
        console.log('   Tamanho:', (response.data.length / 1024 / 1024).toFixed(2), 'MB');

        // Salvar arquivo
        const outputPath = '/Users/rodrigoconte/Downloads/relatorio_teste_erika.docx';
        fs.writeFileSync(outputPath, response.data);

        console.log('\n📄 Arquivo salvo em:', outputPath);
        console.log('\n🎉 Teste concluído com sucesso!');

    } catch (error) {
        console.error('\n❌ Erro:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data.toString());
        }
    }
}

testVideoUpload();

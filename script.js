// script.js
class ImageSlider {
    constructor(options) {
        this.sliderImagesContainer = document.getElementById(options.sliderImagesId);
        this.prevButton = document.querySelector(options.prevButtonSelector);
        this.nextButton = document.querySelector(options.nextButtonSelector);
        this.sliderDotsContainer = document.getElementById(options.sliderDotsId);
        this.jsonServerUrl = options.jsonServerUrl;
        this.autoSlideInterval = options.autoSlideInterval || 5000; // Intervalo padrão de 5 segundos
        this.autoSlideTimer = null; // Para armazenar o ID do setInterval

        this.currentIndex = 0;
        this.photos = [];
        this.initialized = false;

        this.init(); // Inicia o processo de carregamento e setup
    }

    async init() {
        if (this.initialized) return;
        await this.fetchPhotos();

        // Só inicializa o slider se houver fotos
        if (this.photos.length > 0) {
            this.renderSlider();
            this.renderDots();
            this.updateSlider();
            this.addEventListeners();
            this.startAutoSlide(); // *** CHAMA A FUNÇÃO PARA INICIAR A PASSAGEM AUTOMÁTICA AQUI ***
            this.initialized = true;
        } else {
            this.displayErrorMessage('Não foi possível carregar as imagens ou não há fotos no servidor. Verifique a URL do JSON Server e o conteúdo do db.json.');
        }
    }

    async fetchPhotos() {
        try {
            const response = await fetch(this.jsonServerUrl);
            if (!response.ok) {
                // Lança um erro se a resposta HTTP não for bem-sucedida
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            this.photos = await response.json();
        } catch (error) {
            console.error('Erro ao buscar fotos:', error);
            this.photos = []; // Garante que o array de fotos esteja vazio em caso de erro
        }
    }

    renderSlider() {
        this.sliderImagesContainer.innerHTML = ''; // Limpa o conteúdo existente
        this.photos.forEach((photo, index) => {
            const sliderItem = document.createElement('div');
            sliderItem.classList.add('slider-item');
            sliderItem.dataset.index = index;

            const img = document.createElement('img');
            img.src = photo.imagem;
            img.alt = photo.legenda;
            img.loading = 'lazy'; // Otimização de performance para imagens

            const caption = document.createElement('div');
            caption.classList.add('slider-caption');
            caption.innerHTML = `<h3>${photo.legenda}</h3><p>Data: ${photo.data}</p>`;

            sliderItem.appendChild(img);
            sliderItem.appendChild(caption);
            this.sliderImagesContainer.appendChild(sliderItem);
        });
    }

    renderDots() {
        this.sliderDotsContainer.innerHTML = ''; // Limpa os dots existentes
        this.photos.forEach((_, index) => {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-controls', `slide-${index}`);
            dot.setAttribute('aria-label', `Ir para a imagem ${index + 1}`);
            if (index === this.currentIndex) {
                dot.classList.add('active');
                dot.setAttribute('aria-selected', 'true');
            } else {
                dot.setAttribute('aria-selected', 'false');
            }
            dot.dataset.index = index;
            this.sliderDotsContainer.appendChild(dot);
        });
    }

    updateSlider() {
        if (this.photos.length === 0) return;

        // Garante que o item do slider exista antes de tentar pegar o clientWidth
        const firstSliderItem = this.sliderImagesContainer.querySelector('.slider-item');
        if (!firstSliderItem) return; // Se não houver itens, sai da função

        const imageWidth = firstSliderItem.clientWidth;
        this.sliderImagesContainer.style.transform = `translateX(${-this.currentIndex * imageWidth}px)`;

        // Atualiza a classe 'active' e atributos aria-selected dos dots
        document.querySelectorAll('.dot').forEach((dot, index) => {
            if (index === this.currentIndex) {
                dot.classList.add('active');
                dot.setAttribute('aria-selected', 'true');
            } else {
                dot.classList.remove('active');
                dot.setAttribute('aria-selected', 'false');
            }
        });

        // Atualiza aria-hidden para itens do slider para leitores de tela
        document.querySelectorAll('.slider-item').forEach((item, index) => {
            if (index === this.currentIndex) {
                item.removeAttribute('aria-hidden');
            } else {
                item.setAttribute('aria-hidden', 'true');
            }
        });
    }

    showNextImage() {
        // Se houver apenas uma foto ou nenhuma, não faz nada
        if (this.photos.length <= 1) return;
        this.currentIndex = (this.currentIndex + 1) % this.photos.length;
        this.updateSlider();
        this.resetAutoSlide(); // Reseta o timer ao interagir manualmente (ou quando o auto-slide avança)
    }

    showPrevImage() {
        if (this.photos.length <= 1) return;
        this.currentIndex = (this.currentIndex - 1 + this.photos.length) % this.photos.length;
        this.updateSlider();
        this.resetAutoSlide(); // Reseta o timer ao interagir manualmente
    }

    // Método para iniciar a passagem automática
    startAutoSlide() {
        // Só inicia se houver mais de uma foto para alternar
        if (this.photos.length > 1) {
            // Limpa qualquer timer existente para evitar múltiplos timers rodando
            clearInterval(this.autoSlideTimer);
            this.autoSlideTimer = setInterval(() => {
                this.showNextImage();
            }, this.autoSlideInterval);
        }
    }

    // Método para parar e reiniciar a passagem automática
    resetAutoSlide() {
        clearInterval(this.autoSlideTimer); // Para o timer atual
        this.startAutoSlide(); // Inicia um novo timer
    }

    addEventListeners() {
        this.nextButton.addEventListener('click', () => this.showNextImage());
        this.prevButton.addEventListener('click', () => this.showPrevImage());

        this.sliderDotsContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('dot')) {
                const index = parseInt(event.target.dataset.index);
                if (!isNaN(index)) {
                    this.currentIndex = index;
                    this.updateSlider();
                    this.resetAutoSlide(); // Reseta o timer ao interagir manualmente
                }
            }
        });

        window.addEventListener('resize', () => {
            // Pequeno atraso para evitar recalculos excessivos durante o redimensionamento
            clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(() => {
                this.updateSlider();
            }, 250);
        });

        // Pausar auto-slide no hover e retomar ao sair do container do slider
        this.sliderImagesContainer.addEventListener('mouseenter', () => clearInterval(this.autoSlideTimer));
        this.sliderImagesContainer.addEventListener('mouseleave', () => this.startAutoSlide());
    }

    displayErrorMessage(message) {
        this.sliderImagesContainer.innerHTML = `<p class="error-message">${message}</p>`;
        // Esconde botões e dots se houver erro
        this.prevButton.style.display = 'none';
        this.nextButton.style.display = 'none';
        this.sliderDotsContainer.style.display = 'none';
    }
}

// Inicializa o slider quando o DOM estiver completamente carregado
document.addEventListener('DOMContentLoaded', () => {
    // URL do seu JSON Server. Certifique-se de que ele está rodando!
    const jsonServerBaseUrl = 'http://localhost:3000';
    const jsonServerEndpoint = `${jsonServerBaseUrl}/fotos`;

    new ImageSlider({
        sliderImagesId: 'sliderImages',
        prevButtonSelector: '.slider-button--prev',
        nextButtonSelector: '.slider-button--next',
        sliderDotsId: 'sliderDots',
        jsonServerUrl: jsonServerEndpoint,
        autoSlideInterval: 7000 // Define o intervalo para 7 segundos (7000 milissegundos)
    });
});
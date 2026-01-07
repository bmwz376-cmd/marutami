/**
 * PDFビューアコア - ページ表示・ズーム・操作
 */
class Viewer {
    constructor() {
        this.materialData = null;
        this.currentPage = 1;
        this.zoom = 1.0;
        this.minZoom = 0.25;
        this.maxZoom = 4.0;
        this.zoomStep = 0.25;
        
        // DOM要素（後で初期化）
        this.pageImage = null;
        this.pageContainer = null;
        this.currentPageEl = null;
        this.totalPagesEl = null;
        this.totalPagesDisplayEl = null;
        this.zoomLevelEl = null;
        this.thumbnailsContainer = null;
        this.materialTitleEl = null;
        
        // パン操作
        this.isPanning = false;
        this.panStart = {x: 0, y: 0};
        this.panOffset = {x: 0, y: 0};
        
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        
        // DOM要素取得
        this.pageImage = document.getElementById('page-image');
        this.pageContainer = document.getElementById('page-container');
        this.currentPageEl = document.getElementById('current-page');
        this.totalPagesEl = document.getElementById('total-pages');
        this.totalPagesDisplayEl = document.getElementById('total-pages-display');
        this.zoomLevelEl = document.getElementById('zoom-level');
        this.thumbnailsContainer = document.getElementById('thumbnails-container');
        this.materialTitleEl = document.getElementById('material-title');
        
        this.setupEventListeners();
        this.initialized = true;
        
        console.log('Viewer initialized');
    }
    
    async loadMaterial(materialId) {
        // 初期化されていなければ初期化
        if (!this.initialized) {
            this.init();
        }
        
        try {
            console.log('教材読み込み開始:', materialId);
            const response = await fetch(`/api/materials/${materialId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.materialData = await response.json();
            console.log('教材データ取得成功:', this.materialData);
            
            // UI更新
            if (this.materialTitleEl) {
                this.materialTitleEl.textContent = this.materialData.title;
            }
            if (this.totalPagesEl) {
                this.totalPagesEl.textContent = this.materialData.total_pages;
            }
            if (this.totalPagesDisplayEl) {
                this.totalPagesDisplayEl.textContent = this.materialData.total_pages;
            }
            
            // サムネイル生成
            this.renderThumbnails();
            
            // 最初のページ表示
            this.goToPage(1);
            
            console.log('教材読み込み完了');
            return this.materialData;
            
        } catch (error) {
            console.error('教材読み込みエラー:', error);
            alert('教材の読み込みに失敗しました: ' + error.message);
            throw error;
        }
    }
    
    renderThumbnails() {
        this.thumbnailsContainer.innerHTML = this.materialData.pages.map(page => `
            <div class="thumbnail ${page.page_number === 1 ? 'active' : ''}" 
                 data-page="${page.page_number}"
                 onclick="viewer.goToPage(${page.page_number})">
                <img src="${page.thumbnail_url}" 
                     alt="ページ ${page.page_number}"
                     class="w-full rounded shadow">
                <p class="text-xs text-center mt-1">${page.page_number}</p>
            </div>
        `).join('');
    }
    
    goToPage(pageNumber) {
        if (pageNumber < 1 || pageNumber > this.materialData.total_pages) {
            return;
        }
        
        this.currentPage = pageNumber;
        const pageData = this.materialData.pages.find(p => p.page_number === pageNumber);
        
        if (!pageData) return;
        
        // 画像表示
        this.pageImage.src = pageData.image_url;
        this.currentPageEl.textContent = pageNumber;
        
        // サムネイルハイライト
        document.querySelectorAll('.thumbnail').forEach(thumb => {
            const thumbPage = parseInt(thumb.dataset.page);
            thumb.classList.toggle('active', thumbPage === pageNumber);
        });
        
        // リセット
        this.zoom = 1.0;
        this.panOffset = {x: 0, y: 0};
        this.updateTransform();
        
        // カスタムイベント発火
        const event = new CustomEvent('pagechange', {detail: {pageNumber}});
        document.dispatchEvent(event);
    }
    
    nextPage() {
        this.goToPage(this.currentPage + 1);
    }
    
    prevPage() {
        this.goToPage(this.currentPage - 1);
    }
    
    zoomIn() {
        this.setZoom(this.zoom + this.zoomStep);
    }
    
    zoomOut() {
        this.setZoom(this.zoom - this.zoomStep);
    }
    
    setZoom(zoom) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
        this.updateTransform();
    }
    
    fitToScreen() {
        this.zoom = 1.0;
        this.panOffset = {x: 0, y: 0};
        this.updateTransform();
    }
    
    updateTransform() {
        this.pageImage.style.transform = `scale(${this.zoom}) translate(${this.panOffset.x}px, ${this.panOffset.y}px)`;
        this.zoomLevelEl.textContent = `${Math.round(this.zoom * 100)}%`;
    }
    
    setupEventListeners() {
        // キーボード操作
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'Enter') {
                this.nextPage();
            } else if (e.key === 'ArrowLeft') {
                this.prevPage();
            } else if (e.key === '+' || e.key === '=') {
                this.zoomIn();
            } else if (e.key === '-') {
                this.zoomOut();
            } else if (e.key === '0') {
                this.fitToScreen();
            }
        });
        
        // マウスホイールでズーム
        this.pageContainer.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -this.zoomStep : this.zoomStep;
                this.setZoom(this.zoom + delta);
            }
        });
        
        // パン操作
        this.pageImage.addEventListener('mousedown', (e) => {
            if (this.zoom > 1.0) {
                this.isPanning = true;
                this.panStart = {x: e.clientX - this.panOffset.x, y: e.clientY - this.panOffset.y};
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.isPanning) {
                this.panOffset = {
                    x: e.clientX - this.panStart.x,
                    y: e.clientY - this.panStart.y
                };
                this.updateTransform();
            }
        });
        
        document.addEventListener('mouseup', () => {
            this.isPanning = false;
        });
    }
    
    getCurrentPage() {
        return this.materialData.pages.find(p => p.page_number === this.currentPage);
    }
}

// グローバルインスタンス
const viewer = new Viewer();

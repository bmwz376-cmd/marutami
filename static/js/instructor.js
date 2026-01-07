/**
 * 講師モード専用機能
 */
class InstructorController {
    constructor() {
        this.roomId = null;
        this.syncEnabled = true;
        this.annotationMode = null;
        this.annotations = [];
    }
    
    async init(roomId) {
        this.roomId = roomId;
        
        // ページ変更を同期送信
        document.addEventListener('pagechange', (e) => {
            sync.sendPageChange(e.detail.pageNumber);
            this.updateInstructorNotes();
        });
        
        // 注釈モードセットアップ
        this.setupAnnotationMode();
    }
    
    toggleSync() {
        this.syncEnabled = !this.syncEnabled;
        sync.sendSyncToggle(this.syncEnabled);
        
        const btn = document.getElementById('sync-toggle-btn');
        btn.textContent = this.syncEnabled ? '同期を停止' : '同期を開始';
        btn.className = this.syncEnabled ? 'w-full btn btn-primary' : 'w-full btn btn-secondary';
    }
    
    setAnnotationMode(mode) {
        this.annotationMode = mode;
        
        // ボタンハイライト
        document.querySelectorAll('.annotation-mode-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            }
        });
        
        console.log('注釈モード:', mode);
    }
    
    setupAnnotationMode() {
        const pageContainer = document.getElementById('page-container');
        
        pageContainer.addEventListener('click', (e) => {
            if (!this.annotationMode) return;
            
            const rect = pageContainer.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            if (this.annotationMode === 'pin') {
                this.addPin(x, y);
            } else if (this.annotationMode === 'laser') {
                this.addLaser(x, y);
            }
            // TODO: 他の注釈タイプ実装
        });
    }
    
    addPin(x, y) {
        const annotation = {
            id: this.generateId(),
            page_number: viewer.currentPage,
            type: 'pin',
            data: {x, y, color: 'red'},
            timestamp: new Date().toISOString(),
            temporary: false
        };
        
        this.annotations.push(annotation);
        sync.sendAnnotation(annotation);
    }
    
    addLaser(x, y) {
        const annotation = {
            id: this.generateId(),
            page_number: viewer.currentPage,
            type: 'laser',
            data: {x, y},
            timestamp: new Date().toISOString(),
            temporary: true
        };
        
        sync.sendAnnotation(annotation);
        
        // 3秒後に自動削除
        setTimeout(() => {
            sync.sendAnnotationRemove(annotation.id);
        }, 3000);
    }
    
    clearAnnotations() {
        if (confirm('すべての注釈をクリアしますか？')) {
            this.annotations = [];
            sync.sendAnnotationClear();
        }
    }
    
    showImportantCard(title, points) {
        sync.sendImportantDisplay(title, points);
        
        // 講師側も表示
        const modal = document.getElementById('important-modal');
        document.getElementById('important-title').textContent = title;
        document.getElementById('important-points').innerHTML = points.map(p => `
            <li class="text-lg">• ${p}</li>
        `).join('');
        modal.classList.add('show');
    }
    
    hideImportantCard() {
        sync.sendImportantHide();
        document.getElementById('important-modal').classList.remove('show');
    }
    
    updateInstructorNotes() {
        const currentPage = viewer.getCurrentPage();
        const notesContent = document.getElementById('instructor-notes-content');
        
        if (!currentPage || !currentPage.instructor_notes || currentPage.instructor_notes.length === 0) {
            notesContent.innerHTML = '<p class="text-gray-500 text-sm">このページにはノートがありません</p>';
            return;
        }
        
        notesContent.innerHTML = `
            <ul class="space-y-2">
                ${currentPage.instructor_notes.map(note => `
                    <li class="text-sm">• ${note}</li>
                `).join('')}
            </ul>
        `;
    }
    
    generateId() {
        return 'ann_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// グローバルインスタンス
const instructor = new InstructorController();

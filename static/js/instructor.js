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
        
        if (!pageContainer) {
            console.error('page-container が見つかりません');
            return;
        }
        
        pageContainer.addEventListener('click', (e) => {
            if (!this.annotationMode) {
                console.log('注釈モードが設定されていません');
                return;
            }
            
            const rect = pageContainer.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            console.log(`クリック位置: (${x.toFixed(2)}%, ${y.toFixed(2)}%), モード: ${this.annotationMode}`);
            
            if (this.annotationMode === 'pin') {
                this.addPin(x, y);
            } else if (this.annotationMode === 'laser') {
                this.addLaser(x, y);
            } else if (this.annotationMode === 'circle') {
                this.addCircle(x, y);
            } else if (this.annotationMode === 'rect') {
                this.addRect(x, y);
            }
        });
        
        console.log('注釈モードのクリックイベントを設定しました');
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
        
        console.log('ピンを追加:', annotation);
        
        // ローカル表示
        if (typeof annotationLayer !== 'undefined') {
            annotationLayer.addAnnotation(annotation);
        } else {
            console.error('annotationLayer が定義されていません');
        }
        
        // 同期送信
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
        
        console.log('レーザーポインタを追加:', annotation);
        
        // ローカル表示
        if (typeof annotationLayer !== 'undefined') {
            annotationLayer.addAnnotation(annotation);
        } else {
            console.error('annotationLayer が定義されていません');
        }
        
        // 同期送信
        sync.sendAnnotation(annotation);
        
        // 3秒後に自動削除
        setTimeout(() => {
            if (typeof annotationLayer !== 'undefined') {
                annotationLayer.removeAnnotation(annotation.id);
            }
            sync.sendAnnotationRemove(annotation.id);
            console.log('レーザーポインタを自動削除:', annotation.id);
        }, 3000);
    }
    
    addCircle(x, y) {
        const annotation = {
            id: this.generateId(),
            page_number: viewer.currentPage,
            type: 'circle',
            data: {x, y, radius: 50, color: 'blue'},
            timestamp: new Date().toISOString(),
            temporary: false
        };
        
        console.log('円を追加:', annotation);
        
        if (typeof annotationLayer !== 'undefined') {
            annotationLayer.addAnnotation(annotation);
        }
        
        this.annotations.push(annotation);
        sync.sendAnnotation(annotation);
    }
    
    addRect(x, y) {
        const annotation = {
            id: this.generateId(),
            page_number: viewer.currentPage,
            type: 'rect',
            data: {x, y, width: 100, height: 80, color: 'green'},
            timestamp: new Date().toISOString(),
            temporary: false
        };
        
        console.log('四角を追加:', annotation);
        
        if (typeof annotationLayer !== 'undefined') {
            annotationLayer.addAnnotation(annotation);
        }
        
        this.annotations.push(annotation);
        sync.sendAnnotation(annotation);
    }
    
    clearAnnotations() {
        if (confirm('すべての注釈をクリアしますか？')) {
            console.log('注釈をクリアします');
            this.annotations = [];
            
            if (typeof annotationLayer !== 'undefined') {
                annotationLayer.clear();
            }
            
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

/**
 * WebSocket同期モジュール - Socket.IO
 */
class SyncManager {
    constructor() {
        this.socket = null;
        this.roomId = null;
        this.role = null;
        this.connected = false;
        this.syncEnabled = true;
        this.callbacks = {};
    }
    
    async init(roomId, role, callbacks = {}) {
        this.roomId = roomId;
        this.role = role;
        this.callbacks = callbacks;
        
        // Socket.IO接続
        this.socket = io({
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });
        
        this.setupEventListeners();
        
        // 接続待機
        await this.waitForConnection();
        
        // ルーム参加
        this.socket.emit('room:join', {
            room_id: roomId,
            role: role,
            name: this.getUserName()
        });
    }
    
    waitForConnection() {
        return new Promise((resolve) => {
            if (this.connected) {
                resolve();
            } else {
                this.socket.once('connected', () => {
                    resolve();
                });
            }
        });
    }
    
    setupEventListeners() {
        // 接続
        this.socket.on('connected', (data) => {
            console.log('WebSocket接続:', data.sid);
            this.connected = true;
        });
        
        // 切断
        this.socket.on('disconnect', () => {
            console.log('WebSocket切断');
            this.connected = false;
            this.updateSyncIndicator(false);
        });
        
        // 再接続
        this.socket.on('reconnect', () => {
            console.log('WebSocket再接続');
            this.socket.emit('room:join', {
                room_id: this.roomId,
                role: this.role,
                name: this.getUserName()
            });
        });
        
        // ルーム状態受信（途中参加時）
        this.socket.on('room:state', async (state) => {
            console.log('ルーム状態受信:', state);
            
            // 教材読み込み
            await viewer.loadMaterial(state.material_id);
            
            // 現在ページへ
            viewer.goToPage(state.current_page);
            
            // 同期状態
            this.syncEnabled = state.sync_enabled;
            this.updateSyncIndicator(state.sync_enabled);
            
            // 注釈復元
            this.renderAnnotations(state.annotations);
            
            if (this.callbacks.onRoomState) {
                this.callbacks.onRoomState(state);
            }
        });
        
        // ページ変更
        this.socket.on('page:changed', (data) => {
            console.log('ページ変更:', data.page_number);
            
            if (this.syncEnabled && this.role === 'student') {
                viewer.goToPage(data.page_number);
            }
            
            if (this.callbacks.onPageChange) {
                this.callbacks.onPageChange(data.page_number);
            }
        });
        
        // 同期ON/OFF
        this.socket.on('sync:toggled', (data) => {
            console.log('同期状態:', data.enabled);
            this.syncEnabled = data.enabled;
            this.updateSyncIndicator(data.enabled);
            
            if (this.callbacks.onSyncToggle) {
                this.callbacks.onSyncToggle(data.enabled);
            }
        });
        
        // 注釈追加
        this.socket.on('annotation:added', (annotation) => {
            this.addAnnotation(annotation);
            
            if (this.callbacks.onAnnotationAdded) {
                this.callbacks.onAnnotationAdded(annotation);
            }
        });
        
        // 注釈削除
        this.socket.on('annotation:removed', (data) => {
            this.removeAnnotation(data.id);
            
            if (this.callbacks.onAnnotationRemoved) {
                this.callbacks.onAnnotationRemoved(data.id);
            }
        });
        
        // 注釈クリア
        this.socket.on('annotation:cleared', () => {
            this.clearAnnotations();
            
            if (this.callbacks.onAnnotationsCleared) {
                this.callbacks.onAnnotationsCleared();
            }
        });
        
        // 参加者追加
        this.socket.on('participant:joined', (participant) => {
            console.log('参加者追加:', participant);
            
            if (this.callbacks.onParticipantJoined) {
                this.callbacks.onParticipantJoined(participant);
            }
        });
        
        // 参加者退出
        this.socket.on('participant:left', (data) => {
            console.log('参加者退出:', data.id);
            
            if (this.callbacks.onParticipantLeft) {
                this.callbacks.onParticipantLeft(data.id);
            }
        });
        
        // 重要ポイント表示
        this.socket.on('important:show', (data) => {
            this.showImportantCard(data.title, data.points);
        });
        
        // 重要ポイント非表示
        this.socket.on('important:hide', () => {
            this.hideImportantCard();
        });
    }
    
    // ページ変更送信（講師のみ）
    sendPageChange(pageNumber) {
        if (this.role !== 'instructor') return;
        
        this.socket.emit('page:change', {
            room_id: this.roomId,
            page_number: pageNumber
        });
    }
    
    // 同期ON/OFF送信（講師のみ）
    sendSyncToggle(enabled) {
        if (this.role !== 'instructor') return;
        
        this.socket.emit('sync:toggle', {
            room_id: this.roomId,
            enabled: enabled
        });
    }
    
    // 注釈追加送信（講師のみ）
    sendAnnotation(annotation) {
        if (this.role !== 'instructor') return;
        
        this.socket.emit('annotation:add', {
            room_id: this.roomId,
            annotation: annotation
        });
    }
    
    // 注釈削除送信（講師のみ）
    sendAnnotationRemove(annotationId) {
        if (this.role !== 'instructor') return;
        
        this.socket.emit('annotation:remove', {
            room_id: this.roomId,
            annotation_id: annotationId
        });
    }
    
    // 注釈クリア送信（講師のみ）
    sendAnnotationClear() {
        if (this.role !== 'instructor') return;
        
        this.socket.emit('annotation:clear', {
            room_id: this.roomId
        });
    }
    
    // 重要ポイント表示送信（講師のみ）
    sendImportantDisplay(title, points) {
        if (this.role !== 'instructor') return;
        
        this.socket.emit('important:display', {
            room_id: this.roomId,
            title: title,
            points: points
        });
    }
    
    // 重要ポイント非表示送信（講師のみ）
    sendImportantHide() {
        if (this.role !== 'instructor') return;
        
        this.socket.emit('important:hide', {
            room_id: this.roomId
        });
    }
    
    // 注釈描画
    renderAnnotations(annotations) {
        const layer = document.getElementById('annotation-layer');
        layer.innerHTML = '';
        
        annotations.forEach(annotation => {
            this.addAnnotation(annotation);
        });
    }
    
    addAnnotation(annotation) {
        const layer = document.getElementById('annotation-layer');
        
        if (annotation.type === 'pin') {
            const pin = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            pin.setAttribute('cx', `${annotation.data.x}%`);
            pin.setAttribute('cy', `${annotation.data.y}%`);
            pin.setAttribute('r', '10');
            pin.setAttribute('fill', annotation.data.color || 'red');
            pin.setAttribute('stroke', 'white');
            pin.setAttribute('stroke-width', '3');
            pin.setAttribute('data-id', annotation.id);
            pin.classList.add('annotation-pin');
            layer.appendChild(pin);
        }
        // TODO: 他の注釈タイプ実装
    }
    
    removeAnnotation(annotationId) {
        const element = document.querySelector(`[data-id="${annotationId}"]`);
        if (element) {
            element.remove();
        }
    }
    
    clearAnnotations() {
        const layer = document.getElementById('annotation-layer');
        layer.innerHTML = '';
    }
    
    showImportantCard(title, points) {
        const modal = document.getElementById('important-modal');
        document.getElementById('important-title').textContent = title;
        document.getElementById('important-points').innerHTML = points.map(p => `
            <li class="text-lg">• ${p}</li>
        `).join('');
        modal.classList.add('show');
    }
    
    hideImportantCard() {
        document.getElementById('important-modal').classList.remove('show');
    }
    
    updateSyncIndicator(enabled) {
        const indicator = document.getElementById('sync-indicator');
        if (enabled) {
            indicator.classList.remove('inactive');
            indicator.classList.add('active');
            indicator.querySelector('span').textContent = this.role === 'instructor' ? '同期中' : '講師と同期中';
        } else {
            indicator.classList.remove('active');
            indicator.classList.add('inactive');
            indicator.querySelector('span').textContent = '同期停止';
        }
    }
    
    getUserName() {
        // TODO: 実装 - ユーザー名入力
        return this.role === 'instructor' ? '講師' : '受講者';
    }
}

// グローバルインスタンス
const sync = new SyncManager();

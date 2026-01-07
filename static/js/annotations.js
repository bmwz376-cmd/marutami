/**
 * 注釈機能 - ピン、レーザーポインタ、図形描画
 */
class AnnotationLayer {
    constructor() {
        this.annotations = [];
        this.svgLayer = document.getElementById('annotation-layer');
        
        if (!this.svgLayer) {
            console.error('注釈レイヤー (annotation-layer) が見つかりません');
            return;
        }
        
        console.log('注釈レイヤーを初期化しました');
    }
    
    clear() {
        if (!this.svgLayer) return;
        this.svgLayer.innerHTML = '';
        this.annotations = [];
        console.log('注釈をクリアしました');
    }
    
    clearPage(pageNumber) {
        this.annotations = this.annotations.filter(a => a.page_number !== pageNumber);
        this.render();
    }
    
    addAnnotation(annotation) {
        this.annotations.push(annotation);
        this.render();
        console.log('注釈を追加しました:', annotation.type, annotation);
    }
    
    removeAnnotation(annotationId) {
        this.annotations = this.annotations.filter(a => a.id !== annotationId);
        this.render();
        console.log('注釈を削除しました:', annotationId);
    }
    
    render() {
        if (!this.svgLayer) return;
        
        // 現在のページの注釈のみ表示
        const currentPage = viewer ? viewer.currentPage : 1;
        const pageAnnotations = this.annotations.filter(a => a.page_number === currentPage);
        
        // SVGレイヤーをクリア
        this.svgLayer.innerHTML = '';
        
        // 各注釈を描画
        pageAnnotations.forEach(annotation => {
            this.renderAnnotation(annotation);
        });
    }
    
    renderAnnotation(annotation) {
        const data = annotation.data;
        
        switch (annotation.type) {
            case 'pin':
                this.renderPin(data.x, data.y, data.color || 'red');
                break;
            case 'laser':
                this.renderLaser(data.x, data.y);
                break;
            case 'circle':
                this.renderCircle(data.x, data.y, data.radius || 50, data.color || 'red');
                break;
            case 'rect':
                this.renderRect(data.x, data.y, data.width || 100, data.height || 100, data.color || 'red');
                break;
            case 'pen':
                this.renderPen(data.points, data.color || 'red');
                break;
        }
    }
    
    renderPin(x, y, color) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'annotation-pin');
        
        // 外側の円（白い枠）
        const outerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        outerCircle.setAttribute('cx', `${x}%`);
        outerCircle.setAttribute('cy', `${y}%`);
        outerCircle.setAttribute('r', '12');
        outerCircle.setAttribute('fill', 'white');
        outerCircle.setAttribute('stroke', color);
        outerCircle.setAttribute('stroke-width', '3');
        
        // 内側の円
        const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        innerCircle.setAttribute('cx', `${x}%`);
        innerCircle.setAttribute('cy', `${y}%`);
        innerCircle.setAttribute('r', '8');
        innerCircle.setAttribute('fill', color);
        
        group.appendChild(outerCircle);
        group.appendChild(innerCircle);
        this.svgLayer.appendChild(group);
    }
    
    renderLaser(x, y) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'annotation-laser');
        circle.setAttribute('cx', `${x}%`);
        circle.setAttribute('cy', `${y}%`);
        circle.setAttribute('r', '20');
        circle.setAttribute('fill', 'yellow');
        circle.setAttribute('opacity', '0.7');
        
        // アニメーション
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'r');
        animate.setAttribute('values', '20;30;20');
        animate.setAttribute('dur', '1s');
        animate.setAttribute('repeatCount', 'indefinite');
        
        circle.appendChild(animate);
        this.svgLayer.appendChild(circle);
    }
    
    renderCircle(x, y, radius, color) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'annotation-circle');
        circle.setAttribute('cx', `${x}%`);
        circle.setAttribute('cy', `${y}%`);
        circle.setAttribute('r', radius);
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', color);
        circle.setAttribute('stroke-width', '3');
        
        this.svgLayer.appendChild(circle);
    }
    
    renderRect(x, y, width, height, color) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('class', 'annotation-rect');
        rect.setAttribute('x', `${x}%`);
        rect.setAttribute('y', `${y}%`);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('fill', 'none');
        rect.setAttribute('stroke', color);
        rect.setAttribute('stroke-width', '3');
        
        this.svgLayer.appendChild(rect);
    }
    
    renderPen(points, color) {
        if (!points || points.length < 2) return;
        
        let pathData = `M ${points[0].x}% ${points[0].y}%`;
        for (let i = 1; i < points.length; i++) {
            pathData += ` L ${points[i].x}% ${points[i].y}%`;
        }
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'annotation-pen');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', '3');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        
        this.svgLayer.appendChild(path);
    }
    
    updateSize() {
        if (!this.svgLayer || !this.svgLayer.parentElement) return;
        
        const container = this.svgLayer.parentElement;
        const rect = container.getBoundingClientRect();
        
        this.svgLayer.setAttribute('width', rect.width);
        this.svgLayer.setAttribute('height', rect.height);
        this.svgLayer.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    }
}

// グローバルインスタンス
const annotationLayer = new AnnotationLayer();

// ページ変更時に注釈を再描画
document.addEventListener('pagechange', () => {
    if (annotationLayer) {
        annotationLayer.render();
    }
});

// ウィンドウリサイズ時にSVGレイヤーのサイズを更新
window.addEventListener('resize', () => {
    if (annotationLayer) {
        annotationLayer.updateSize();
    }
});

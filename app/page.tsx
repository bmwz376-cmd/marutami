import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-blue-50 to-green-50">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">
          建築施工管理 教材プラットフォーム
        </h1>
        
        <div className="mb-12 text-center text-gray-600">
          <p className="text-lg">Construction Training Material Platform</p>
          <p className="text-sm mt-2">Narukawa Co. × NL-DG Co., Ltd.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* 講師用エントリー */}
          <Link 
            href="/materials"
            className="group rounded-lg border border-blue-300 bg-white px-5 py-8 transition-all hover:border-blue-500 hover:bg-blue-50 hover:shadow-lg"
          >
            <h2 className="mb-3 text-2xl font-semibold text-blue-600">
              講師モード{' '}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                →
              </span>
            </h2>
            <p className="text-sm text-gray-600">
              教材管理・講義ルーム作成・プレゼンターモード
            </p>
            <ul className="mt-4 text-xs text-gray-500 space-y-1">
              <li>• ページ同期制御</li>
              <li>• 注釈・ピン追加</li>
              <li>• 重要ポイント表示</li>
            </ul>
          </Link>

          {/* 受講者用エントリー */}
          <div className="rounded-lg border border-green-300 bg-white px-5 py-8">
            <h2 className="mb-3 text-2xl font-semibold text-green-600">
              受講者モード
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              講師から共有されたURLでルームに参加
            </p>
            <div className="bg-gray-50 p-3 rounded text-xs font-mono text-gray-700">
              例: /room/[roomId]
            </div>
            <ul className="mt-4 text-xs text-gray-500 space-y-1">
              <li>• リアルタイム同期</li>
              <li>• 用語・チェックリスト表示</li>
              <li>• 講師注釈の共有</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">対応教材</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-600">
            <div className="bg-white p-2 rounded border">③仮設工事</div>
            <div className="bg-white p-2 rounded border">④山留工事</div>
            <div className="bg-white p-2 rounded border">⑤杭工事</div>
            <div className="bg-white p-2 rounded border">⑥掘削・山留支保工</div>
            <div className="bg-white p-2 rounded border">⑦躯体・型枠工事</div>
            <div className="bg-white p-2 rounded border">⑧鉄筋工事1</div>
            <div className="bg-white p-2 rounded border">⑨鉄筋工事2</div>
            <div className="bg-white p-2 rounded border">⑩コンクリート工事1</div>
            <div className="bg-white p-2 rounded border">⑪コンクリート工事2</div>
          </div>
        </div>
      </div>
    </main>
  )
}

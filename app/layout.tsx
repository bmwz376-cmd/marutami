import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '建築施工管理 教材プラットフォーム',
  description: 'Web-based construction training material platform with real-time instructor synchronization',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  )
}

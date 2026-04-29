'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User, WorkLog } from '@/types/database'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  // 사용자 정보 가져오기
  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      setUser(userData)
      setLoading(false)
    }

    getUser()
  }, [router])

  // 업무일지 목록 가져오기
  useEffect(() => {
    if (!user) return

    const fetchWorkLogs = async () => {
      const { data } = await supabase
        .from('work_logs')
        .select('*')
        .eq('department', user.department)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      setWorkLogs(data || [])
    }

    fetchWorkLogs()
  }, [user])

  // 업무일지 등록
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !content.trim()) {
      alert('내용을 입력해주세요.')
      return
    }

    setSubmitting(true)

    const { error } = await supabase
      .from('work_logs')
      .insert({
        date,
        content: content.trim(),
        user_id: user.id,
        department: user.department
      })

    if (error) {
      alert('등록 실패: ' + error.message)
    } else {
      alert('업무일지가 등록되었습니다.')
      setContent('')
      
      // 목록 새로고침
      const { data } = await supabase
        .from('work_logs')
        .select('*')
        .eq('department', user.department)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      setWorkLogs(data || [])
    }

    setSubmitting(false)
  }

  // 엑셀 다운로드
  const handleExcelDownload = async () => {
    if (!user) return

    const { data } = await supabase
      .from('work_logs')
      .select('*')
      .eq('department', user.department)
      .order('date', { ascending: false })

    if (!data || data.length === 0) {
      alert('다운로드할 데이터가 없습니다.')
      return
    }

    // CSV 형식으로 변환
    const headers = ['날짜', '내용', '작성일시']
    const rows = data.map(log => [
      log.date,
      log.content,
      new Date(log.created_at).toLocaleString('ko-KR')
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // BOM 추가 (한글 깨짐 방지)
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${user.department}_업무일지_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // 로그아웃
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    )
  }

  if (!user) return

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {user.department === 'admin' ? '관리자' : 
                 user.department === 'electric' ? '전기팀' :
                 user.department === 'facility' ? '시설팀' :
                 user.department === 'fire' ? '소방팀' : '정비팀'} 업무일지
              </h1>
              <p className="text-gray-600 mt-2">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 업무일지 등록 폼 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">업무일지 등록</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                날짜
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                업무 내용
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="오늘의 업무 내용을 입력하세요..."
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? '등록 중...' : '업무일지 등록'}
            </button>
          </form>
        </div>

        {/* 업무일지 목록 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">업무일지 목록</h2>
            <button
              onClick={handleExcelDownload}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              엑셀 다운로드
            </button>
          </div>
          
          <div className="space-y-4">
            {workLogs.length === 0 ? (
              <p className="text-center text-gray-500 py-8">등록된 업무일지가 없습니다.</p>
            ) : (
              workLogs.map((log) => (
                <div
                  key={log.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-lg font-semibold text-indigo-600">
                      {log.date}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {log.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}